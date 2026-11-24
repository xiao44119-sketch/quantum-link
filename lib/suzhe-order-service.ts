import { metric } from "@vercel/functions";
import { STORE_PRODUCTS } from "@/config/store-products";
import {
  ActivationLine,
  DeliveredItem,
  ProductVariant,
  RetailOrderRecord,
  StoreProduct,
} from "./types";
import {
  getVaultOrderById,
  getVaultStoreConfig,
  updateVaultOrder,
} from "./cloud-vault";

const SUZHE_ORDER_BASE = (
  process.env.SUZHE_MAIN_BASE_URL || "https://suzhe.ai"
).replace(/\/+$/, "") + "/api/agent/v1";

export interface UpstreamAgentProduct {
  product: string;
  name: string;
  category: string;
  subtitle?: string;
  description?: string;
  spec?: { label?: string; value?: string };
  cover_image?: string;
  price: string;
  price_fen: number;
  agent_price?: boolean;
  retail_price?: string;
  retail_price_fen?: number;
  available: boolean;
  stock: number;
  min_quantity?: number;
  max_quantity?: number;
  delivery_type?: string;
  delivery_label?: string;
  requires_activation?: boolean;
  requires_terms?: boolean;
  variants?: ProductVariant[];
}

let upstreamCatalogCache: {
  items: UpstreamAgentProduct[];
  fetchedAt: number;
} | null = null;

async function getOrderApiKey(): Promise<string | null> {
  const envKey = process.env.SUZHE_ORDER_KEY?.trim();
  if (envKey && envKey.startsWith("szb_")) return envKey;
  const cfg = await getVaultStoreConfig();
  if (cfg.suzheOrderKey && cfg.suzheOrderKey.trim().startsWith("szb_")) {
    return cfg.suzheOrderKey.trim();
  }
  return null;
}

function inferActivationLine(productCode: string, requiresActivation?: boolean): ActivationLine | "none" {
  if (!requiresActivation && productCode !== "gemini_pixel_6m_9") return "none";
  if (productCode.startsWith("gpt_")) return "chatgpt";
  if (productCode.includes("grok")) return "grok";
  if (productCode.includes("sheerid")) return "sheerid";
  if (productCode.includes("gemini_pixel")) return "gemini_pro";
  if (productCode.includes("codex_sms")) return "codex_sms";
  if (productCode.startsWith("tg_premium")) return "tg_premium";
  if (productCode.includes("muse_invite")) return "muse_boost";
  return requiresActivation ? "chatgpt" : "none";
}

function inferPrefix(productCode: string, line: ActivationLine | "none"): string {
  if (productCode === "gpt_plus_ch2") return "PLS-";
  if (productCode === "gpt_pro_5x_660") return "P10X-";
  if (productCode === "gpt_pro_20x_1350") return "P20X-";
  if (line === "sheerid") return "GSTU-";
  if (line === "codex_sms") return "SMS-";
  if (line === "tg_premium") return "TGPREM-";
  if (line === "grok") return "GROK-";
  if (line === "muse_boost") return "MB-";
  if (line === "gemini_pro") return "G-3MON-";
  if (productCode === "card_virtual_3") return "CARD-";
  return "AUTO-";
}

function fenToYuan(fen: number): string {
  const val = (fen / 100).toFixed(2);
  return val.endsWith(".00") ? val.slice(0, -3) : val;
}

/**
 * 拉取苏哲代理中心 43+ 全量商品目录与实时库存/拿货价 (20秒内存缓存)
 */
