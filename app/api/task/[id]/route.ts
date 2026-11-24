import { NextRequest, NextResponse } from "next/server";
import { pollActivationTask } from "@/lib/suzhe-activation-router";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "missing_task_id" }, { status: 400 });
  }

  const task = await pollActivationTask(decodeURIComponent(id));
  if (!task) {
    return NextResponse.json(
      { error: "task_not_found", detail: "未找到该任务ID，请用原卡密前往凭据查询核对" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, task });
}
