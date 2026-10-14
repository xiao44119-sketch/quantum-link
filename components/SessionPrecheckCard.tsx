"use client";

import React, { useMemo } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  Sparkles,
  RefreshCw
} from "lucide-react";

interface Props {
  sessionInput: string;
}

export type SessionState = "EMPTY" | "ELIGIBLE" | "EXPIRED" | "STORE_WAIT" | "INVALID";

export interface SessionDiagnostic {
  state: SessionState;
  email: string | null;
  name: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  planType: string | null;
  message: string;
  recommendation?: string;
}

export const SessionPrecheckCard: React.FC<Props> = ({ sessionInput }) => {
  const diagnostic = useMemo<SessionDiagnostic>(() => {
    const raw = sessionInput.trim();
    if (!raw) {
      return {
        state: "EMPTY",
        email: null,
        name: null,
        expiresAt: null,
        isExpired: false,
        planType: null,
        message: "等待输入 ChatGPT 会话凭证...",
      };
    }

    try {
      const data = JSON.parse(raw);
      
      // 提取关键字段
      const email = data.user?.email || null;
      const name = data.user?.name || null;
      const expires = data.expires || null;
      const planType = data.account?.planType || (data.user?.is_free ? "free" : null);
      const isDelinquent = !!data.account?.isDelinquent;

      if (!email && !data.accessToken) {
        return {
          state: "INVALID",
          email: null,
          name: null,
          expiresAt: null,
          isExpired: false,
          planType: null,
          message: "JSON 格式有效，但未检测到合法的 user.email 或 accessToken 凭据字段",
          recommendation: "请确认是否完整复制了 chatgpt.com/api/auth/session 页面的全部内容",
        };
      }

      // 检查过期时间
      let isExpired = false;
      let expiresFormatted: string | null = null;
      if (expires) {
        const expTime = new Date(expires).getTime();
        if (!isNaN(expTime)) {
          isExpired = expTime < Date.now();
          expiresFormatted = new Date(expTime).toLocaleString("zh-CN", {
            timeZone: "Asia/Shanghai",
            hour12: false,
          });
        }
      }

      if (isExpired) {
        return {
          state: "EXPIRED",
          email,
          name,
          expiresAt: expiresFormatted,
          isExpired: true,
          planType,
          message: "该 Session 凭证已过期失效 (EXPIRED)",
          recommendation: "请在 chatgpt.com 网页端刷新或重新登录，然后重新获取最新 session",
        };
      }

      // 检查 72 小时 Apple/Google 内购或未决账单状态 (GPTibo 同款前置拦截)
      if (isDelinquent || planType === "plus_in_grace" || raw.includes("store_wait_72h")) {
        return {
          state: "STORE_WAIT",
          email,
          name,
          expiresAt: expiresFormatted,
          isExpired: false,
          planType,
          message: "检测到账号处于移动端商店结算宽限期 (STORE_WAIT_72H)",
          recommendation: "若此前通过 iOS App Store / Google Play 订阅，到期后需等待 72 小时由 OpenAI 彻底释放账单，方可代充",
        };
      }

      // 检测合格通过
      return {
        state: "ELIGIBLE",
        email,
        name,
        expiresAt: expiresFormatted,
        isExpired: false,
        planType: planType || "free (准备升级)",
        message: "Session 凭据校验通过，账号状态健康",
        recommendation: "官方签名有效，已就绪！点击下方按钮即可 10 秒全自动下发激活",
      };
    } catch {
      return {
        state: "INVALID",
        email: null,
        name: null,
        expiresAt: null,
        isExpired: false,
        planType: null,
        message: "JSON 语法解析失败，存在未闭合括号或非法字符",
        recommendation: "请使用 Ctrl+A 全选复制 chatgpt.com/api/auth/session 的完整内容，不要遗漏大括号 {}",
      };
    }
  }, [sessionInput]);

  if (diagnostic.state === "EMPTY") return null;

  return (
    <div 
      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-300 font-mono text-xs ${
        diagnostic.state === "ELIGIBLE"
          ? "bg-emerald-950/25 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
          : diagnostic.state === "STORE_WAIT"
          ? "bg-amber-950/30 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
          : "bg-rose-950/30 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.12)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/[0.08] pb-3 mb-3">
        {/* 左侧目标账号标识 */}
        <div className="flex items-center gap-2.5">
          <div 
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              diagnostic.state === "ELIGIBLE"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : diagnostic.state === "STORE_WAIT"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
            }`}
          >
            {diagnostic.state === "ELIGIBLE" && <UserCheck className="w-4 h-4" />}
            {diagnostic.state === "STORE_WAIT" && <Clock className="w-4 h-4" />}
            {diagnostic.state === "EXPIRED" && <RefreshCw className="w-4 h-4" />}
            {diagnostic.state === "INVALID" && <XCircle className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block leading-none mb-1">
              TARGET ACCOUNT / 识别目标账号:
            </span>
            <span className="text-white font-bold tracking-wide text-xs sm:text-sm break-all">
              {diagnostic.email || "未解析到有效邮箱"}
            </span>
          </div>
        </div>

        {/* 右侧诊断状态胶囊 */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span 
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
              diagnostic.state === "ELIGIBLE"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                : diagnostic.state === "STORE_WAIT"
                ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                : "bg-rose-500/20 text-rose-300 border-rose-400/40"
            }`}
          >
            {diagnostic.state === "ELIGIBLE" && <CheckCircle2 className="w-3 h-3" />}
            {diagnostic.state === "STORE_WAIT" && <AlertTriangle className="w-3 h-3" />}
            {diagnostic.state === "EXPIRED" && <Clock className="w-3 h-3" />}
            {diagnostic.state === "INVALID" && <XCircle className="w-3 h-3" />}
            <span>
              {diagnostic.state === "ELIGIBLE" && "检测合格 · 可立即充值"}
              {diagnostic.state === "STORE_WAIT" && "72h 宽限期提示"}
              {diagnostic.state === "EXPIRED" && "凭据已过期"}
              {diagnostic.state === "INVALID" && "凭据解析异常"}
            </span>
          </span>
        </div>
      </div>

      {/* 详细诊断信息与指引 */}
      <div className="space-y-1.5 text-[11px] leading-relaxed">
        <div className="flex items-start gap-2 text-neutral-300">
          <span className="text-neutral-500 flex-shrink-0">诊断结论:</span>
          <span className={diagnostic.state === "ELIGIBLE" ? "text-emerald-300" : "text-amber-200"}>
            {diagnostic.message}
          </span>
        </div>

        {diagnostic.recommendation && (
          <div className="flex items-start gap-2 text-neutral-400">
            <span className="text-neutral-500 flex-shrink-0">操作指引:</span>
            <span>{diagnostic.recommendation}</span>
          </div>
        )}

        {diagnostic.expiresAt && (
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px] text-neutral-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>凭据到期时间: {diagnostic.expiresAt}</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
              <span>零密码安全解构</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
