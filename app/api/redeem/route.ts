import { NextRequest, NextResponse } from "next/server";
import { submitUnifiedActivation } from "@/lib/suzhe-activation-router";
import { RedeemRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: RedeemRequest = await req.json();

    if (!body.card_code || typeof body.card_code !== "string") {
      return NextResponse.json(
        { success: false, error: "missing_card_code", detail: "请提供有效的卡密兑换码" },
        { status: 400 }
      );
    }

    const result = await submitUnifiedActivation(body);

    if (!result.success) {
      return NextResponse.json(result.errorData, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      task_id: result.task.task_id,
      task: result.task,
      message: "任务已受理，正在实时同步上游履约进度",
    });
  } catch (err: unknown) {
    console.error("Redeem API error:", err);
    return NextResponse.json(
      { success: false, error: "internal_server_error", detail: "服务端解析异常，请检查输入数据格式" },
      { status: 500 }
    );
  }
}