export async function fetchUpstreamAgentCatalog(forceRefresh = false): Promise<{
  success: boolean;
  items: UpstreamAgentProduct[];
  fromUpstream: boolean;
  error?: string;
}> {
  if (
    !forceRefresh &&
    upstreamCatalogCache &&
    Date.now() - upstreamCatalogCache.fetchedAt < 20_000
  ) {
    return { success: true, items: upstreamCatalogCache.items, fromUpstream: true };
  }

  const key = await getOrderApiKey();
  if (!key) {
    return { success: false, items: [], fromUpstream: false, error: "missing_order_key" };
  }

  const startedAt = performance.now();
  try {
    const res = await fetch(`${SUZHE_ORDER_BASE}/products`, {
      headers: { "X-API-Key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      metric("suzhe.catalog.fetch", 1, { outcome: "error" });
      return {
        success: false,
        items: upstreamCatalogCache?.items || [],
        fromUpstream: false,
        error: data.error || `HTTP_${res.status}`,
      };
    }

    const items: UpstreamAgentProduct[] = Array.isArray(data.items) ? data.items : [];
    upstreamCatalogCache = { items, fetchedAt: Date.now() };
    metric("suzhe.catalog.fetch", 1, { outcome: "success" });
    metric("suzhe.catalog.duration_ms", performance.now() - startedAt);
    return { success: true, items, fromUpstream: true };
  } catch (err: any) {
    metric("suzhe.catalog.fetch", 1, { outcome: "network_error" });
    return {
      success: false,
      items: upstreamCatalogCache?.items || [],
      fromUpstream: false,
      error: err?.message || "network_error",
    };
  }
}

/**
 * 将苏哲实时目录、本站精修模板与站长后台自定义覆盖规则合并为最终商城商品列表
 */
export async function getMergedStorefrontProducts(options: {
  includeDisabled?: boolean;
  forceRefresh?: boolean;
} = {}): Promise<{
  products: StoreProduct[];
  fromUpstream: boolean;
}> {
  const [cfg, upstream] = await Promise.all([
    getVaultStoreConfig(),
    fetchUpstreamAgentCatalog(Boolean(options.forceRefresh)),
  ]);

  const templateMap = new Map<string, StoreProduct>();
  for (const t of STORE_PRODUCTS) {
    templateMap.set(t.id, t);
  }

  const upstreamMap = new Map<string, UpstreamAgentProduct>();
  for (const u of upstream.items) {
    upstreamMap.set(u.product, u);
  }

  const overrides = cfg.productOverrides || {};
  const markupFactor = 1 + Math.max(cfg.globalMarkupPercent ?? 22, 0) / 100;
  const minProfitFen = Math.max(cfg.minProfitFen ?? 300, 0);

  const allProductCodes = new Set<string>([
    ...STORE_PRODUCTS.map((p) => p.id),
    ...upstream.items.map((u) => u.product),
  ]);

  const merged: StoreProduct[] = [];

  for (const code of allProductCodes) {
    const tpl = templateMap.get(code);
    const up = upstreamMap.get(code);
    const ov = overrides[code];

    // 默认策略：精选模板内的商品默认上架（若有货或站长开启），其余苏哲长尾商品默认在后台供站长一键勾选上架
    const defaultEnabled = tpl ? true : false;
    const enabled = ov?.enabled !== undefined ? ov.enabled : defaultEnabled;

    if (!options.includeDisabled && !enabled) {
      continue;
    }

    const wholesaleFen = up?.price_fen ?? tpl?.wholesalePriceFen ?? 1000;
    const autoRetailFen = Math.max(
      Math.ceil((wholesaleFen * markupFactor) / 10) * 10,
      wholesaleFen + minProfitFen
    );

    // 成本保护：即使模板默认价低于上游涨价后的代理价，也自动抬升至成本之上；若站长手动指定了 retailPriceFen 则以站长为准
    let retailFen = ov?.retailPriceFen ?? tpl?.retailPriceFen ?? autoRetailFen;
    if (ov?.retailPriceFen === undefined && retailFen <= wholesaleFen) {
      retailFen = autoRetailFen;
    }

    const stock = up ? up.stock : (tpl?.stock ?? 99);
    const available = up ? Boolean(up.available && up.stock > 0) : true;
    const stockStatus: StoreProduct["stockStatus"] = !available || stock <= 0
      ? "暂时缺货"
      : stock <= 8
      ? "库存紧张"
      : tpl?.stockStatus === "极速秒发"
      ? "极速秒发"
      : "充足现货";

    const line = tpl?.activationLine ?? inferActivationLine(code, up?.requires_activation);
    const category: StoreProduct["category"] =
      tpl?.category ||
      (line === "chatgpt" || line === "grok" || line === "gemini_pro" || line === "muse_boost"
        ? "flagship"
        : line !== "none" || code === "card_virtual_3"
        ? "verify"
        : "account");

    merged.push({
      id: code,
      title: ov?.title || tpl?.title || up?.name || code,
      sub: ov?.sub || tpl?.sub || up?.subtitle || up?.category || "苏哲官方直连自动交付",
      badge: ov?.badge || tpl?.badge || up?.category || "官方直发",
      price: fenToYuan(retailFen),
      retailPriceFen: retailFen,
      wholesalePrice: (wholesaleFen / 100).toFixed(2),
      wholesalePriceFen: wholesaleFen,
      originalPrice: ov?.originalPrice || tpl?.originalPrice || fenToYuan(Math.round(retailFen * 1.25)),
      period: ov?.period || tpl?.period || up?.spec?.value || up?.delivery_label || "自动交付",
      prefix: tpl?.prefix || inferPrefix(code, line),
      description:
        tpl?.description ||
        up?.description ||
        `${up?.name || code} · 官方正版代理链路实时出货，安全稳定。`,
      features: tpl?.features || [
        `交付形式：${up?.delivery_label || up?.delivery_type || "官方自动发卡"}`,
        up?.requires_activation
          ? "发卡后直接在本站【02. 全能激活台】一键自助开通"
          : "免激活成品凭证，核销后页面直接提取使用",
        "云端保险柜全程留档，随时凭订单号找回卡密",
      ],
      isPopular: ov?.isPopular !== undefined ? ov.isPopular : Boolean(tpl?.isPopular),
      enabled,
      available,
      stock,
      stockStatus,
      category,
      requiresActivation: up?.requires_activation ?? tpl?.requiresActivation ?? (line !== "none"),
      requiresTerms: Boolean(up?.requires_terms || tpl?.requiresTerms),
      activationLine: line,
      deliveryType: up?.delivery_type || tpl?.deliveryType || "cdk",
      deliveryLabel: up?.delivery_label,
      variants: up?.variants && up.variants.length > 0 ? up.variants : tpl?.variants,
      sortOrder: ov?.sortOrder ?? tpl?.sortOrder ?? 500,
    });
  }

  // 有货优先 + sortOrder 升序
  merged.sort((a, b) => {
    if (!options.includeDisabled) {
      const aAvail = a.available ? 0 : 1;
      const bAvail = b.available ? 0 : 1;
      if (aAvail !== bAvail) return aAvail - bAvail;
    }
    return (a.sortOrder ?? 500) - (b.sortOrder ?? 500);
  });

  return { products: merged, fromUpstream: upstream.fromUpstream };
}

/**
 * 查询苏哲下单 API 账户实时余额 (CNY)
 */
export async function getSuZheOrderBalance(customOrderKey?: string): Promise<{
  success: boolean;
  balance?: string;
  balance_fen?: number;
  currency?: string;
  error?: string;
}> {
  const key = customOrderKey?.trim() || (await getOrderApiKey());
  if (!key) {
    return { success: false, error: "未配置 SUZHE_ORDER_KEY (szb_...)" };
  }

  try {
    const res = await fetch(`${SUZHE_ORDER_BASE}/balance`, {
      headers: { "X-API-Key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || data.error || `HTTP ${res.status}` };
    }
    return {
      success: true,
      balance: data.balance,
      balance_fen: data.balance_fen,
      currency: data.currency || "CNY",
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "网络请求失败" };
  }
}

/**
 * 查询苏哲代理账户资金流水
 */
export async function getSuZheAgentLedger(limit = 30) {
  const key = await getOrderApiKey();
  if (!key) {
    return { success: false, error: "missing_order_key", items: [] };
  }

  try {
    const res = await fetch(`${SUZHE_ORDER_BASE}/ledger?limit=${Math.min(limit, 100)}`, {
      headers: { "X-API-Key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || "network_error", items: [] };
  }
}

/**
 * 核心履约动作：站长确认收款（或易支付回调成功）后，凭幂等 suzhe_request_id 调用苏哲 /orders 自动扣余额拿真卡
 */
export async function fulfillOrderViaSuZhe(orderId: string): Promise<{
  success: boolean;
  order?: RetailOrderRecord | null;
  error?: string;
  detail?: string;
}> {
  const startedAt = performance.now();
  const order = await getVaultOrderById(orderId);
  if (!order) {
    return { success: false, error: "order_not_found", detail: "订单不存在" };
  }

  // 幂等保护：若已成功出卡，直接返回已有交付物，绝不重复扣款
  if (
    (order.fulfillment_status === "delivered" || order.fulfillment_status === "manual_delivered") &&
    order.delivered_items.length > 0
  ) {
    return { success: true, order };
  }

  const key = await getOrderApiKey();
  if (!key) {
    return {
      success: false,
      error: "missing_order_key",
      detail: "服务端尚未配置 szb_ 下单密钥，请先配置或使用手动补发卡密",
    };
  }

  const requestBody: Record<string, unknown> = {
    product: order.product_code,
    quantity: order.quantity,
    request_id: order.suzhe_request_id,
    accept_terms: true,
  };
  if (order.variant) {
    requestBody.variant = order.variant;
  }

  let upstreamOrder: any = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${SUZHE_ORDER_BASE}/orders`, {
        method: "POST",
        headers: {
          "X-API-Key": key,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(requestBody),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.order) {
        upstreamOrder = data.order;
        break;
      }

      if (res.status !== 429 && res.status < 500) {
        const errCode = data?.error || `http_${res.status}`;
        let readable = data?.message || "上游下单失败";
        if (errCode === "insufficient_balance") {
          readable =
            "苏哲代理账户余额不足！请前往 suzhe.ai/agent#wallet 充值后再点重试（本单 request_id 已安全保留，不丢单），或右侧手动粘贴卡密发货。";
        } else if (errCode === "out_of_stock") {
          readable = "上游该规格刚刚售罄，请稍后重试或联系买家退款/换规格。";
        }
        await updateVaultOrder(orderId, {
          payment_status: "paid",
          paid_at: order.paid_at || new Date().toISOString(),
          fulfillment_status: "failed",
          error_detail: `[${errCode}] ${readable}`,
        });
        metric("orders.fulfill", 1, { outcome: errCode });
        return { success: false, error: errCode, detail: readable };
      }
    } catch {
      // 网络超时：按苏哲文档规范，优先用原 request_id 查询是否已成交！
      try {
        const checkRes = await fetch(
          `${SUZHE_ORDER_BASE}/orders?request_id=${encodeURIComponent(order.suzhe_request_id)}`,
          {
            headers: { "X-API-Key": key },
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
          }
        );
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData?.success && checkData?.order) {
            upstreamOrder = checkData.order;
            break;
          }
        }
      } catch {
        // Ignore and continue backoff
      }
    }

    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }

  if (!upstreamOrder) {
    await updateVaultOrder(orderId, {
      payment_status: "paid",
      paid_at: order.paid_at || new Date().toISOString(),
      fulfillment_status: "failed",
      error_detail: "请求苏哲下单网关超时，请点击重试（幂等保护不会重复扣款）",
    });
    metric("orders.fulfill", 1, { outcome: "timeout" });
    return {
      success: false,
      error: "upstream_timeout",
      detail: "请求苏哲下单网关超时，请点击重试（幂等 request_id 保护绝不会重复扣款）",
    };
  }

  // 若订单处于 processing，短暂轮询最多 4 次 (每次 3s)
  for (let i = 0; upstreamOrder.status === "processing" && i < 4; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const pollRes = await fetch(
        `${SUZHE_ORDER_BASE}/orders/${encodeURIComponent(upstreamOrder.order_id)}`,
        {
          headers: { "X-API-Key": key },
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        }
      );
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        if (pollData?.order) upstreamOrder = pollData.order;
      }
    } catch {
      break;
    }
  }

  const nowIso = new Date().toISOString();
  const deliveredItems: DeliveredItem[] = Array.isArray(upstreamOrder.items)
    ? upstreamOrder.items
    : [];

  const updated = await updateVaultOrder(orderId, {
    suzhe_order_id: upstreamOrder.order_id,
    wholesale_unit_fen: upstreamOrder.unit_price_fen ?? order.wholesale_unit_fen,
    wholesale_total_fen: upstreamOrder.total_fen ?? order.wholesale_total_fen,
    payment_status: upstreamOrder.status === "refunded" ? "refunded" : "paid",
    paid_at: order.paid_at || nowIso,
    fulfillment_status:
      upstreamOrder.status === "delivered"
        ? "delivered"
        : upstreamOrder.status === "processing"
        ? "processing"
        : "failed",
    delivered_items: deliveredItems,
    delivered_at: upstreamOrder.status === "delivered" ? nowIso : null,
    error_detail:
      upstreamOrder.status === "refunded"
        ? upstreamOrder.refund_reason || upstreamOrder.message || "上游未能履约，已自动退回代理余额"
        : upstreamOrder.message || null,
  });

  metric("orders.fulfill", 1, { outcome: upstreamOrder.status || "unknown" });
  metric("orders.fulfill_duration_ms", performance.now() - startedAt);

  return {
    success: upstreamOrder.status === "delivered" || upstreamOrder.status === "processing",
    order: updated,
    detail: upstreamOrder.message,
  };
}
