import { NextRequest, NextResponse } from "next/server";
import { submitFulfillmentTask } from "@/lib/fulfillment-service";
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

    if (!body.session_data || !body.session_data.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_session_data",
          detail: "缺少合法的 Session JSON 或 accessToken，请完整复制 chatgpt.com/api/auth/session 的内容",
        },
        { status: 400 }
      );
    }

    const result = await submitFulfillmentTask(body);

    if (!result.success) {
      return NextResponse.json(result.errorData, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      task_id: result.task_id,
      message: "任务已接收，正由量子链路异步履约调度中心处理",
    });
  } catch (err: unknown) {
    console.error("Redeem API error:", err);
    return NextResponse.json(
      { success: false, error: "internal_server_error", detail: "服务端解析异常，请检查数据格式" },
      { status: 500 }
    );
  }
}