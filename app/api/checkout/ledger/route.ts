import { NextRequest, NextResponse } from "next/server";
import { listVaultOrders, verifyAdminSecret } from "@/lib/cloud-vault";
import { getSuZheAgentLedger, getSuZheOrderBalance } from "@/lib/suzhe-order-service";

export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminSecret(req.headers.get("x-admin-secret"));
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const [orders, wallet, upstreamLedger] = await Promise.all([
    listVaultOrders({ limit: 200 }),
    getSuZheOrderBalance(),
    getSuZheAgentLedger(30),
  ]);

  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const awaitingCount = orders.filter((o) => o.payment_status === "awaiting_confirm").length;
  const totalRevenueFen = paidOrders.reduce((acc, o) => acc + (o.retail_total_fen || 0), 0);
  const totalProfitFen = paidOrders.reduce(
    (acc, o) => acc + ((o.retail_total_fen || 0) - (o.wholesale_total_fen || 0)),
    0
  );

  return NextResponse.json({
    success: true,
    suzhe_balance: wallet.balance ?? "0.00",
    suzhe_balance_fen: wallet.balance_fen ?? 0,
    total_revenue: (totalRevenueFen / 100).toFixed(2),
    total_profit: (totalProfitFen / 100).toFixed(2),
    paid_orders_count: paidOrders.length,
    awaiting_confirm_count: awaitingCount,
    upstream_ledger: upstreamLedger?.items || [],
  });
}
