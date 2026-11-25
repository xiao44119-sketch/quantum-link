import {
  VaultStoreConfig,
  RetailOrderRecord,
  TaskRecord,
  ActivationLine,
} from "./types";

export interface TicketRecord {
  ticket_id: string;
  id?: string; // alias for frontend compatibility
  order_id: string;
  category: "409_conflict" | "card_invalid" | "subscription_dropped" | "general";
  category_name: string;
  contact: string;
  description: string;
  status: "pending" | "processing" | "resolved";
  created_at: string;
  reply?: string | null;
  replied_at?: string | null;
}

export interface MediaAssetRecord {
  id: string;
  mime_type: string;
  data_base64: string;
  byte_size: number;
  created_at?: string;
}

const DEFAULT_STORE_CONFIG: VaultStoreConfig = {
  adminSecret: process.env.ADMIN_SECRET || "admin888",
  paymentMode: "manual_qr",
  sandboxDemoEnabled: false,
  globalMarkupPercent: 22,
  minProfitFen: 300,
  contact: {
    wechat: "18300425760",
    wechatGroupTitle: "Finn 极客 AI 交流群",
    wechatGroupNote: "扫码添加站长微信后发送【加群】，即可受邀进入 VIP 交流群",
    qqGroup: "837192045",
    telegramChannel: "https://t.me/finn_vibe_link",
    telegramGroup: "https://t.me/finn_vibe_chat",
    email: "support@quantum-link.io",
    qrNote: "微信 / 支付宝扫码付款（备注订单号极速自动发卡）",
    noticeText:
      "苏哲 AI 官方授权直连履约节点 · 支持 ChatGPT Plus/Pro 10x/20x/50x、Grok、Gemini 学生认证、Codex 接码与 TG 会员秒级开通。",
    handlingFeePercent: 0,
    handlingFeeMin: 0,
  },
  productOverrides: {},
};

// In-memory fallback only when SUPABASE_URL is absent in offline local testing
const memFallback = {
  config: { ...DEFAULT_STORE_CONFIG },
  orders: new Map<string, RetailOrderRecord>(),
  tasks: new Map<string, TaskRecord & { card_code: string }>(),
  tickets: [] as TicketRecord[],
  media: new Map<string, MediaAssetRecord>(),
};

function getVaultEnv() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  const secret = process.env.VAULT_SERVER_SECRET?.trim();
  if (!url || !key || !secret) return null;
  return { url: url.replace(/\/+$/, ""), key, secret };
}

export function isCloudVaultActive(): boolean {
  return Boolean(getVaultEnv());
}

async function vaultRest<T = unknown>(
  pathWithQuery: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    prefer?: string;
  } = {}
): Promise<T> {
  const env = getVaultEnv();
  if (!env) {
    throw new Error("CLOUD_VAULT_NOT_CONFIGURED");
  }

  const headers: Record<string, string> = {
    apikey: env.key,
    "x-vault-secret": env.secret,
    "Content-Type": "application/json",
  };
  if (options.prefer) {
    headers["Prefer"] = options.prefer;
  }

  const res = await fetch(`${env.url}/rest/v1/${pathWithQuery}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Vault HTTP ${res.status}: ${errText.slice(0, 240)}`);
  }

  const text = await res.text();
  if (!text) return [] as unknown as T;
  return JSON.parse(text) as T;
}

// ==================== 1. Store Config & Admin Auth ====================

let configCache: { data: VaultStoreConfig; expiresAt: number } | null = null;

export async function getVaultStoreConfig(skipCache = false): Promise<VaultStoreConfig> {
  if (!skipCache && configCache && configCache.expiresAt > Date.now()) {
    return configCache.data;
  }

  if (!isCloudVaultActive()) {
    return memFallback.config;
  }

  try {
    const rows = await vaultRest<Array<{ key: string; value: Partial<VaultStoreConfig> }>>(
      "ql_settings?key=eq.store_config&select=key,value&limit=1"
    );
    const stored = rows[0]?.value || {};
    const merged: VaultStoreConfig = {
      ...DEFAULT_STORE_CONFIG,
      ...stored,
      adminSecret: process.env.ADMIN_SECRET || stored.adminSecret || DEFAULT_STORE_CONFIG.adminSecret,
      contact: {
        ...DEFAULT_STORE_CONFIG.contact,
        ...(stored.contact || {}),
      },
      notify: {
        enabled: true,
        ...(stored.notify || {}),
      },
      productOverrides: stored.productOverrides || {},
    };
    configCache = { data: merged, expiresAt: Date.now() + 8000 };
    return merged;
  } catch (err) {
    console.error("[CloudVault] Read store_config failed, using default:", err);
    return memFallback.config;
  }
}

