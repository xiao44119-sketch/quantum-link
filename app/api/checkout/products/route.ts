import { NextResponse } from "next/server";
import { getMergedStorefrontProducts } from "@/lib/suzhe-order-service";

export async function GET() {
  const res = await getMergedStorefrontProducts({ includeDisabled: false });
  return NextResponse.json({
    success: true,
    fromUpstream: res.fromUpstream,
    items: res.products,
  });
}
