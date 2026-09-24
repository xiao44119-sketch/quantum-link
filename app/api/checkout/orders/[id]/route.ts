import { NextRequest, NextResponse } from "next/server";
import { querySuZheCheckoutOrder } from "@/lib/suzhe-checkout-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "missing_id" }, { status: 400 });
    }

    const order = await querySuZheCheckoutOrder(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "order_not_found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
