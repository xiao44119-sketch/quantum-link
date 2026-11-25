import { NextRequest, NextResponse } from "next/server";
import { metric } from "@vercel/functions";
import { getVaultOrderById, updateVaultOrder } from "@/lib/cloud-vault";
import { verifyOrderApproveToken } from "@/lib/order-notify";
import { fulfillOrderViaSuZhe } from "@/lib/suzhe-order-service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const orderId = decodeURIComponent(id);
  const sig = req.nextUrl.searchParams.get("sig");

  const order = await getVaultOrderById(orderId);
  if (!order) {
    return NextResponse.json({ success: false, error: "订单不存在" }, { status: 404 });
  }

  if (!verifyOrderApproveToken(order.order_id, order.retail_total_fen, sig)) {
    return NextResponse.json(
      { success: false, error: "安全签名无效或链接不完整" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    order: {
      order_id: order.order_id,
      product_name: order.product_name,
      variant: order.variant,
      quantity: order.quantity,
      amount_yuan: (order.retail_total_fen / 100).toFixed(2),
      cost_yuan: (order.wholesale_total_fen / 100).toFixed(2),
      profit_yuan: (
        ((order.retail_total_fen || 0) - (order.wholesale_total_fen || 0)) /
        100
      ).toFixed(2),
      buyer_contact: order.buyer_contact,
      payer_note: order.payer_note,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      delivered_items: order.delivered_items || [],
      error_detail: order.error_detail,
      created_at: order.created_at,
    },
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const orderId = decodeURIComponent(id);
  const body = await req.json().catch(() => ({}));
  const sig = String(body.sig || "");
  const action = String(body.action || "approve");

  const order = await getVaultOrderById(orderId);
  if (!order) {
    return NextResponse.json({ success: false, error: "订单不存在" }, { status: 404 });
  }

  if (!verifyOrderApproveToken(order.order_id, order.retail_total_fen, sig)) {
    metric("orders.mobile_approve", 1, { outcome: "invalid_sig" });
    return NextResponse.json(
      { success: false, error: "安全签名校验未通过" },
      { status: 403 }
    );
  }

  if (action === "close") {
    const updated = await updateVaultOrder(orderId, {
      payment_status: "expired",
      error_detail: "站长手机端核实未到账并关闭订单",
    });
    metric("orders.mobile_approve", 1, { outcome: "closed" });
    return NextResponse.json({
      success: true,
      message: "已关闭该笔未付款订单",
      order: updated,
    });
  }

  const res = await fulfillOrderViaSuZhe(orderId);
  if (!res.success) {
    metric("orders.mobile_approve", 1, { outcome: "fulfill_error" });
    return NextResponse.json(
      {
        success: false,
        error: res.detail || res.error || "苏哲自动提卡失败",
      },
      { status: 400 }
    );
  }

  metric("orders.mobile_approve", 1, { outcome: "delivered" });
  return NextResponse.json({
    success: true,
    message: "自动提卡成功！卡密已实时推送到顾客页面并存入云端保险柜！",
    delivered_items: res.order?.delivered_items || [],
    payment_status: res.order?.payment_status,
    fulfillment_status: res.order?.fulfillment_status,
  });
}
