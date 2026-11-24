import { NextRequest, NextResponse } from "next/server";
import { traceOrderOrCredential } from "@/lib/suzhe-activation-router";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const result = await traceOrderOrCredential(q);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await traceOrderOrCredential(body.query || body.q || "");
    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch {
    return NextResponse.json(
      { success: false, error: "bad_request", detail: "查询参数不合法" },
      { status: 400 }
    );
  }
}
