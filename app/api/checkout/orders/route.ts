import { NextRequest, NextResponse } from "next/server";
import { createSuZheCheckoutOrder, simulateSandboxPayment } from "@/lib/suzhe-checkout-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product, sell_price, client_order_id, customer_ref, quantity } = body;

    if (!product || !sell_price) {
      return NextResponse.json(
        { success: false, error: "missing_parameters", detail: "缺少商品编号或售价" },
        { status: 400 }
      );
    }

    const orderId = client_order_id || `QL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const result = await createSuZheCheckoutOrder({
      product,
      sell_price: String(sell_price),
      client_order_id: orderId,
      customer_ref: customer_ref || "web_buyer",
      quantity: quantity || 1,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("API create checkout order error:", err);
    return NextResponse.json(
      { success: false, error: "internal_error", detail: err.message },
      { status: 500 }
    );
  }
}

// 模拟沙盒付款触发（方便买家在没有接真实 Key 时进行一键测试）
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ success: false, error: "missing_order_id" }, { status: 400 });
    }

    const updated = simulateSandboxPayment(orderId);
    if (!updated) {
      return NextResponse.json({ success: false, error: "order_not_found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
