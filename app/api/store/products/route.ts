import { NextResponse } from "next/server";
import { getVaultStoreConfig } from "@/lib/cloud-vault";
import { getMergedStorefrontProducts } from "@/lib/suzhe-order-service";

export async function GET() {
  const [cfg, catalog] = await Promise.all([
    getVaultStoreConfig(),
    getMergedStorefrontProducts({ includeDisabled: false }),
  ]);

  return NextResponse.json({
    success: true,
    contact: cfg.contact,
    paymentMode: cfg.paymentMode,
    sandboxDemoEnabled: Boolean(cfg.sandboxDemoEnabled),
    fromUpstream: catalog.fromUpstream,
    products: catalog.products,
  });
}
