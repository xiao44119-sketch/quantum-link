import { NextRequest, NextResponse } from "next/server";
import { precheckActivation } from "@/lib/suzhe-activation-router";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await precheckActivation({
      card_code: body.card_code || "",
      line: body.line,
      tg_username: body.tg_username,
      grok_cookies: body.grok_cookies,
    });
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "bad_request", detail: err?.message || "预检请求格式异常" },
      { status: 400 }
    );
  }
}
