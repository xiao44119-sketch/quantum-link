import { getStoreData } from "./admin-store-service";

export interface SuZheProductItem {
  product: string;
  name: string;
  name_zh: string;
  key_prefixes: string[];
  wholesale_price: string;
  fee_rate: string;
  fee_per_unit: string;
  cost_price: string;
  min_sell_price: string;
  max_sell_price: string;
  max_qty: number;
  max_qty_now: number;
  currency: string;
  in_stock: boolean;
  note?: string;
  note_zh?: string;
}

export interface SuZheCreateOrderParams {
  product: string;
  quantity?: number;
  sell_price: string;
  client_order_id: string;
  customer_ref?: string;
}

export interface SuZheOrderResponse {
  success: boolean;
  order_id: string;
  client_order_id: string;
  status: "pending" | "paid" | "expired" | "failed";
  delivery_status: string;
  product: string;
  quantity: number;
  unit_sell_price: string;
  amount: string;
  currency: string;
  cost_price: string;
  cost_total: string;
  commission: string;
  qr?: string;
  qr_image_url?: string;
  expires_at: string;
  expires_in: number;
  created_at: string;
  cards: string[];
  error?: string;
  detail?: string;
}

// 内存中用于沙盒测试的订单状态缓存
const mockOrders = new Map<string, SuZheOrderResponse>();

function getEffectiveApiKey(): string | null {
  const storeData = getStoreData();
  const key = process.env.SUZHE_API_KEY || (storeData as any).suzheApiKey;
  if (!key || key === "sandbox_mode" || key.trim() === "") {
    return null;
  }
  return key.trim();
}

function getBaseUrl(): string {
  return process.env.SUZHE_BASE_URL || "https://www.academicgate.org";
}

/**
 * 校验 API Key 连通性
 */
export async function pingSuZheApi(customKey?: string): Promise<{ success: boolean; message?: string; client_name?: string; error?: string }> {
  const apiKey = customKey || getEffectiveApiKey();
  if (!apiKey) {
    return { success: false, error: "未配置 SUZHE_API_KEY (目前处于沙盒模拟模式)" };
  }

  try {
    const res = await fetch(`${getBaseUrl()}/api/v1/ping`, {
      headers: {
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: `网络请求异常: ${err.message}` };
  }
}

/**
 * 获取苏哲收银台商品目录与成本价
 */
export async function getSuZheCheckoutProducts(): Promise<{ success: boolean; items: SuZheProductItem[]; isSandbox?: boolean }> {
  const apiKey = getEffectiveApiKey();

  if (apiKey) {
    try {
      const res = await fetch(`${getBaseUrl()}/api/v1/checkout/products`, {
        headers: { "X-API-Key": apiKey },
        next: { revalidate: 30 },
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, items: data.items || [] };
      }
    } catch (e) {
      console.error("Fetch SuZhe checkout products failed:", e);
    }
  }

  // 沙盒模拟备用数据
  return {
    success: true,
    isSandbox: true,
    items: [
      {
        product: "gpt_plus",
        name: "ChatGPT Plus",
        name_zh: "ChatGPT Plus 官方正规代充",
        key_prefixes: ["PH-"],
        wholesale_price: "110.00",
        fee_rate: "0.012",
        fee_per_unit: "1.32",
        cost_price: "111.32",
        min_sell_price: "111.32",
        max_sell_price: "238.00",
        max_qty: 100,
        max_qty_now: 99,
        currency: "CNY",
        in_stock: true,
        note_zh: "发 PH- 官方卡密，一人一卡正规结算",
      },
      {
        product: "claude_pro",
        name: "Claude Pro",
        name_zh: "Claude Pro 满血版",
        key_prefixes: ["CLAUDE-"],
        wholesale_price: "128.00",
        fee_rate: "0.012",
        fee_per_unit: "1.53",
        cost_price: "129.53",
        min_sell_price: "129.53",
        max_sell_price: "258.00",
        max_qty: 50,
        max_qty_now: 42,
        currency: "CNY",
        in_stock: true,
        note_zh: "发 CLAUDE- 满血 3.5 Sonnet 卡密",
      },
      {
        product: "gpt_pro_20x_new",
        name: "ChatGPT Pro 20x · New",
        name_zh: "ChatGPT Pro 20x 算力旗舰版",
        key_prefixes: ["PRO20SPECIAL-"],
        wholesale_price: "560.00",
        fee_rate: "0.012",
        fee_per_unit: "6.72",
        cost_price: "566.72",
        min_sell_price: "566.72",
        max_sell_price: "899.00",
        max_qty: 20,
        max_qty_now: 15,
        currency: "CNY",
        in_stock: true,
        note_zh: "发 PRO20SPECIAL- 顶格算力卡密",
      },
    ],
  };
}

/**
 * 创建全托管收款订单
 */
export async function createSuZheCheckoutOrder(params: SuZheCreateOrderParams): Promise<SuZheOrderResponse> {
  const apiKey = getEffectiveApiKey();

  if (apiKey) {
    try {
      const res = await fetch(`${getBaseUrl()}/api/v1/checkout/orders`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          product: params.product,
          quantity: params.quantity || 1,
          sell_price: params.sell_price,
          client_order_id: params.client_order_id,
          customer_ref: params.customer_ref || "web_buyer",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "create_order_failed",
          detail: data.detail || "创建订单失败",
        } as any;
      }
      return data;
    } catch (err: any) {
      console.error("Create SuZhe checkout order network error:", err);
      return {
        success: false,
        error: "upstream_gateway_error",
        detail: "连接上游收银网关超时，请稍后重试",
      } as any;
    }
  }

  // ==== 沙盒模拟模式 ====
  const dateStr = new Date().toISOString().replace(/[-:T]/g, "").slice(2, 10);
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderId = `PT${dateStr}${randomHex}`;
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 300 * 1000).toISOString();
  const sellNum = parseFloat(params.sell_price) || 140;
  const costNum = +(sellNum * 0.75).toFixed(2);
  const commission = +(sellNum - costNum).toFixed(2);

  const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    `https://qr.alipay.com/simulated_${orderId}`
  )}`;

  const mockOrder: SuZheOrderResponse = {
    success: true,
    order_id: orderId,
    client_order_id: params.client_order_id,
    status: "pending",
    delivery_status: "none",
    product: params.product,
    quantity: params.quantity || 1,
    unit_sell_price: params.sell_price,
    amount: params.sell_price,
    currency: "CNY",
    cost_price: costNum.toFixed(2),
    cost_total: costNum.toFixed(2),
    commission: commission.toFixed(2),
    qr: `https://qr.alipay.com/simulated_${orderId}`,
    qr_image_url: mockQrUrl,
    expires_at: expiresAt,
    expires_in: 300,
    created_at: now,
    cards: [],
  };

  mockOrders.set(orderId, mockOrder);
  mockOrders.set(params.client_order_id, mockOrder);
  return mockOrder;
}

