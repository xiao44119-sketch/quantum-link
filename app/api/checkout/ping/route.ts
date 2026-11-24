import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/cloud-vault";
import { pingActivationGateway } from "@/lib/suzhe-activation-router";
import { getSuZheOrderBalance } from "@/lib/suzhe-order-service";

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminSecret(req.headers.get("x-admin-secret"));
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const [actPing, orderBal] = await Promise.all([
    pingActivationGateway(body.apiKey || undefined),
    getSuZheOrderBalance(body.orderKey || undefined),
  ]);

  return NextResponse.json({
    success: Boolean(actPing.success || orderBal.success),
    activation: actPing,
    orderWallet: orderBal,
    client_name: actPing.client_name || "苏哲授权代理",
    balance: orderBal.balance ?? null,
    error: !actPing.success && !orderBal.success ? actPing.error || orderBal.error : undefined,
  });
}
