import { RedeemRequest, TaskRecord, DuplicateConfirmError } from "./types";
import { pollActivationTask, submitUnifiedActivation } from "./suzhe-activation-router";

export async function submitFulfillmentTask(
  body: RedeemRequest
): Promise<
  | { success: true; task_id: string; task: TaskRecord }
  | { success: false; status: number; errorData: DuplicateConfirmError | { error: string; detail?: string } }
> {
  const res = await submitUnifiedActivation(body);
  if (!res.success) return res;
  return {
    success: true,
    task_id: res.task.task_id,
    task: res.task,
  };
}

export async function queryTaskStatus(taskId: string): Promise<TaskRecord | null> {
  return pollActivationTask(taskId);
}
