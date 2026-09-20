import { detectProductByCode } from "./products-config";
import { RedeemRequest, TaskRecord, DuplicateConfirmError } from "./types";

const memoryTasks = new Map<string, TaskRecord>();

const MOCK_HISTORIES = new Map<string, { product: string; at: string; hours_ago: number }>();
MOCK_HISTORIES.set("duplicate@test.com", {
  product: "ChatGPT Plus (标准版)",
  at: "2026-09-17 14:20:10",
  hours_ago: 54.2,
});
MOCK_HISTORIES.set("blocked@test.com", {
  product: "ChatGPT Pro 5x",
  at: "2026-09-19 09:12:00",
  hours_ago: 11.4,
});

export async function submitFulfillmentTask(
  body: RedeemRequest
): Promise<{ success: true; task_id: string } | { success: false; status: number; errorData: DuplicateConfirmError | { error: string; detail?: string } }> {
  const apiKey = process.env.SUZHE_API_KEY;
  const baseUrl = process.env.SUZHE_BASE_URL || "https://aisubscription.vip";

  const targetEmail = body.session_data?.user?.email || "anonymous@openai.user";
  const matchedProduct = detectProductByCode(body.card_code);

  if (!matchedProduct) {
    return {
      success: false,
      status: 400,
      errorData: {
        error: "invalid_card_code",
        detail: "无法识别该卡密前缀，请确认是否为有效卡密 (PH-, PRO5-, PRO20SPECIAL- 等)",
      },
    };
  }

  if (apiKey && apiKey !== "sandbox_mode") {
    try {
      const resp = await fetch(`${baseUrl}/api/v1/gptplus/redeem`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          card_code: body.card_code,
          session_data: body.session_data,
          confirm_duplicate: body.confirm_duplicate,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        return {
          success: false,
          status: resp.status,
          errorData: data,
        };
      }
      return { success: true, task_id: data.task_id || data.id };
    } catch (err: unknown) {
      console.error("Upstream API Request Error:", err);
      return {
        success: false,
        status: 502,
        errorData: {
          error: "upstream_gateway_error",
          detail: "请求上游履约服务异常，请稍后重试",
        },
      };
    }
  }

  // ==== 沙盒模拟模式 (Sandbox Simulation Engine) ====
  const emailLower = targetEmail.toLowerCase();
  
  if (!body.confirm_duplicate && MOCK_HISTORIES.has(emailLower)) {
    const history = MOCK_HISTORIES.get(emailLower)!;
    if (history.hours_ago < 24) {
      return {
        success: false,
        status: 409,
        errorData: {
          success: false,
          error: "duplicate_email_blocked",
          detail: `该账号在 ${history.at} (约 ${history.hours_ago.toFixed(1)} 小时前) 刚完成一次订阅充值。按平台保护策略，24 小时内禁止连续充值。`,
          detail_zh: `该账号在 ${history.at} (约 ${history.hours_ago.toFixed(1)} 小时前) 已充值，24小时内严格防重熔断。`,
          duplicate: true,
          last_product: history.product,
          last_at: history.at,
          hours_ago: history.hours_ago,
        },
      };
    }

    return {
      success: false,
      status: 409,
      errorData: {
        success: false,
        error: "duplicate_email_confirm",
        detail: `该账号于 ${history.at} 存在有效充值记录，重复充值不会叠加时长，请确认是否仍要覆盖激活。`,
        detail_zh: `检测到账号存在订阅历史，请二次确认是否继续履约。`,
        duplicate: true,
        last_product: history.product,
        last_at: history.at,
        hours_ago: history.hours_ago,
        need_confirm: true,
      },
    };
  }

  const taskId = "task_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
  const maskedCard = body.card_code.substring(0, 5) + "••••-••••-" + body.card_code.slice(-4);
  const now = new Date().toISOString();

  const taskRecord: TaskRecord = {
    task_id: taskId,
    card_code_masked: maskedCard,
    product_id: matchedProduct.id,
    product_name: matchedProduct.name,
    target_email: targetEmail,
    status: "QUEUED",
    progress: 10,
    finished: false,
    success: false,
    created_at: now,
    updated_at: now,
    log_trace: [
      {
        timestamp: now,
        level: "INFO",
        message: "任务已接收，进入高并发任务调度队列 (Sandbox Queue)",
      },
      {
        timestamp: now,
        level: "INFO",
        message: `卡密档位识别成功 -> [${matchedProduct.name}]，前缀校验通过`,
      },
    ],
  };

  memoryTasks.set(taskId, taskRecord);
  return { success: true, task_id: taskId };
}

export async function queryTaskStatus(taskId: string): Promise<TaskRecord | null> {
  const apiKey = process.env.SUZHE_API_KEY;
  const baseUrl = process.env.SUZHE_BASE_URL || "https://aisubscription.vip";

  if (apiKey && apiKey !== "sandbox_mode") {
    try {
      const resp = await fetch(`${baseUrl}/api/v1/gptplus/task/${taskId}`, {
        headers: {
          "X-API-Key": apiKey,
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        return data;
      }
    } catch (e) {
      console.error("Fetch real task status failed:", e);
    }
  }

  // ==== 沙盒动态状态机推进 (State Machine Progression) ====
  const task = memoryTasks.get(taskId);
  if (!task) return null;

  if (task.finished) return task;

  const ageMs = Date.now() - new Date(task.created_at).getTime();
  const nowIso = new Date().toISOString();

  if (ageMs > 12000) {
    task.status = "COMPLETED";
    task.progress = 100;
    task.finished = true;
    task.success = true;
    task.updated_at = nowIso;
    if (!task.log_trace.some((l) => l.message.includes("已成功下发至用户订阅列表"))) {
      task.log_trace.push({
        timestamp: nowIso,
        level: "SUCCESS",
        message: "订阅授权成功绑定！权益已成功下发至用户订阅列表，Session 态已同步更新。",
      });
    }
  } else if (ageMs > 8000) {
    task.status = "SUBSCRIPTION_PROVISIONING";
    task.progress = 75;
    task.updated_at = nowIso;
    if (!task.log_trace.some((l) => l.message.includes("分配原生支付授权凭证"))) {
      task.log_trace.push({
        timestamp: nowIso,
        level: "INFO",
        message: "结算网关正在调用官方 Provisioning 接口分配原生支付授权凭证...",
      });
    }
  } else if (ageMs > 4000) {
    task.status = "TOPUP_DISPATCHING";
    task.progress = 45;
    task.updated_at = nowIso;
    if (!task.log_trace.some((l) => l.message.includes("分配专线代理通道"))) {
      task.log_trace.push({
        timestamp: nowIso,
        level: "INFO",
        message: "海外东京 BGP VPS 节点认证通过，正在为该 Session 分配专线代理通道...",
      });
    }
  } else if (ageMs > 1500) {
    task.status = "SESSION_VERIFYING";
    task.progress = 25;
    task.updated_at = nowIso;
    if (!task.log_trace.some((l) => l.message.includes("AccessToken 签名校验"))) {
      task.log_trace.push({
        timestamp: nowIso,
        level: "INFO",
        message: `正在解构 Session 数据，目标账户: ${task.target_email}，AccessToken 签名校验合法。`,
      });
    }
  }

  return task;
}