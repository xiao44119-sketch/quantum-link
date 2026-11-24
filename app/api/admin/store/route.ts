import { NextRequest, NextResponse } from "next/server";
import {
  getVaultStoreConfig,
  isCloudVaultActive,
  saveVaultStoreConfig,
  verifyAdminSecret,
} from "@/lib/cloud-vault";
import { getMergedStorefrontProducts } from "@/lib/suzhe-order-service";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (!(await verifyAdminSecret(auth))) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "1";

  const [cfg, catalog] = await Promise.all([
    getVaultStoreConfig(true),
    getMergedStorefrontProducts({ includeDisabled: true, forceRefresh }),
  ]);

  return NextResponse.json({
    success: true,
    cloudVaultActive: isCloudVaultActive(),
    fromUpstream: catalog.fromUpstream,
    data: {
      paymentMode: cfg.paymentMode,
      sandboxDemoEnabled: cfg.sandboxDemoEnabled,
      globalMarkupPercent: cfg.globalMarkupPercent,
      minProfitFen: cfg.minProfitFen,
      contact: cfg.contact,
      epay: cfg.epay || {},
      productOverrides: cfg.productOverrides || {},
      hasEnvActivationKey: Boolean(process.env.SUZHE_API_KEY),
      hasEnvOrderKey: Boolean(process.env.SUZHE_ORDER_KEY),
      suzheApiKey: cfg.suzheApiKey || "",
      suzheOrderKey: cfg.suzheOrderKey || "",
      products: catalog.products,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (!(await verifyAdminSecret(auth))) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    await saveVaultStoreConfig({
      paymentMode: payload.paymentMode,
      sandboxDemoEnabled: payload.sandboxDemoEnabled,
      globalMarkupPercent: payload.globalMarkupPercent,
      minProfitFen: payload.minProfitFen,
      contact: payload.contact,
      epay: payload.epay,
      suzheApiKey: payload.suzheApiKey,
      suzheOrderKey: payload.suzheOrderKey,
      productOverrides: payload.productOverrides,
    });

    const catalog = await getMergedStorefrontProducts({ includeDisabled: true });

    return NextResponse.json({
      success: true,
      message: "配置已安全写入 Supabase 云端保险柜，前台实时生效！",
      products: catalog.products,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "invalid_payload" },
      { status: 400 }
    );
  }
}
