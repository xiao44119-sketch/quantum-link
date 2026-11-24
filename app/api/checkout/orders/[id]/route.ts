import { NextRequest, NextResponse } from "next/server";
import {
  getVaultOrderById,
  updateVaultOrder,
  verifyAdminSecret,
} from "@/lib/cloud-vault";
import { fulfillOrderViaSuZhe } from "@/lib/suzhe-order-service";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const order = await getVaultOrderById(decodeURIComponent(id));
  if (!order) {
    return NextResponse.json({ success: false, error: "order_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    order,
    status: order.payment_status,
    fulfillment_status: order.fulfillment_status,
    delivered_items: order.delivered_items,
    cards: order.delivered_items.map((i) => i.copy_text || i.value),
  });
}

/**
 * 买家提交「我已完成扫码转账」通知，附带联系方式和转账备注，便于站长后台秒级核对并随时找回订单
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const orderId = decodeURIComponent(id);
  const order = await getVaultOrderById(orderId);
  if (!order) {
    return NextResponse.json({ success: false, error: "order_not_found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const buyerContact = String(body.buyer_contact || order.buyer_contact || "").trim();
  const payerNote = String(body.payer_note || "").trim();

  if (order.payment_status === "paid") {
    return NextResponse.json({ success: true, order });
  }

  const updated = await updateVaultOrder(orderId, {
    payment_status: "awaiting_confirm",
    buyer_contact: buyerContact || null,
    payer_note: payerNote || "买家已点击完成扫码付款",
  });

  return NextResponse.json({
    success: true,
    order: updated,
    message: "已通知站长核销！确认收款后当前页面将自动弹出卡密（您也可随时凭单号在查询舱提取）。",
  });
}

/**
 * 站长后台核销与自动调苏哲 szb_ 接口秒发真卡
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminSecret(req.headers.get("x-admin-secret"));
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const orderId = decodeURIComponent(id);
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "confirm_and_fulfill_suzhe");

  if (action === "confirm_and_fulfill_suzhe") {
    const res = await fulfillOrderViaSuZhe(orderId);
    if (!res.success) {
      return NextResponse.json(
        {
          success: false,
          error: res.error,
          detail: res.detail,
          order: res.order,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      order: res.order,
      message: "已从苏哲自动扣余额拿货并向买家发放卡密！",
    });
  }

  if (action === "manual_deliver") {
    const content = String(body.manual_content || "").trim();
    if (!content) {
      return NextResponse.json(
        { success: false, error: "empty_content", detail: "请输入要手动发放的卡密或交付内容" },
        { status: 400 }
      );
    }
    const nowIso = new Date().toISOString();
    const lines = content
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    const updated = await updateVaultOrder(orderId, {
      payment_status: "paid",
      paid_at: nowIso,
      fulfillment_status: "manual_delivered",
      delivered_at: nowIso,
      error_detail: null,
      delivered_items: lines.map((val, idx) => ({
        type: "cdk",
        title: lines.length > 1 ? `交付凭证 #${idx + 1}` : "激活凭证 / 交付内容",
        value: val,
        copy_text: val,
      })),
    });
    return NextResponse.json({
      success: true,
      order: updated,
      message: "手动发货成功，买家页面已同步展示！",
    });
  }

  if (action === "mark_refunded" || action === "close") {
    const updated = await updateVaultOrder(orderId, {
      payment_status: action === "mark_refunded" ? "refunded" : "expired",
      error_detail: body.reason || (action === "mark_refunded" ? "站长标记已退款" : "站长关闭订单"),
    });
    return NextResponse.json({ success: true, order: updated });
  }

  return NextResponse.json({ success: false, error: "unknown_action" }, { status: 400 });
}