/**
 * 轮询/查询订单状态与卡密交付
 */
export async function querySuZheCheckoutOrder(orderId: string): Promise<SuZheOrderResponse | null> {
  const apiKey = getEffectiveApiKey();

  if (apiKey) {
    try {
      const res = await fetch(`${getBaseUrl()}/api/v1/checkout/orders/${encodeURIComponent(orderId)}`, {
        headers: { "X-API-Key": apiKey },
        cache: "no-store",
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Query SuZhe checkout order error:", e);
    }
  }

  // ==== 沙盒模拟模式 ====
  const order = mockOrders.get(orderId);
  if (!order) return null;

  return order;
}

/**
 * 沙盒模式下模拟买家付款动作（供前台快速演示测试）
 */
export function simulateSandboxPayment(orderId: string): SuZheOrderResponse | null {
  const order = mockOrders.get(orderId);
  if (!order) return null;

  const prefix = order.product.includes("pro_20x") ? "PRO20SPECIAL-" : order.product.includes("claude") ? "CLAUDE-" : "PH-";
  const r1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const r2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const cardCode = `${prefix}${r1}-${r2}-VERIFIED`;

  order.status = "paid";
  order.delivery_status = "delivered";
  order.cards = [cardCode];

  mockOrders.set(orderId, order);
  mockOrders.set(order.client_order_id, order);
  return order;
}

/**
 * 获取佣金账本流水
 */
export async function getSuZheLedger(dateFrom?: string, dateTo?: string) {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    return {
      success: true,
      isSandbox: true,
      total_commission: "1,248.50",
      settled_orders_count: 32,
      pending_settlement: "188.00",
      items: [],
    };
  }

  try {
    const query = new URLSearchParams();
    if (dateFrom) query.set("date_from", dateFrom);
    if (dateTo) query.set("date_to", dateTo);

    const res = await fetch(`${getBaseUrl()}/api/v1/checkout/ledger?${query.toString()}`, {
      headers: { "X-API-Key": apiKey },
      cache: "no-store",
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
