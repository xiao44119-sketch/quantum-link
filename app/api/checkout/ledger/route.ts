import { NextRequest, NextResponse } from "next/server";
import { getSuZheLedger } from "@/lib/suzhe-checkout-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("date_from") || undefined;
    const dateTo = searchParams.get("date_to") || undefined;

    const data = await getSuZheLedger(dateFrom, dateTo);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
