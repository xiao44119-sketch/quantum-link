import { metric } from "@vercel/functions";
import {
  ActivationLine,
  DuplicateConfirmError,
  RedeemRequest,
  SmsActivationState,
  TaskRecord,
} from "./types";
import {
  detectActivationLine,
  detectProductByCode,
  maskCardCode,
} from "./products-config";
import {
  findVaultTasksByCard,
  getVaultActivationTask,
  getVaultOrderById,
  getVaultStoreConfig,
  listVaultOrders,
  saveVaultActivationTask,
  StoredActivationTask,
} from "./cloud-vault";

const CHATGPT_BASE = (
  process.env.SUZHE_CHATGPT_BASE_URL ||
  process.env.SUZHE_BASE_URL ||
  "https://www.academicgate.org"
).replace(/\/+$/, "");

const MAIN_BASE = (
  process.env.SUZHE_MAIN_BASE_URL || "https://suzhe.ai"
).replace(/\/+$/, "");

async function getActivationApiKey(): Promise<string | null> {
  const envKey = process.env.SUZHE_API_KEY?.trim();
  if (envKey && envKey !== "sandbox_mode") return envKey;
  const cfg = await getVaultStoreConfig();
  if (cfg.suzheApiKey && cfg.suzheApiKey.trim() && cfg.suzheApiKey !== "sandbox_mode") {
    return cfg.suzheApiKey.trim();
  }
  return null;
}

