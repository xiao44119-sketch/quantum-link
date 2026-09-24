import { NextResponse } from "next/server";
import { getSuZheCheckoutProducts } from "@/lib/suzhe-checkout-service";

export async function GET() {
  try {
    const products = await getSuZheCheckoutProducts();
    return NextResponse.json(products);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