export async function saveVaultStoreConfig(patch: Partial<VaultStoreConfig>): Promise<VaultStoreConfig> {
  const current = await getVaultStoreConfig(true);
  const next: VaultStoreConfig = {
    ...current,
    ...patch,
    contact: {
      ...current.contact,
      ...(patch.contact || {}),
    },
    notify:
      patch.notify !== undefined
        ? { ...(current.notify || {}), ...patch.notify }
        : current.notify,
    productOverrides: patch.productOverrides !== undefined ? patch.productOverrides : current.productOverrides,
  };

  memFallback.config = next;
  configCache = { data: next, expiresAt: Date.now() + 8000 };

  if (isCloudVaultActive()) {
    await vaultRest("ql_settings?on_conflict=key", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: {
        key: "store_config",
        value: next,
        updated_at: new Date().toISOString(),
      },
    });
  }

  return next;
}

export async function verifyAdminSecret(provided: string | null | undefined): Promise<boolean> {
  if (!provided || !provided.trim()) return false;
  const trimmed = provided.trim();
  const envAdmin = process.env.ADMIN_SECRET?.trim();
  if (envAdmin && trimmed === envAdmin) return true;
  const cfg = await getVaultStoreConfig();
  return Boolean(cfg.adminSecret && trimmed === cfg.adminSecret);
}

// ==================== 2. Retail Orders ====================

export async function createVaultOrder(order: RetailOrderRecord): Promise<RetailOrderRecord> {
  memFallback.orders.set(order.order_id, order);

  if (isCloudVaultActive()) {
    const rows = await vaultRest<RetailOrderRecord[]>("ql_orders", {
      method: "POST",
      prefer: "return=representation",
      body: {
        order_id: order.order_id,
        suzhe_request_id: order.suzhe_request_id,
        suzhe_order_id: order.suzhe_order_id || null,
        product_code: order.product_code,
        product_name: order.product_name,
        variant: order.variant || "",
        quantity: order.quantity,
        retail_unit_fen: order.retail_unit_fen,
        retail_total_fen: order.retail_total_fen,
        wholesale_unit_fen: order.wholesale_unit_fen,
        wholesale_total_fen: order.wholesale_total_fen,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        buyer_contact: order.buyer_contact || null,
        payer_note: order.payer_note || null,
        requires_activation: order.requires_activation,
        activation_line: order.activation_line,
        delivered_items: order.delivered_items || [],
        error_detail: order.error_detail || null,
        expires_at: order.expires_at,
        paid_at: order.paid_at || null,
        delivered_at: order.delivered_at || null,
      },
    });
    if (rows[0]) return rows[0];
  }
  return order;
}

export async function getVaultOrderById(orderId: string): Promise<RetailOrderRecord | null> {
  const clean = orderId.trim();
  if (!clean) return null;

  if (isCloudVaultActive()) {
    const rows = await vaultRest<RetailOrderRecord[]>(
      `ql_orders?order_id=eq.${encodeURIComponent(clean)}&limit=1`
    );
    const row = rows[0] || null;
    if (row && row.payment_status === "pending" && new Date(row.expires_at).getTime() < Date.now()) {
      return await updateVaultOrder(clean, { payment_status: "expired" });
    }
    return row;
  }

  const local = memFallback.orders.get(clean) || null;
  if (local && local.payment_status === "pending" && new Date(local.expires_at).getTime() < Date.now()) {
    local.payment_status = "expired";
  }
  return local;
}

export async function updateVaultOrder(
  orderId: string,
  patch: Partial<RetailOrderRecord>
): Promise<RetailOrderRecord | null> {
  const clean = orderId.trim();
  const payload = {
    ...patch,
    updated_at: new Date().toISOString(),
  };

  if (isCloudVaultActive()) {
    const rows = await vaultRest<RetailOrderRecord[]>(
      `ql_orders?order_id=eq.${encodeURIComponent(clean)}`,
      {
        method: "PATCH",
        prefer: "return=representation",
        body: payload,
      }
    );
    return rows[0] || null;
  }

  const existing = memFallback.orders.get(clean);
  if (!existing) return null;
  const merged = { ...existing, ...payload };
  memFallback.orders.set(clean, merged);
  return merged;
}