export async function pingActivationGateway(customKey?: string) {
  const apiKey = customKey?.trim() || (await getActivationApiKey());
  if (!apiKey) {
    return { success: false, error: "未配置激活密钥 (aisub_...)" };
  }
  try {
    const res = await fetch(`${CHATGPT_BASE}/api/v1/ping`, {
      headers: { "X-API-Key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "连接异常" };
  }
}

function appendTrace(
  existing: TaskRecord["log_trace"],
  level: "INFO" | "SUCCESS" | "WARN" | "ERROR",
  message: string
): TaskRecord["log_trace"] {
  const list = Array.isArray(existing) ? [...existing] : [];
  if (list.length > 0 && list[list.length - 1].message === message) {
    return list;
  }
  list.push({
    timestamp: new Date().toISOString(),
    level,
    message,
  });
  return list.slice(-30);
}

function mapChatGptErrorDisposal(errorCode?: string, fallbackMsg?: string): {
  message: string;
  disposal_hint: string;
  can_retry: boolean;
  forbid_resubmit: boolean;
} {
  const code = (errorCode || "").trim();
  switch (code) {
    case "upgrade_incomplete":
      return {
        message: fallbackMsg || "基础档已开通，尚差最后一步升级",
        disposal_hint:
          "卡密未消耗且已绑定该账号！请直接用【同一个账号】和【原卡密】再次点击提交即可完成升级（切勿换号）。",
        can_retry: true,
        forbid_resubmit: false,
      };
    case "promax_upgrade_incomplete":
    case "payment_unverified":
      return {
        message: fallbackMsg || "付款或升级结果待人工核实",
        disposal_hint:
          "⚠️ 严禁重复提交或换卡重试！请保留当前任务号，直接点击下方【一键提交售后工单】由站长协同上游处理。",
        can_retry: false,
        forbid_resubmit: true,
      };
    case "account_has_subscription":
      return {
        message: fallbackMsg || "目标账号当前已有生效中的订阅",
        disposal_hint:
          "卡密未消耗。Plus/Pro 50x 仅限当前无订阅账号；Pro 10x/20x 仅支持免费号或菲区(PHP)订阅直升。请更换无订阅账号或等原订阅到期。",
        can_retry: true,
        forbid_resubmit: false,
      };
    case "plus_not_ph_region":
    case "promax_billing_not_php":
      return {
        message: fallbackMsg || "目标账号计费币种非菲律宾区 (PHP)，无法跨区直升",
        disposal_hint: "卡密未消耗。请改用无订阅的免费账号提交，或等待现有非菲区订阅彻底到期。",
        can_retry: true,
        forbid_resubmit: false,
      };
    case "session_expired":
    case "invalid_session_data":
    case "session_missing_access_token":
      return {
        message: fallbackMsg || "ChatGPT 登录凭证 (Session) 已过期或失效",
        disposal_hint:
          "卡密未消耗。请在浏览器保持登录 chatgpt.com，刷新 chatgpt.com/api/auth/session 重新全选复制后再提交。",
        can_retry: true,
        forbid_resubmit: false,
      };
    case "email_frozen":
    case "session_failed_too_many":
      return {
        message: fallbackMsg || "该账号连续失败次数触发风控保护暂停",
        disposal_hint: "卡密未消耗。请勿继续对该账号重试，提交售后工单联系站长申请解冻或更换账号。",
        can_retry: false,
        forbid_resubmit: true,
      };
    case "verification_timeout":
    case "verification_failed":
      return {
        message: fallbackMsg || "安全验证超时或未通过",
        disposal_hint: "卡密未消耗。可直接使用原卡密重新提交，并在弹窗出现时及时完成验证。",
        can_retry: true,
        forbid_resubmit: false,
      };
    default:
      return {
        message: fallbackMsg || "激活任务未能完成",
        disposal_hint:
          "若提示卡密未消耗，请核对账号条件后重试；若有疑问请附带 TASK ID 提交工单核实。",
        can_retry: true,
        forbid_resubmit: false,
      };
  }
}

function normalizeTgUsername(raw?: string): string {
  if (!raw) return "";
  let s = raw.trim();
  s = s.replace(/^https?:\/\/t\.me\//i, "").replace(/^t\.me\//i, "").replace(/^@/, "");
  return s.split(/[/?#]/)[0].trim();
}

// ==================== 1. 七合一前置预检 (Precheck) ====================

export async function precheckActivation(params: {
  card_code: string;
  line?: ActivationLine;
  tg_username?: string;
  grok_cookies?: unknown;
}) {
  const code = params.card_code.trim();
  if (!code) {
    return { success: false, error: "missing_card_code", detail: "请输入卡密" };
  }

  const line = params.line || detectActivationLine(code);
  const apiKey = await getActivationApiKey();
  if (!apiKey) {
    return {
      success: true,
      sandbox: true,
      line,
      eligible: true,
      message: "当前未配置激活密钥，处于沙盒演示就绪状态",
    };
  }

  try {
    if (line === "chatgpt") {
      const [stRes, infoRes] = await Promise.all([
        fetch(`${CHATGPT_BASE}/api/v1/gptplus/status`, {
          headers: { "X-API-Key": apiKey },
          cache: "no-store",
          signal: AbortSignal.timeout(12000),
        }),
        fetch(`${CHATGPT_BASE}/api/v1/gptplus/cdk-info?code=${encodeURIComponent(code)}`, {
          headers: { "X-API-Key": apiKey },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }),
      ]);
      const stData = await stRes.json().catch(() => ({}));
      const infoData = await infoRes.json().catch(() => ({}));

      if (!infoRes.ok || !infoData.success) {
        return {
          success: false,
          line,
          service_available: stData.available !== false,
          error: infoData.error || "invalid_card_key",
          detail: infoData.detail_zh || infoData.detail || "未查到该卡密，请核对卡密是否完整",
        };
      }

      return {
        success: true,
        line,
        service_available: stData.available !== false,
        service_tier: stData.tier || "ready",
        product: infoData.product,
        product_name: infoData.product_name_zh || infoData.product_name || "ChatGPT 订阅",
        status: infoData.status,
        redeemable: Boolean(infoData.redeemable),
        bound_email: infoData.bound_email || null,
        records: infoData.records || [],
        message:
          infoData.status === "upgrade_incomplete"
            ? `该卡密基础档已开，请使用绑定账号 (${infoData.bound_email || "原账号"}) 继续提交完成升级`
            : infoData.redeemable
            ? `卡密有效 (${infoData.product_name_zh || infoData.product_name})，可立即提交激活`
            : `当前卡密状态为 ${infoData.status}，不可再次提交`,
      };
    }

    if (line === "grok") {
      if (!params.grok_cookies) {
        const prodRes = await fetch(`${CHATGPT_BASE}/api/v1/grok/products`, {
          headers: { "X-API-Key": apiKey },
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });
        const prodData = await prodRes.json().catch(() => ({}));
        return {
          success: true,
          line,
          need_cookies_for_deep_check: true,
          products: prodData.products || [],
          message: "Grok 卡密格式识别成功，请粘贴 grok.com 的 Cookie (含 sso 与 sso-rw) 点击免费资格预检",
        };
      }

      const res = await fetch(`${CHATGPT_BASE}/api/v1/grok/precheck`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          card_code: code,
          session_data: params.grok_cookies,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(92000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        return {
          success: false,
          line,
          error: data.error || `http_${res.status}`,
          detail: data.detail_zh || data.detail || "Grok 预检未通过（不消耗卡密）",
        };
      }
      return {
        success: true,
        line,
        eligible: Boolean(data.eligible),
        plan: data.plan || data.product_name || data.product,
        email: data.email || null,
        error_code: data.error_code || null,
        message: data.eligible
          ? `✅ 资格核验通过！目标账号 ${data.email || ""} 可开通 ${data.plan || "Grok 订阅"}`
          : `⚠️ 该账号暂不满足条件 (${data.detail_zh || data.error_code || "无首月优惠资格或已有订阅"})，卡密未消耗`,
      };
    }

    if (line === "sheerid") {
      const res = await fetch(`${MAIN_BASE}/api/sheerid/precheck`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cdk: code }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        return {
          success: false,
          line,
          error: data.code || "sheerid_precheck_failed",
          detail: data.error || data.message || "学生认证卡密无效或已使用",
        };
      }
      return {
        success: true,
        line,
        status: data.status,
        maintenance: Boolean(data.maintenance),
        redeemable: (data.status === "ready" || data.status === "can_retry") && !data.maintenance,
        redirect_url: data.redirect_url || null,
        message: data.message || "卡密有效，请粘贴 SheerID 验证链接",
      };
    }

    if (line === "gemini_pro") {
      const res = await fetch(`${MAIN_BASE}/api/gemini-pixel/precheck`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          line,
          error: data.code || "gemini_precheck_failed",
          detail: data.reason || data.message || "Gemini 卡密校验未通过或属于已停用规格",
        };
      }
      const canSubmit = Boolean(data.can_submit && !data.pending_confirmation);
      return {
        success: true,
        line,
        status: data.status,
        redeemable: canSubmit,
        sub_expiry: data.sub_expiry || null,
        message: canSubmit
          ? "Gemini Pro 3个月卡密就绪，请填写 Google 账号与 Base32 2FA 密钥提交"
          : `当前状态: ${data.status}${data.pending_confirmation ? " (待确认中)" : ""}`,
      };
    }

    if (line === "tg_premium") {
      const username = normalizeTgUsername(params.tg_username);
      const payload: Record<string, string> = { cdk: code };
      if (username) payload.username = username;

      const res = await fetch(`${MAIN_BASE}/api/tgprem/check`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(35000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 409) {
        return {
          success: false,
          line,
          error: data.code || `http_${res.status}`,
          detail: data.error || data.reason || "Telegram 卡密或用户名校验未通过",
        };
      }
      return {
        success: true,
        line,
        eligible: data.eligible,
        months: data.months,
        task_id: data.task_id || null,
        message:
          data.eligible === true
            ? `✅ 校验通过！@${username} 可立即接收 ${data.months ? data.months + " 个月 " : ""}Telegram Premium`
            : data.eligible === false
            ? `⚠️ 不可接收: ${data.reason || "该账号当前已是会员或不存在"}`
            : "卡密有效，请输入接收会员的 @username 核验资格",
      };
    }

    if (line === "muse_boost") {
      const res = await fetch(`${MAIN_BASE}/api/muse-boost/lookup`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: code }),
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        return {
          success: false,
          line,
          error: "muse_lookup_failed",
          detail: data.detail || data.message || "未查到该 Muse 助力卡密",
        };
      }
      const card = data.card || {};
      return {
        success: true,
        line,
        maintenance: Boolean(data.maintenance),
        card,
        orders: data.orders || [],
        redeemable: Boolean(card.active && !card.expired && card.remaining_uses > 0 && !data.maintenance),
        message: `卡密可用次数: 剩余 ${card.remaining_uses ?? 0} / 总计 ${card.total_uses ?? 0} 次（每次 +10亿 Token）`,
      };
    }

    if (line === "codex_sms") {
      const res = await fetch(`${MAIN_BASE}/api/codex-sms/status`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cdk: code }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          line,
          error: data.code || "sms_lookup_failed",
          detail: data.message || "未查到该接码卡密",
        };
      }
      return {
        success: true,
        line,
        card: data.card,
        activation: data.activation || null,
        redeemable: data.card?.state !== "used",
        message:
          data.card?.state === "used"
            ? "该接码卡密已完成核销使用"
            : `接码卡有效 · 剩余可取号额度: ${data.card?.numbers_left ?? 8} 次`,
      };
    }

    return { success: true, line, message: "卡密格式有效" };
  } catch (err: any) {
    return {
      success: false,
      line,
      error: "network_error",
      detail: `预检网络请求超时或异常: ${err?.message || "请稍后重试"}`,
    };
  }
}

// ==================== 2. 七合一激活提交与短信控制 (Submit / Action) ====================

export async function submitUnifiedActivation(
  body: RedeemRequest
): Promise<
  | { success: true; task: TaskRecord }
  | {
      success: false;
      status: number;
      errorData: DuplicateConfirmError | { success: false; error: string; detail: string; [k: string]: unknown };
    }
> {
  const startedAt = performance.now();
  const code = (body.card_code || "").trim();
  if (!code) {
    return {
      success: false,
      status: 400,
      errorData: { success: false, error: "missing_card_code", detail: "请输入有效的激活卡密" },
    };
  }

  const line = body.line || detectActivationLine(code);
  const matchedProduct = detectProductByCode(code);
  const masked = maskCardCode(code);
  const nowIso = new Date().toISOString();
  const apiKey = await getActivationApiKey();

  if (!apiKey) {
    return {
      success: false,
      status: 503,
      errorData: {
        success: false,
        error: "api_key_not_configured",
        detail: "服务端尚未配置激活密钥 (SUZHE_API_KEY)",
      },
    };
  }

  try {
    // -------------------- Line 1: ChatGPT (Plus / Pro 10x / Pro 20x / Pro 50x) --------------------
    if (line === "chatgpt") {
      let parsedSession: any = body.session_data;
      if (typeof parsedSession === "string") {
        try {
          parsedSession = JSON.parse(parsedSession);
        } catch {
          return {
            success: false,
            status: 400,
            errorData: {
              success: false,
              error: "invalid_session_json",
              detail: "Session JSON 格式不合法，请完整复制 chatgpt.com/api/auth/session 页面全部内容",
            },
          };
        }
      }

      if (!parsedSession || typeof parsedSession !== "object" || !parsedSession.accessToken) {
        return {
          success: false,
          status: 400,
          errorData: {
            success: false,
            error: "session_missing_access_token",
            detail: "Session JSON 中缺少 accessToken，请确认已在浏览器登录 chatgpt.com 后重新复制",
          },
        };
      }

      // 1) 服务维护状态预检
      const statusResp = await fetch(`${CHATGPT_BASE}/api/v1/gptplus/status`, {
        headers: { "X-API-Key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }).catch(() => null);
      if (statusResp?.ok) {
        const statusJson = await statusResp.json().catch(() => null);
        if (statusJson && statusJson.available === false) {
          return {
            success: false,
            status: 503,
            errorData: {
              success: false,
              error: "unavailable",
              detail: "上游 ChatGPT 激活通道当前正在例行维护，您的卡密未被消耗，请稍后再试。",
            },
          };
        }
      }

      // 2) 提交激活 (最坏约 80s 返回，超时必须设 >= 90s)
      let resp: Response | null = null;
      let data: any = null;
      try {
        resp = await fetch(`${CHATGPT_BASE}/api/v1/gptplus/redeem`, {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            card_code: code,
            session_data: parsedSession,
            confirm_duplicate: Boolean(body.confirm_duplicate),
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(95000),
        });
        data = await resp.json().catch(() => ({}));
      } catch {
        // 网络超时保护：切勿盲目重提！先查询 /jobs 看上游是否已建单
        const jobsRes = await fetch(
          `${CHATGPT_BASE}/api/v1/gptplus/jobs?card_code=${encodeURIComponent(code)}&limit=1`,
          {
            headers: { "X-API-Key": apiKey },
            cache: "no-store",
            signal: AbortSignal.timeout(12000),
          }
        ).catch(() => null);
        if (jobsRes?.ok) {
          const jobsData = await jobsRes.json().catch(() => null);
          const firstJob = jobsData?.items?.[0];
          if (firstJob?.task_id) {
            data = {
              success: true,
              task_id: firstJob.task_id,
              product: firstJob.product,
              product_name_zh: firstJob.product_name_zh || firstJob.product_name,
              email: firstJob.email,
            };
            resp = new Response(null, { status: 200 });
          }
        }
        if (!data?.task_id) {
          metric("activation.submit", 1, { line, outcome: "timeout" });
          return {
            success: false,
            status: 502,
            errorData: {
              success: false,
              error: "submit_timeout_check_first",
              detail:
                "提交响应超时。为保护卡密不重复扣次，请先前往【03. 凭据查询】输入该卡密确认是否已受理，未受理再重试。",
            },
          };
        }
      }

      // 409 card_in_progress 带 job_id 时直接无缝恢复轮询原任务！
      if (resp && resp.status === 409 && data?.error === "card_in_progress" && data?.job_id) {
        data = {
          success: true,
          task_id: data.job_id,
          product: matchedProduct?.id || "gpt_plus_self",
          product_name_zh: matchedProduct?.name || "ChatGPT 订阅",
          email: parsedSession?.user?.email || "",
          resumed: true,
        };
      } else if (!resp || !resp.ok || data?.success === false) {
        metric("activation.submit", 1, { line, outcome: data?.error || "rejected" });
        if (resp?.status === 409 && data?.duplicate) {
          return {
            success: false,
            status: 409,
            errorData: data as DuplicateConfirmError,
          };
        }
        return {
          success: false,
          status: resp?.status || 400,
          errorData: {
            success: false,
            error: data?.error || "redeem_failed",
            detail: data?.detail_zh || data?.detail || "激活任务提交未通过（前置拦截不消耗卡密）",
          },
        };
      }

      const taskId = String(data.task_id || data.id);
      const productName = data.product_name_zh || data.product_name || matchedProduct?.name || "ChatGPT 订阅";
      const targetEmail = data.email || parsedSession?.user?.email || "ChatGPT User";

      const storedTask: StoredActivationTask = {
        task_id: taskId,
        line: "chatgpt",
        card_code: code,
        card_code_masked: masked,
        product_id: data.product || matchedProduct?.id || "gpt_plus_self",
        product_name: productName,
        target_email: targetEmail,
        status: "QUEUED",
        upstream_status: "queued",
        progress: 20,
        finished: false,
        success: false,
        created_at: nowIso,
        updated_at: nowIso,
        log_trace: [
          {
            timestamp: nowIso,
            level: "INFO",
            message: data.resumed
              ? `检测到该卡密已有在途/近期任务 (${taskId})，已无缝接管进度追踪...`
              : `任务已由上游集群受理 -> [${productName}]，目标账号: ${targetEmail}`,
          },
          {
            timestamp: nowIso,
            level: "INFO",
            message: code.toUpperCase().startsWith("P50X-")
              ? "Pro 50x 为全系统单车道精工队列，排队可能耗时数分钟至十余分钟，请保持登录耐心等待..."
              : "正在排队执行官方结算授权，期间请勿在浏览器退出 ChatGPT 登录...",
          },
        ],
      };

      await saveVaultActivationTask(storedTask);
      metric("activation.submit", 1, { line, outcome: "accepted" });
      metric("activation.submit_duration_ms", performance.now() - startedAt, { line });
      return { success: true, task: storedTask };
    }

    // -------------------- Line 2: Grok (Plus / Premium / Super / Ultra) --------------------
    if (line === "grok") {
      let cookiePayload: any = body.grok_cookies ?? body.session_data;
      if (typeof cookiePayload === "string") {
        const trimmed = cookiePayload.trim();
        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
          try {
            cookiePayload = JSON.parse(trimmed);
          } catch {
            // Keep as raw Cookie / cURL string (upstream supports Cookie header & cURL too!)
          }
        }
      }
      const rawStr = typeof cookiePayload === "string" ? cookiePayload : JSON.stringify(cookiePayload || "");
      if (!rawStr.includes("sso") || !rawStr.includes("sso-rw")) {
        return {
          success: false,
          status: 400,
          errorData: {
            success: false,
            error: "invalid_session",
            detail: "Grok 登录凭证必须同时包含 sso 与 sso-rw 两项 Cookie（推荐用 Cookie-Editor 导出 JSON）",
          },
        };
      }

      const resp = await fetch(`${CHATGPT_BASE}/api/v1/grok/redeem`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          card_code: code,
          session_data: cookiePayload,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(45000),
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || data.success === false) {
        metric("activation.submit", 1, { line, outcome: data.error || "rejected" });
        return {
          success: false,
          status: resp.status || 400,
          errorData: {
            success: false,
            error: data.error || "grok_redeem_failed",
            detail: data.detail_zh || data.detail || "Grok 提交未通过（未扣款、不消耗卡密）",
          },
        };
      }

      const rawId = String(data.task_id || data.id);
      const taskId = `grok_${rawId}`;
      const storedTask: StoredActivationTask = {
        task_id: taskId,
        line: "grok",
        card_code: code,
        card_code_masked: masked,
        product_id: data.product || "grok_cdk",
        product_name: data.product_name || data.plan || "Grok 订阅",
        target_email: data.email || "Grok Account",
        status: "QUEUED",
        upstream_status: "queued",
        progress: 22,
        finished: false,
        success: false,
        created_at: nowIso,
        updated_at: nowIso,
        extra_data: { upstream_task_id: rawId },
        log_trace: [
          {
            timestamp: nowIso,
            level: "INFO",
            message: `Grok 激活任务已受理 (ID: ${rawId})，正在核验账号与首月优惠资格...`,
          },
        ],
      };

      await saveVaultActivationTask(storedTask);
      metric("activation.submit", 1, { line, outcome: "accepted" });
      return { success: true, task: storedTask };
    }

    // -------------------- Line 3: Gemini 学生认证 SheerID (GSTU-) --------------------
    if (line === "sheerid") {
      const url = (body.sheerid_url || "").trim();
      const sheeridRegex = /^https:\/\/services\.sheerid\.com\/verify\/[0-9a-fA-F]{24}\/?\?.*verificationId=[0-9a-fA-F]{24}/;
      if (!sheeridRegex.test(url)) {
        return {
          success: false,
          status: 400,
          errorData: {
            success: false,
            error: "link_bad",
            detail:
              "请输入从 gemini.google/students 获取的完整 SheerID 验证链接（格式形如 https://services.sheerid.com/verify/<24位ID>/?verificationId=<24位ID>）",
          },
        };
      }

      const resp = await fetch(`${MAIN_BASE}/api/sheerid/submit`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cdk: code, url }),
        cache: "no-store",
        signal: AbortSignal.timeout(65000),
      });
      const data = await resp.json().catch(() => ({}));

      // 409 task_active 表示该卡已有在途认证，直接转入状态追踪
      if (!resp.ok && !(resp.status === 409 && data.code === "task_active")) {
        metric("activation.submit", 1, { line, outcome: data.code || "rejected" });
        return {
          success: false,
          status: resp.status || 400,
          errorData: {
            success: false,
            error: data.code || "sheerid_submit_failed",
            detail:
              data.code === "link_used"
                ? "该 SheerID 验证链接已提交过，请回到 Google 学生页面重新获取一条新链接再提交（卡密未消耗）"
                : data.error || data.message || "学生认证链接提交未通过",
          },
        };
      }

      const taskId = `sheerid_${code.toUpperCase()}`;
      const storedTask: StoredActivationTask = {
        task_id: taskId,
        line: "sheerid",
        card_code: code,
        card_code_masked: masked,
        product_id: "sheerid_student_verify_15",
        product_name: "Gemini 学生身份认证 (SheerID)",
        target_email: url.slice(0, 56) + "...",
        status: "SUBSCRIPTION_PROVISIONING",
        upstream_status: data.status || "queued",
        progress: 35,
        finished: false,
        success: false,
        created_at: nowIso,
        updated_at: nowIso,
        log_trace: [
          {
            timestamp: nowIso,
            level: "INFO",
            message: data.message || "SheerID 验证链接已受理，正在自动执行学生资格核验（每 10 秒同步进度）...",
          },
        ],
      };

      await saveVaultActivationTask(storedTask);
      metric("activation.submit", 1, { line, outcome: "accepted" });
      return { success: true, task: storedTask };
    }

    // -------------------- Line 4: Codex / OpenAI 实时接码 (SMS-) --------------------
    if (line === "codex_sms") {
      const action = body.sms_action || "get_number";
      const taskId = `sms_${code.toUpperCase()}`;

      if (action === "get_number") {
        const resp = await fetch(`${MAIN_BASE}/api/codex-sms/number`, {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cdk: code }),
          cache: "no-store",
          signal: AbortSignal.timeout(92000),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.success) {
          return {
            success: false,
            status: resp.status || 400,
            errorData: {
              success: false,
              error: data.code || "sms_number_failed",
              detail:
                data.code === "no_numbers"
                  ? "当前海外运营商号池瞬时繁忙，卡密未消耗，请等 1 分钟后再点取号"
                  : data.message || "获取接码号码失败",
            },
          };
        }

        const act = data.activation || {};
        const smsState: SmsActivationState = {
          id: act.id,
          status: act.status || "waiting",
          country_en: act.country_en || act.country || "Overseas",
          dial_code: act.dial_code || "",
          local: act.local || "",
          code: act.code || null,
          codes: act.codes || [],
          sms_text: act.sms_text || null,
          seconds_left: act.seconds_left,
          cancel_in: act.cancel_in,
          can_cancel: Boolean(act.can_cancel),
          can_resend: Boolean(act.can_resend),
          can_finish: Boolean(act.can_finish),
          numbers_left: data.card?.numbers_left,
          card_state: data.card?.state,
        };

        const storedTask: StoredActivationTask = {
          task_id: taskId,
          line: "codex_sms",
          card_code: code,
          card_code_masked: masked,
          product_id: "codex_sms_4",
          product_name: "Codex / OpenAI 海外接码",
          target_email: `${smsState.dial_code} ${smsState.local}`.trim(),
          status: smsState.code ? "CODE_RECEIVED" : "WAITING_SMS",
          upstream_status: smsState.status,
          progress: smsState.code ? 100 : 50,
          finished: smsState.status === "finished",
          success: Boolean(smsState.code),
          sms_state: smsState,
          created_at: nowIso,
          updated_at: nowIso,
          log_trace: [
            {
              timestamp: nowIso,
              level: "INFO",
              message: data.already
                ? `已恢复当前进行中的专属号码: ${smsState.dial_code} ${smsState.local} (${smsState.country_en})`
                : `成功分配专属号码: ${smsState.dial_code} ${smsState.local} (${smsState.country_en})，请在注册页发送验证码...`,
            },
          ],
        };

        await saveVaultActivationTask(storedTask);
        metric("activation.submit", 1, { line, outcome: "number_assigned" });
        return { success: true, task: storedTask };
      }

      // SMS 控制操作: resend / cancel / finish
      const resp = await fetch(`${MAIN_BASE}/api/codex-sms/action`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cdk: code,
          id: body.sms_activation_id,
          action,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(92000),
      });
      const data = await resp.json().catch(() => ({}));

      // 409 code_arrived 表示取消瞬间验证码刚好到达！立即拉取最新状态返回给用户
      if (!resp.ok && !(resp.status === 409 && data.code === "code_arrived")) {
        return {
          success: false,
          status: resp.status || 400,
          errorData: {
            success: false,
            error: data.code || "sms_action_failed",
            detail:
              data.code === "cancel_early"
                ? "取号满约 2 分钟且未收到短信后才可无损取消换号，请留意倒计时"
                : data.message || "接码操作未生效",
          },
        };
      }

      const refreshed = await pollActivationTask(taskId);
      if (refreshed) {
        return { success: true, task: refreshed };
      }

      return {
        success: false,
        status: 404,
        errorData: { success: false, error: "sms_session_not_found", detail: "未找到当前接码会话" },
      };
    }

    // -------------------- Line 5: Telegram Premium (TGPREM-) --------------------
    if (line === "tg_premium") {
      const username = normalizeTgUsername(body.tg_username);
      if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(username)) {
        return {
          success: false,
          status: 400,
          errorData: {
            success: false,
            error: "INVALID_USERNAME_FORMAT",
            detail: "请输入合法的 Telegram 用户名（5–32 位，字母开头，不含空格，如 @example_user）",
          },
        };
      }

      const resp = await fetch(`${MAIN_BASE}/api/tgprem/redeem`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cdk: code, username }),
        cache: "no-store",
        signal: AbortSignal.timeout(35000),
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || (!data.ok && !data.task_id)) {
        return {
          success: false,
          status: resp.status || 400,
          errorData: {
            success: false,
            error: data.code || "tgprem_redeem_failed",
            detail: data.error || data.detail || "Telegram 会员提交未通过（卡密未消耗）",
          },
        };
      }

      const rawId = String(data.task_id);
      const taskId = `tg_${rawId}`;
      const storedTask: StoredActivationTask = {
        task_id: taskId,
        line: "tg_premium",
        card_code: code,
        card_code_masked: masked,
        product_id: "tg_premium",
        product_name: "Telegram Premium 官方直充",
        target_email: `@${username}`,
        status: "TOPUP_DISPATCHING",
        upstream_status: data.status || "queued",
        progress: 35,
        finished: false,
        success: false,
        created_at: nowIso,
        updated_at: nowIso,
        extra_data: { upstream_task_id: rawId },
        log_trace: [
          {
            timestamp: nowIso,
            level: "INFO",
            message: `已受理向 @${username} 发放 Telegram 大会员任务 (${rawId})，预计 30秒–2分钟空投到账...`,
          },
        ],
      };

      await saveVaultActivationTask(storedTask);
      metric("activation.submit", 1, { line, outcome: "accepted" });
      return { success: true, task: storedTask };
    }

    // -------------------- Line 6: Muse 邀请助力 (MB-) --------------------
    if (line === "muse_boost") {
      const inviteCode = (body.invite_code || "").trim();
      const uses = Math.min(Math.max(Number(body.uses) || 1, 1), 30);

      if (!/^[a-zA-Z0-9]{6}$/.test(inviteCode)) {
        return {
          success: false,
          status: 400,
          errorData: {
            success: false,
            error: "bad_invite_code",
            detail: "请输入准确的 6 位字母数字 Muse 邀请码（注意：每个邀请码累计上限 30 次）",
          },
        };
      }

      const resp = await fetch(`${MAIN_BASE}/api/muse-boost/redeem`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          card_code: code,
          invite_code: inviteCode,
          uses,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(125000),
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data.ok) {
        return {
          success: false,
          status: resp.status || 400,
          errorData: {
            success: false,
            error: "muse_redeem_failed",
            detail: data.detail || data.message || "Muse 邀请助力提交未通过",
          },
        };
      }

      const orderId = String(data.order_id || data.order_ids?.[0]);
      const taskId = `muse_${orderId}`;
      const storedTask: StoredActivationTask = {
        task_id: taskId,
        line: "muse_boost",
        card_code: code,
        card_code_masked: masked,
        product_id: "muse_invite_boost",
        product_name: `Muse 邀请助力 (${uses}次 · +${uses * 10}亿 Token)`,
        target_email: `邀请码: ${inviteCode}`,
        status: "TOPUP_DISPATCHING",
        upstream_status: data.status || "running",
        progress: 40,
        finished: false,
        success: false,
        created_at: nowIso,
        updated_at: nowIso,
        extra_data: {
          upstream_order_id: orderId,
          order_ids: data.order_ids || [orderId],
          uses,
          remaining_uses: data.remaining_uses,
          queue_position: data.queue_position,
        },
        log_trace: [
          {
            timestamp: nowIso,
            level: "INFO",
            message: `${data.message || "已提交邀请助力"} (单号: ${orderId}，卡密剩余 ${data.remaining_uses ?? "?"} 次)`,
          },
        ],
      };

      await saveVaultActivationTask(storedTask);
      metric("activation.submit", 1, { line, outcome: "accepted" });
      return { success: true, task: storedTask };
    }

    // -------------------- Line 7: Gemini Pro 3个月 (G-3MON-) --------------------
    if (line === "gemini_pro") {
      const email = (body.google_email || "").trim();
      const password = body.google_password || "";
      const twofa = (body.google_twofa || "").replace(/\s+/g, "").trim();

      if (!email || !email.includes("@") || !password || !twofa) {
        return {
          success: false,
          status: 400,
          errorData: {
            success: false,
            error: "missing_google_credentials",
            detail: "请完整填写 Google 邮箱、密码以及 Base32 两步验证密钥（或 8 位一次性备用码）",
          },
        };
      }

      if (/^\d{6}$/.test(twofa)) {
        return {
          success: false,
          status: 400,
          errorData: {
            success: false,
            error: "totp_6digit_not_supported",
            detail:
              "不接受会过期的 6 位动态验证码！请填写 16–256 位 Base32 密钥串，或 Google 账号安全设置里的 8 位一次性备用码。",
          },
        };
      }

      const payload: Record<string, string> = { code, email, password, twofa };
      if (body.recovery_email?.trim()) {
        payload.recovery_email = body.recovery_email.trim();
      }

      const resp = await fetch(`${MAIN_BASE}/api/gemini-pixel/submit`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(45000),
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data.success) {
        return {
          success: false,
          status: resp.status || 400,
          errorData: {
            success: false,
            error: data.code || "gemini_submit_failed",
            detail: data.reason || data.message || "Gemini Pro 激活提交未通过",
          },
        };
      }

      const taskId = `gpro_${code.toUpperCase()}`;
      const storedTask: StoredActivationTask = {
        task_id: taskId,
        line: "gemini_pro",
        card_code: code,
        card_code_masked: masked,
        product_id: "gemini_pixel_6m_9",
        product_name: "Gemini Pro 3个月个人订阅",
        target_email: email,
        status: "SUBSCRIPTION_PROVISIONING",
        upstream_status: data.status || "Pending",
        progress: 35,
        finished: false,
        success: false,
        created_at: nowIso,
        updated_at: nowIso,
        log_trace: [
          {
            timestamp: nowIso,
            level: "INFO",
            message: `Google 账号 (${email}) 订阅开通请求已受理，正在排队执行自动化授权（每 12 秒同步状态）...`,
          },
        ],
      };

      await saveVaultActivationTask(storedTask);
      metric("activation.submit", 1, { line, outcome: "accepted" });
      return { success: true, task: storedTask };
    }

    return {
      success: false,
      status: 400,
      errorData: { success: false, error: "unsupported_line", detail: "未能匹配对应的激活通道" },
    };
  } catch (err: any) {
    console.error("[ActivationRouter] Submit error:", err?.message);
    return {
      success: false,
      status: 502,
      errorData: {
        success: false,
        error: "upstream_gateway_error",
        detail: "连接上游激活网关异常，请稍后查询卡密状态确认是否已受理",
      },
    };
  }
}

