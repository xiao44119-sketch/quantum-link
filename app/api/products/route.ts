import { NextResponse } from "next/server";
import { PRODUCTS_CATALOG } from "@/lib/products-config";

export async function GET() {
  const isSandbox = !process.env.SUZHE_API_KEY || process.env.SUZHE_API_KEY === "sandbox_mode";
  return NextResponse.json({
    success: true,
    mode: isSandbox ? "SANDBOX_SIMULATION" : "UPSTREAM_PRODUCTION",
    timestamp: new Date().toISOString(),
    products: PRODUCTS_CATALOG,
  });
}