export async function listVaultOrders(options: {
  limit?: number;
  paymentStatus?: string;
  buyerContact?: string;
} = {}): Promise<RetailOrderRecord[]> {
  const limit = Math.min(Math.max(options.limit || 50, 1), 200);

  if (isCloudVaultActive()) {
    const filters: string[] = [`order=created_at.desc`, `limit=${limit}`];
    if (options.paymentStatus && options.paymentStatus !== "ALL") {
      filters.push(`payment_status=eq.${encodeURIComponent(options.paymentStatus)}`);
    }
    if (options.buyerContact) {
      filters.push(`buyer_contact=ilike.${encodeURIComponent(options.buyerContact.trim())}`);
    }
    return await vaultRest<RetailOrderRecord[]>(`ql_orders?${filters.join("&")}`);
  }

  let list = Array.from(memFallback.orders.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  if (options.paymentStatus && options.paymentStatus !== "ALL") {
    list = list.filter((o) => o.payment_status === options.paymentStatus);
  }
  if (options.buyerContact) {
    const q = options.buyerContact.trim().toLowerCase();
    list = list.filter((o) => (o.buyer_contact || "").toLowerCase() === q);
  }
  return list.slice(0, limit);
}

// ==================== 3. Activation Tasks Persistence ====================

export interface StoredActivationTask extends TaskRecord {
  card_code: string;
}

function rowToTaskRecord(row: any): StoredActivationTask {
  return {
    task_id: row.task_id,
    line: (row.line || "chatgpt") as ActivationLine,
    card_code: row.card_code,
    card_code_masked: row.card_code_masked,
    product_id: row.product_code || "unknown",
    product_name: row.product_name || "AI Subscription",
    target_email: row.target_account || "",
    status: row.status,
    upstream_status: row.upstream_status || "",
    progress: typeof row.progress === "number" ? row.progress : 15,
    finished: Boolean(row.finished),
    success: Boolean(row.success),
    created_at: row.created_at,
    updated_at: row.updated_at,
    log_trace: Array.isArray(row.log_trace) ? row.log_trace : [],
    error_code: row.error_code || undefined,
    error_message: row.message || undefined,
    action_required: row.action_required || null,
    verification_url: row.verification_url || null,
    redirect_url: row.redirect_url || null,
    sms_state: row.extra_data?.sms_state || null,
    disposal_hint: row.extra_data?.disposal_hint || undefined,
    can_retry: row.extra_data?.can_retry,
    forbid_resubmit: row.extra_data?.forbid_resubmit,
    verification_expires_at: row.extra_data?.verification_expires_at || null,
    extra_data: row.extra_data || {},
  };
}

export async function saveVaultActivationTask(task: StoredActivationTask): Promise<void> {
  memFallback.tasks.set(task.task_id, task);

  if (!isCloudVaultActive()) return;

  const extra = {
    ...(task.extra_data || {}),
    sms_state: task.sms_state || null,
    disposal_hint: task.disposal_hint || null,
    can_retry: task.can_retry,
    forbid_resubmit: task.forbid_resubmit,
    verification_expires_at: task.verification_expires_at || null,
  };

  try {
    await vaultRest("ql_activation_tasks?on_conflict=task_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: {
        task_id: task.task_id,
        line: task.line,
        product_code: task.product_id || "",
        product_name: task.product_name || "",
        card_code: task.card_code,
        card_code_masked: task.card_code_masked,
        target_account: task.target_email || "",
        status: task.status,
        upstream_status: task.upstream_status || "",
        progress: task.progress,
        finished: task.finished,
        success: task.success,
        error_code: task.error_code || null,
        message: task.error_message || null,
        action_required: task.action_required || null,
        verification_url: task.verification_url || null,
        redirect_url: task.redirect_url || null,
        extra_data: extra,
        log_trace: Array.isArray(task.log_trace) ? task.log_trace : [],
        updated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[CloudVault] Save activation task warning:", err);
  }
}

export async function getVaultActivationTask(taskId: string): Promise<StoredActivationTask | null> {
  const clean = taskId.trim();
  if (!clean) return null;

  if (isCloudVaultActive()) {
    try {
      const rows = await vaultRest<any[]>(
        `ql_activation_tasks?task_id=eq.${encodeURIComponent(clean)}&limit=1`
      );
      if (rows[0]) return rowToTaskRecord(rows[0]);
    } catch (err) {
      console.error("[CloudVault] Read activation task warning:", err);
    }
  }

  return memFallback.tasks.get(clean) || null;
}

export async function findVaultTasksByCard(cardCode: string): Promise<StoredActivationTask[]> {
  const clean = cardCode.trim();
  if (!clean) return [];

  if (isCloudVaultActive()) {
    try {
      const rows = await vaultRest<any[]>(
        `ql_activation_tasks?card_code=ilike.${encodeURIComponent(clean)}&order=created_at.desc&limit=10`
      );
      return rows.map(rowToTaskRecord);
    } catch {
      return [];
    }
  }

  return Array.from(memFallback.tasks.values()).filter(
    (t) => t.card_code.toUpperCase() === clean.toUpperCase()
  );
}

// ==================== 4. Support Tickets ====================

export async function listVaultTickets(options: {
  orderId?: string;
  ticketId?: string;
} = {}): Promise<TicketRecord[]> {
  if (isCloudVaultActive()) {
    const filters = ["order=created_at.desc", "limit=100"];
    if (options.ticketId) {
      filters.push(`ticket_id=eq.${encodeURIComponent(options.ticketId.trim())}`);
    } else if (options.orderId) {
      filters.push(`order_id=ilike.${encodeURIComponent(options.orderId.trim())}`);
    }
    const rows = await vaultRest<TicketRecord[]>(`ql_tickets?${filters.join("&")}`);
    return rows.map((r) => ({ ...r, id: r.ticket_id }));
  }

  let list = [...memFallback.tickets];
  if (options.ticketId) {
    list = list.filter((t) => t.ticket_id === options.ticketId);
  } else if (options.orderId) {
    const q = options.orderId.trim().toLowerCase();
    list = list.filter((t) => t.order_id.toLowerCase() === q);
  }
  return list.map((r) => ({ ...r, id: r.ticket_id }));
}

export async function createVaultTicket(data: {
  order_id: string;
  category: "409_conflict" | "card_invalid" | "subscription_dropped" | "general";
  contact: string;
  description: string;
}): Promise<TicketRecord> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ticketId = `TK-${dateStr}-${randomHex}`;

  const categoryNames: Record<string, string> = {
    "409_conflict": "409 冲突 / 账号充值报错",
    card_invalid: "卡密无效 / 提示未找到",
    subscription_dropped: "掉订阅 / 申请质保补发",
    general: "其他对账与操作咨询",
  };

  const record: TicketRecord = {
    ticket_id: ticketId,
    id: ticketId,
    order_id: data.order_id.trim(),
    category: data.category,
    category_name: categoryNames[data.category] || "其他咨询",
    contact: data.contact.trim(),
    description: data.description.trim(),
    status: "pending",
    created_at: new Date().toISOString(),
  };

  memFallback.tickets.unshift(record);

  if (isCloudVaultActive()) {
    const rows = await vaultRest<TicketRecord[]>("ql_tickets", {
      method: "POST",
      prefer: "return=representation",
      body: {
        ticket_id: record.ticket_id,
        order_id: record.order_id,
        category: record.category,
        category_name: record.category_name,
        contact: record.contact,
        description: record.description,
        status: record.status,
      },
    });
    if (rows[0]) return { ...rows[0], id: rows[0].ticket_id };
  }

  return record;
}

export async function updateVaultTicket(
  ticketId: string,
  patch: { status?: "pending" | "processing" | "resolved"; reply?: string }
): Promise<TicketRecord | null> {
  const clean = ticketId.trim();
  const body: Record<string, unknown> = {};
  if (patch.status) body.status = patch.status;
  if (patch.reply !== undefined) {
    body.reply = patch.reply;
    body.replied_at = new Date().toISOString();
  }

  if (isCloudVaultActive()) {
    const rows = await vaultRest<TicketRecord[]>(
      `ql_tickets?ticket_id=eq.${encodeURIComponent(clean)}`,
      {
        method: "PATCH",
        prefer: "return=representation",
        body,
      }
    );
    return rows[0] ? { ...rows[0], id: rows[0].ticket_id } : null;
  }

  const idx = memFallback.tickets.findIndex((t) => t.ticket_id === clean);
  if (idx === -1) return null;
  memFallback.tickets[idx] = { ...memFallback.tickets[idx], ...(body as any) };
  return memFallback.tickets[idx];
}

// ==================== 5. Permanent Cloud Media Assets ====================

export async function saveVaultMedia(asset: MediaAssetRecord): Promise<string> {
  memFallback.media.set(asset.id, asset);

  if (isCloudVaultActive()) {
    await vaultRest("ql_media?on_conflict=id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: {
        id: asset.id,
        mime_type: asset.mime_type,
        data_base64: asset.data_base64,
        byte_size: asset.byte_size,
      },
    });
  }

  return `/api/media/${asset.id}`;
}

export async function getVaultMedia(id: string): Promise<MediaAssetRecord | null> {
  const clean = id.trim();
  if (!clean) return null;

  if (isCloudVaultActive()) {
    const rows = await vaultRest<MediaAssetRecord[]>(
      `ql_media?id=eq.${encodeURIComponent(clean)}&limit=1`
    );
    return rows[0] || null;
  }

  return memFallback.media.get(clean) || null;
}