// ==================== 3. 归一化任务轮询引擎 (彻底杜绝 undefined log_trace 崩溃) ====================

export async function pollActivationTask(taskId: string): Promise<TaskRecord | null> {
  const cleanId = taskId.trim();
  let stored = await getVaultActivationTask(cleanId);
  const apiKey = await getActivationApiKey();

  // 若数据库中尚无记录（例如用户直接用上游纯 task_id 查询），尝试按 ChatGPT 任务拉取并归一化
  if (!stored && apiKey && !cleanId.includes("_")) {
    try {
      const resp = await fetch(`${CHATGPT_BASE}/api/v1/gptplus/task/${encodeURIComponent(cleanId)}`, {
        headers: { "X-API-Key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (resp.ok) {
        const d = await resp.json();
        if (d?.success) {
          stored = {
            task_id: cleanId,
            line: "chatgpt",
            card_code: d.card_key || "",
            card_code_masked: maskCardCode(d.card_key || cleanId),
            product_id: d.product || "gpt_plus_self",
            product_name: d.product_name_zh || d.product_name || "ChatGPT 订阅",
            target_email: d.email || "",
            status: "QUEUED",
            upstream_status: d.status || "queued",
            progress: 25,
            finished: false,
            success: false,
            created_at: d.submitted_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            log_trace: [
              {
                timestamp: new Date().toISOString(),
                level: "INFO",
                message: `已连接上游任务 (${cleanId})，实时同步履约状态...`,
              },
            ],
          };
        }
      }
    } catch {
      // Ignore
    }
  }

  if (!stored) return null;
  if (!apiKey) return stored;

  // 已进入终态且非接码任务时直接返回持久化的归一化对象
  if (stored.finished && stored.line !== "codex_sms") {
    return stored;
  }

  try {
    // 1. ChatGPT 轮询
    if (stored.line === "chatgpt") {
      const resp = await fetch(`${CHATGPT_BASE}/api/v1/gptplus/task/${encodeURIComponent(stored.task_id)}`, {
        headers: { "X-API-Key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) return stored;
      const d = await resp.json();

      let nextStatus: TaskRecord["status"] = "QUEUED";
      let progress = stored.progress;
      let traces = stored.log_trace;

      if (d.status === "queued") {
        nextStatus = "QUEUED";
        progress = Math.min(Math.max(progress, 25), 40);
        traces = appendTrace(traces, "INFO", d.message_zh || "任务正在队列中等待调度...");
      } else if (d.status === "running") {
        if (d.action_required) {
          nextStatus = "ACTION_REQUIRED";
          progress = 68;
          traces = appendTrace(
            traces,
            "WARN",
            "⚠️ 上游请求完成一次安全验证 (manual_captcha)，请点击右侧验证按钮完成人机核验！"
          );
        } else {
          nextStatus = "SUBSCRIPTION_PROVISIONING";
          progress = Math.min(Math.max(progress + 6, 55), 88);
          traces = appendTrace(
            traces,
            "INFO",
            d.message_zh || "正在执行官方账单结算与订阅下发，请保持 ChatGPT 登录态..."
          );
        }
      } else if (d.status === "success" || (d.finished && !d.error_code && d.status !== "failed")) {
        nextStatus = "COMPLETED";
        progress = 100;
        traces = appendTrace(
          traces,
          "SUCCESS",
          `🎉 订阅开通成功！(${d.message_zh || "权益已生效"})，请刷新 chatgpt.com 页面查收。`
        );
      } else if (d.status === "failed" || d.finished) {
        nextStatus = "FAILED";
        progress = 100;
        const disp = mapChatGptErrorDisposal(d.error_code, d.message_zh || d.message);
        stored.error_code = d.error_code || "activation_failed";
        stored.error_message = disp.message;
        stored.disposal_hint = disp.disposal_hint;
        stored.can_retry = disp.can_retry;
        stored.forbid_resubmit = disp.forbid_resubmit;
        traces = appendTrace(traces, "ERROR", `❌ 任务未完成 [${stored.error_code}]: ${disp.message}`);
      }

      const updated: StoredActivationTask = {
        ...stored,
        product_name: d.product_name_zh || d.product_name || stored.product_name,
        target_email: d.email || stored.target_email,
        status: nextStatus,
        upstream_status: d.status,
        progress,
        finished: Boolean(d.finished),
        success: d.status === "success",
        action_required: d.action_required || null,
        verification_url: d.verification_url || null,
        verification_expires_at: d.verification_expires_at || null,
        updated_at: new Date().toISOString(),
        log_trace: traces,
      };
      await saveVaultActivationTask(updated);
      return updated;
    }

    // 2. Grok 轮询
    if (stored.line === "grok") {
      const rawId = String(stored.extra_data?.upstream_task_id || stored.task_id.replace(/^grok_/, ""));
      const resp = await fetch(`${CHATGPT_BASE}/api/v1/grok/task/${encodeURIComponent(rawId)}`, {
        headers: { "X-API-Key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) return stored;
      const d = await resp.json();

      let nextStatus: TaskRecord["status"] = "QUEUED";
      let progress = stored.progress;
      let traces = stored.log_trace;

      if (d.status === "queued") {
        nextStatus = "QUEUED";
        progress = 30;
      } else if (d.status === "running") {
        if (d.action_required) {
          nextStatus = "ACTION_REQUIRED";
          progress = 70;
          traces = appendTrace(traces, "WARN", "⚠️ 需要完成一次 3DS 银行安全验证，请点击验证窗口完成确认！");
        } else {
          nextStatus = "SUBSCRIPTION_PROVISIONING";
          progress = Math.min(Math.max(progress + 8, 55), 88);
          traces = appendTrace(traces, "INFO", d.message_zh || "正在为 Grok 账号绑定订阅权益...");
        }
      } else if (d.status === "success") {
        nextStatus = "COMPLETED";
        progress = 100;
        traces = appendTrace(traces, "SUCCESS", "🎉 Grok 订阅已生效！请刷新 grok.com 体验完整配额。");
      } else if (d.status === "failed" || d.finished) {
        nextStatus = "FAILED";
        progress = 100;
        const forbid = d.error_code === "payment_unverified";
        stored.error_code = d.error_code || "grok_failed";
        stored.error_message = d.message_zh || d.message || "Grok 激活失败";
        stored.forbid_resubmit = forbid;
        stored.disposal_hint = forbid
          ? "⚠️ 付款结果待核实，请勿重复提交！请直接提交售后工单由站长核对。"
          : d.error_code === "card_declined"
          ? "卡密未消耗；官方风控拒付通常与该 Grok 账号有关，建议更换一个新 Grok 账号重试。"
          : "若卡密未消耗，请核对首月优惠资格或更换账号后重试。";
        traces = appendTrace(traces, "ERROR", `❌ Grok 开通失败 [${stored.error_code}]: ${stored.error_message}`);
      }

      const updated: StoredActivationTask = {
        ...stored,
        status: nextStatus,
        upstream_status: d.status,
        progress,
        finished: Boolean(d.finished),
        success: d.status === "success",
        action_required: d.action_required || null,
        verification_url: d.verification_url || null,
        updated_at: new Date().toISOString(),
        log_trace: traces,
      };
      await saveVaultActivationTask(updated);
      return updated;
    }

    // 3. SheerID Gemini 学生认证轮询
    if (stored.line === "sheerid") {
      const resp = await fetch(`${MAIN_BASE}/api/sheerid/status`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cdk: stored.card_code }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) return stored;
      const d = await resp.json();

      const st = d.status || "processing";
      let nextStatus: TaskRecord["status"] = "SUBSCRIPTION_PROVISIONING";
      let progress = Math.min(stored.progress + 10, 88);
      let finished = false;
      let success = false;
      let traces = stored.log_trace;

      if (st === "success") {
        nextStatus = "COMPLETED";
        progress = 100;
        finished = true;
        success = true;
        traces = appendTrace(traces, "SUCCESS", `🎉 ${d.message || "学生身份认证已通过！请点击下方专属链接领取优惠。"}`);
      } else if (st === "failed" || st === "canceled" || st === "refund_required") {
        nextStatus = "FAILED";
        progress = 100;
        finished = true;
        success = false;
        stored.error_code = st;
        stored.error_message = d.message || d.error || "学生认证未通过";
        stored.can_retry = st === "failed" || st === "canceled";
        stored.forbid_resubmit = st === "refund_required";
        stored.disposal_hint =
          st === "refund_required"
            ? "该卡密异常作废，请点击提交售后工单联系站长补换。"
            : "卡密额度已自动恢复！请回到 gemini.google/students 刷新并复制一条全新的验证链接重新提交。";
        traces = appendTrace(traces, "ERROR", `❌ ${stored.error_message}`);
      } else {
        traces = appendTrace(traces, "INFO", d.message || `SheerID 认证审核进行中 (${st})...`);
      }

      const updated: StoredActivationTask = {
        ...stored,
        status: nextStatus,
        upstream_status: st,
        progress,
        finished,
        success,
        redirect_url: d.redirect_url || stored.redirect_url || null,
        updated_at: new Date().toISOString(),
        log_trace: traces,
      };
      await saveVaultActivationTask(updated);
      return updated;
    }

    // 4. Codex 短信接码实时轮询
    if (stored.line === "codex_sms") {
      const payload: Record<string, unknown> = { cdk: stored.card_code };
      if (stored.sms_state?.id) payload.id = stored.sms_state.id;

      const resp = await fetch(`${MAIN_BASE}/api/codex-sms/status`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) return stored;
      const d = await resp.json();
      if (!d.success) return stored;

      const act = d.activation;
      let traces = stored.log_trace;
      let nextStatus: TaskRecord["status"] = stored.status;
      let finished = false;
      let success = stored.success;
      let progress = stored.progress;

      const smsState: SmsActivationState | null = act
        ? {
            id: act.id,
            status: act.status,
            country_en: act.country_en || act.country || stored.sms_state?.country_en,
            dial_code: act.dial_code || stored.sms_state?.dial_code,
            local: act.local || stored.sms_state?.local,
            code: act.code || null,
            codes: act.codes || [],
            sms_text: act.sms_text || null,
            seconds_left: act.seconds_left,
            cancel_in: act.cancel_in,
            can_cancel: Boolean(act.can_cancel),
            can_resend: Boolean(act.can_resend),
            can_finish: Boolean(act.can_finish),
            numbers_left: d.card?.numbers_left,
            card_state: d.card?.state,
            refunded: act.refunded,
            reason: act.reason,
          }
        : null;

      if (smsState?.code) {
        nextStatus = "CODE_RECEIVED";
        progress = 100;
        success = true;
        traces = appendTrace(traces, "SUCCESS", `📩 收到验证码: 【${smsState.code}】！请立即复制填入验证页。`);
      } else if (smsState?.status === "cancelled" || smsState?.status === "failed") {
        nextStatus = "FAILED";
        finished = true;
        progress = 100;
        stored.error_message = `当前号码已取消释放（卡密额度未扣减，剩余可取号 ${d.card?.numbers_left ?? "?"} 次）`;
        traces = appendTrace(traces, "WARN", stored.error_message);
      } else if (smsState?.status === "finished") {
        nextStatus = "COMPLETED";
        finished = true;
        progress = 100;
        traces = appendTrace(traces, "SUCCESS", "✅ 接码会话已顺利完成结束。");
      }

      const updated: StoredActivationTask = {
        ...stored,
        status: nextStatus,
        upstream_status: smsState?.status || "idle",
        progress,
        finished,
        success,
        sms_state: smsState,
        updated_at: new Date().toISOString(),
        log_trace: traces,
      };
      await saveVaultActivationTask(updated);
      return updated;
    }

    // 5. Telegram Premium 轮询
    if (stored.line === "tg_premium") {
      const rawId = String(stored.extra_data?.upstream_task_id || stored.task_id.replace(/^tg_/, ""));
      const resp = await fetch(`${MAIN_BASE}/api/tgprem/status/${encodeURIComponent(rawId)}`, {
        headers: { "X-API-Key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) return stored;
      const d = await resp.json();

      const st = d.status || "queued";
      let nextStatus: TaskRecord["status"] = "TOPUP_DISPATCHING";
      let progress = Math.min(stored.progress + 12, 88);
      let finished = false;
      let success = false;
      let traces = stored.log_trace;

      if (st === "done") {
        nextStatus = "COMPLETED";
        progress = 100;
        finished = true;
        success = true;
        traces = appendTrace(traces, "SUCCESS", `🎉 ${d.detail || "Telegram Premium 会员已空投到账！"}`);
      } else if (st === "failed" || st === "released" || st === "unknown") {
        nextStatus = "FAILED";
        progress = 100;
        finished = true;
        stored.error_code = st;
        stored.error_message = d.detail || d.error || "Telegram 会员发放未完成";
        stored.forbid_resubmit = st === "unknown";
        stored.disposal_hint =
          st === "unknown"
            ? "订单已进入人工复核，请保留单号提交工单核实，切勿重复提交。"
            : "卡密额度已自动恢复，请核对 @username 是否无误且当前无生效会员后重试。";
        traces = appendTrace(traces, "ERROR", `❌ ${stored.error_message}`);
      } else {
        traces = appendTrace(traces, "INFO", d.detail || `官方空投发放中 (${st})...`);
      }

      const updated: StoredActivationTask = {
        ...stored,
        status: nextStatus,
        upstream_status: st,
        progress,
        finished,
        success,
        updated_at: new Date().toISOString(),
        log_trace: traces,
      };
      await saveVaultActivationTask(updated);
      return updated;
    }

    // 6. Muse 邀请助力轮询
    if (stored.line === "muse_boost") {
      const orderId = String(stored.extra_data?.upstream_order_id || stored.task_id.replace(/^muse_/, ""));
      const resp = await fetch(`${MAIN_BASE}/api/muse-boost/orders`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [orderId] }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) return stored;
      const d = await resp.json();
      const item = d.orders?.[0];
      if (!item) return stored;

      const st = item.status || "running";
      let nextStatus: TaskRecord["status"] = "TOPUP_DISPATCHING";
      let progress = Math.min(stored.progress + 15, 90);
      let finished = false;
      let success = false;
      let traces = stored.log_trace;

      if (st === "completed") {
        nextStatus = "COMPLETED";
        progress = 100;
        finished = true;
        success = true;
        traces = appendTrace(
          traces,
          "SUCCESS",
          `🎉 ${item.message || "Muse 邀请助力已完成"}（到账 ${item.completed ?? item.uses} 次 · 共 +${(item.completed ?? item.uses) * 10}亿 Token）`
        );
      } else if (st === "failed" || st === "not_found") {
        nextStatus = "FAILED";
        progress = 100;
        finished = true;
        stored.error_code = st;
        stored.error_message = item.message || "助力未完成";
        stored.forbid_resubmit = item.card_refunded === false;
        stored.disposal_hint =
          item.card_refunded === false
            ? "次数未自动退回，请勿重复提交，附带单号提交售后工单核实。"
            : "助力次数已退回卡密，请核对邀请码未满 30 次上限后重试。";
        traces = appendTrace(traces, "ERROR", `❌ ${stored.error_message}`);
      } else {
        traces = appendTrace(
          traces,
          "INFO",
          `${item.message || "正在执行助力"} (${item.completed ?? 0}/${item.requested ?? item.uses})`
        );
      }

      const updated: StoredActivationTask = {
        ...stored,
        status: nextStatus,
        upstream_status: st,
        progress,
        finished,
        success,
        updated_at: new Date().toISOString(),
        log_trace: traces,
      };
      await saveVaultActivationTask(updated);
      return updated;
    }

    // 7. Gemini Pro 3个月轮询
    if (stored.line === "gemini_pro") {
      const resp = await fetch(`${MAIN_BASE}/api/gemini-pixel/status`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: stored.card_code }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) return stored;
      const d = await resp.json();

      const st = d.status || "Pending";
      let nextStatus: TaskRecord["status"] = "SUBSCRIPTION_PROVISIONING";
      let progress = Math.min(stored.progress + 10, 88);
      let finished = false;
      let success = false;
      let traces = stored.log_trace;

      if (st === "Success") {
        nextStatus = "COMPLETED";
        progress = 100;
        finished = true;
        success = true;
        traces = appendTrace(
          traces,
          "SUCCESS",
          `🎉 Gemini Pro 3个月个人订阅已生效！${d.sub_expiry ? "到期时间: " + d.sub_expiry : ""}`
        );
      } else if (st === "Failed") {
        nextStatus = "FAILED";
        progress = 100;
        finished = true;
        const canRetry = Boolean(d.refunded && d.can_submit && !d.pending_confirmation);
        stored.error_code = "gemini_failed";
        stored.error_message = d.reason || "Gemini Pro 开通未通过";
        stored.can_retry = canRetry;
        stored.forbid_resubmit = !canRetry;
        stored.disposal_hint = canRetry
          ? "卡密额度已自动退回！请核对 Google 账号密码与 Base32 密钥无误后重新提交。"
          : "请勿重复提交，保留卡密联系客服核查状态。";
        traces = appendTrace(traces, "ERROR", `❌ ${stored.error_message}`);
      } else {
        traces = appendTrace(traces, "INFO", `Google 订阅绑定执行中 (当前状态: ${st})...`);
      }

      const updated: StoredActivationTask = {
        ...stored,
        status: nextStatus,
        upstream_status: st,
        progress,
        finished,
        success,
        updated_at: new Date().toISOString(),
        log_trace: traces,
      };
      await saveVaultActivationTask(updated);
      return updated;
    }

    return stored;
  } catch (err) {
    console.error("[ActivationRouter] Poll error:", err);
    return stored;
  }
}

// ==================== 4. 真实全链路凭据与订单溯源查询 (Order & CDK Trace) ====================

export async function traceOrderOrCredential(rawQuery: string) {
  const q = rawQuery.trim();
  if (!q) {
    return { success: false, error: "empty_query", detail: "请输入订单号、卡密或激活任务号" };
  }

  // A. 本站订单号 (QL-...)
  if (q.toUpperCase().startsWith("QL-")) {
    const order = await getVaultOrderById(q.toUpperCase());
    if (!order) {
      return {
        success: false,
        error: "order_not_found",
        detail: `未找到订单号 ${q.toUpperCase()}，请核对单号是否完整`,
      };
    }
    return {
      success: true,
      kind: "retail_order",
      order,
    };
  }

  // B. 买家预留联系方式检索最近订单 (微信号 / 邮箱 / 手机号，且不含卡密特征前缀)
  const looksLikeCard =
    /^(PLS-|P10X-|P5X-|P20X-|PH20-|P50X-|P500-|PH-|PRO|GROK-|GSTU-|G-3MON-|G-PRO-|SMS-|TGPREM-|MB-|MBT-)/i.test(q);
  const looksLikeTask = /^(task_|grok_|sheerid_|sms_|tg_|muse_|gpro_)/i.test(q) || /^[a-f0-9]{20,32}$/i.test(q);

  if (!looksLikeCard && !looksLikeTask) {
    const matchedOrders = await listVaultOrders({ buyerContact: q, limit: 10 });
    if (matchedOrders.length > 0) {
      return {
        success: true,
        kind: "retail_order_list",
        orders: matchedOrders,
      };
    }
  }

  // C. 激活任务 ID 直接查询
  if (looksLikeTask) {
    const task = await pollActivationTask(q);
    if (task) {
      return {
        success: true,
        kind: "activation_task",
        task,
      };
    }
  }

  // D. 全品类苏哲卡密实时体检 + 本站历史任务联查
  const localTasks = await findVaultTasksByCard(q);
  const latestTask = localTasks[0] ? await pollActivationTask(localTasks[0].task_id) : null;
  const upstreamCheck = await precheckActivation({ card_code: q });

  if (!upstreamCheck.success && !latestTask) {
    return {
      success: false,
      error: upstreamCheck.error || "not_found",
      detail:
        upstreamCheck.detail ||
        "未检索到该订单号、卡密或激活记录。请核对输入是否完整，或直接提交售后工单。",
    };
  }

  return {
    success: true,
    kind: "card_trace",
    card_code_masked: maskCardCode(q),
    card_code_raw: q,
    upstream: upstreamCheck,
    latest_task: latestTask,
  };
}
