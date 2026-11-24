import { NextResponse } from "next/server";
import { PRODUCTS_CATALOG } from "@/lib/products-config";
import { isCloudVaultActive } from "@/lib/cloud-vault";

export async function GET() {
  const hasActivationKey = Boolean(
    process.env.SUZHE_API_KEY && process.env.SUZHE_API_KEY !== "sandbox_mode"
  );
  const hasOrderKey = Boolean(
    process.env.SUZHE_ORDER_KEY && process.env.SUZHE_ORDER_KEY.startsWith("szb_")
  );

  return NextResponse.json({
    success: true,
    mode: hasActivationKey ? "UPSTREAM_PRODUCTION" : "SANDBOX_SIMULATION",
    orderEngineReady: hasOrderKey,
    cloudVaultActive: isCloudVaultActive(),
    timestamp: new Date().toISOString(),
    products: PRODUCTS_CATALOG,
  });
}
