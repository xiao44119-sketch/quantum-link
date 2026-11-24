import { NextRequest, NextResponse } from "next/server";
import { metric } from "@vercel/functions";
import {
  createVaultOrder,
  getVaultOrderById,
  getVaultStoreConfig,
  listVaultOrders,
  updateVaultOrder,
  verifyAdminSecret,
} from "@/lib/cloud-vault";
import { getMergedStorefrontProducts } from "@/lib/suzhe-order-service";
import { RetailOrderRecord } from "@/lib/types";

export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!(await verifyAdminSecret(adminSecret))) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ALL";
  const limit = Number(searchParams.get("limit")) || 80;

  const orders = await listVaultOrders({ limit, paymentStatus: status });
  return NextResponse.json({ success: true, orders });
}

export async function POST(req: NextRequest) {
  const startedAt = performance.now();
  try {
    const body = await req.json();
    const productCode = String(body.product || body.product_code || "").trim();
    const quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 30);
    const variant = String(body.variant || "").trim();
    const buyerContact = String(body.buyer_contact || "").trim();

    const [cfg, catalog] = await Promise.all([
      getVaultStoreConfig(),
      getMergedStorefrontProducts({ includeDisabled: false }),
    ]);

    const matched = catalog.products.find((p) => p.id === productCode);
    if (!matched) {
      return NextResponse.json(
        { success: false, error: "unknown_product", detail: "该商品不存在或已下架" },
        { status: 404 }
      );
    }

    if (!matched.available || (matched.stock ?? 0) < quantity) {
      return NextResponse.json(
        { success: false, error: "out_of_stock", detail: "该商品当前实时库存不足，请稍后或选购其他套餐" },
        { status: 400 }
      );
    }

    if (matched.variants && matched.variants.length > 0) {
      const targetVar = variant || matched.variants.find((v) => v.stock > 0)?.value || "";
      const varObj = matched.variants.find((v) => v.value === targetVar);
      if (!varObj || varObj.stock < quantity) {
        return NextResponse.json(
          { success: false, error: "variant_out_of_stock", detail: "所选卡段规格库存不足，请切换其他规格" },
          { status: 400 }
        );
      }
    }

    const chosenVariant =
      variant || (matched.variants?.find((v) => v.stock > 0)?.value ?? "");

    const dateStr = new Date().toISOString().replace(/[-:T]/g, "").slice(2, 10);
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `QL-${dateStr}-${rand}`;
    const suzheRequestId = `${orderId}-${Date.now().toString(36)}`.slice(0, 60);

    const retailUnitFen = matched.retailPriceFen ?? Math.round(parseFloat(matched.price) * 100);
    const retailTotalFen = retailUnitFen * quantity;
    const wholesaleUnitFen = matched.wholesalePriceFen ?? 0;
    const wholesaleTotalFen = wholesaleUnitFen * quantity;

    const nowIso = new Date().toISOString();
    const expiresInSec = 900; // 15 分钟充裕扫码时间
    const expiresAtIso = new Date(Date.now() + expiresInSec * 1000).toISOString();

    const record: RetailOrderRecord = {
      order_id: orderId,
      suzhe_request_id: suzheRequestId,
      product_code: matched.id,
      product_name: matched.title,
      variant: chosenVariant,
      quantity,
      retail_unit_fen: retailUnitFen,
      retail_total_fen: retailTotalFen,
      wholesale_unit_fen: wholesaleUnitFen,
      wholesale_total_fen: wholesaleTotalFen,
      payment_method: cfg.paymentMode === "epay_auto" ? "epay_alipay" : "manual_qr",
      payment_status: "pending",
      fulfillment_status: "unfulfilled",
      buyer_contact: buyerContact || null,
      payer_note: null,
      requires_activation: Boolean(matched.requiresActivation),
      activation_line: matched.activationLine || "none",
      delivered_items: [],
      expires_at: expiresAtIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const saved = await createVaultOrder(record);
    metric("orders.created", 1, { outcome: "success", product: matched.id });
    metric("orders.create_duration_ms", performance.now() - startedAt);

    return NextResponse.json({
      success: true,
      order: saved,
      order_id: saved.order_id,
      amount: (saved.retail_total_fen / 100).toFixed(2),
      expires_in: expiresInSec,
      expires_at: saved.expires_at,
      qr_image_url: cfg.contact.qrCodeImage || null,
      alipay_qr_url: cfg.contact.alipayQrImage || null,
      wechat: cfg.contact.wechat,
      qr_note: cfg.contact.qrNote,
      sandbox_demo_enabled: Boolean(cfg.sandboxDemoEnabled),
    });
  } catch (err: any) {
    metric("orders.created", 1, { outcome: "error" });
    console.error("Create retail order error:", err);
    return NextResponse.json(
      { success: false, error: "create_order_failed", detail: err?.message || "创建订单失败" },
      { status: 500 }
    );
  }
}

/**
 * 仅供后台开启了「沙盒演示模式」或管理员口令鉴权通过时模拟出码测试，生产默认严禁未授权调用
 */
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId") || "";
  if (!orderId) {
    return NextResponse.json({ success: false, error: "missing_order_id" }, { status: 400 });
  }

  const [cfg, isAdmin] = await Promise.all([
    getVaultStoreConfig(),
    verifyAdminSecret(req.headers.get("x-admin-secret")),
  ]);

  if (!cfg.sandboxDemoEnabled && !isAdmin) {
    return NextResponse.json(
      { success: false, error: "sandbox_disabled", detail: "生产环境下已关闭模拟支付，请真实扫码付款" },
      { status: 403 }
    );
  }

  const order = await getVaultOrderById(orderId);
  if (!order) {
    return NextResponse.json({ success: false, error: "order_not_found" }, { status: 404 });
  }

  const r1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const r2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const demoCode = `DEMO-${r1}-${r2}-SANDBOX`;

  const updated = await updateVaultOrder(orderId, {
    payment_method: "sandbox_demo",
    payment_status: "paid",
    paid_at: new Date().toISOString(),
    fulfillment_status: "manual_delivered",
    delivered_at: new Date().toISOString(),
    delivered_items: [
      {
        type: "cdk",
        title: "演示测试卡密 (非真实卡密)",
        value: demoCode,
        copy_text: demoCode,
      },
    ],
  });

  return NextResponse.json({
    success: true,
    order: updated,
  });
}
