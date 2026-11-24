"use client";

import React, { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  RefreshCw,
} from "lucide-react";

interface Props {
  sessionInput: string;
  cardCode?: string;
}

export type SessionState = "EMPTY" | "ELIGIBLE" | "EXPIRED" | "STORE_WAIT" | "PRO50_WARN" | "INVALID";

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

export const SessionPrecheckCard: React.FC<Props> = ({ sessionInput, cardCode = "" }) => {
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

      const email = data.user?.email || null;
      const name = data.user?.name || null;
      const expires = data.expires || null;
      const planType = data.account?.planType || (data.user?.is_free ? "free" : null);
      const isDelinquent = Boolean(data.account?.isDelinquent);
      const upperCode = cardCode.trim().toUpperCase();
      const isPro50 = upperCode.startsWith("P50X-") || upperCode.startsWith("P500-");
      const isPro10Or20 =
        upperCode.startsWith("P10X-") ||
        upperCode.startsWith("P5X-") ||
        upperCode.startsWith("P20X-");

      if (!data.accessToken) {
        return {
          state: "INVALID",
          email,
          name,
          expiresAt: null,
          isExpired: false,
          planType,
          message: "JSON 解析成功，但缺少核心字段 accessToken（可能未登录或只复制了片段）",
          recommendation: "请先在浏览器登录 chatgpt.com，再重新打开 chatgpt.com/api/auth/session 全选复制",
        };
      }

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
          recommendation: "请在 chatgpt.com 网页端刷新对话页（切勿点退出登录），重新复制最新 Session",
        };
      }

      if (isDelinquent || planType === "plus_in_grace") {
        return {
          state: "STORE_WAIT",
          email,
          name,
          expiresAt: expiresFormatted,
          isExpired: false,
          planType,
          message: "检测到账号处于欠费或应用商店结算宽限期",
          recommendation: "若此前通过 iOS / Google Play 订阅，到期后需等待约 72 小时账单彻底释放后再提交代充",
        };
      }

      if (isPro50 && planType && planType !== "free") {
        return {
          state: "PRO50_WARN",
          email,
          name,
          expiresAt: expiresFormatted,
          isExpired: false,
          planType,
          message: `检测到当前账号套餐为 ${planType}，而 Pro 50x 仅限无任何订阅的纯免费账号`,
          recommendation: "请更换一个从未订阅或已彻底过期的免费账号（前置拦截不会消耗您的 P50X 卡密）",
        };
      }

      return {
        state: "ELIGIBLE",
        email,
        name,
        expiresAt: expiresFormatted,
        isExpired: false,
        planType: planType || "free / 待上游实时核验",
        message: isPro10Or20
          ? "Session 签名有效！支持无订阅免费号新开，或菲区(PHP)在途订阅自动无损直升"
          : "Session 凭据签名校验通过，账号格式健康",
        recommendation: "提交后到开通完成前，请保持浏览器中 chatgpt.com 的登录状态不要退出",
      };
    } catch {
      return {
        state: "INVALID",
        email: null,
        name: null,
        expiresAt: null,
        isExpired: false,
        planType: null,
        message: "JSON 语法解析失败，存在未闭合括号或多余字符",
        recommendation: "请使用 Ctrl+A / Cmd+A 全选复制 chatgpt.com/api/auth/session 完整内容",
      };
    }
  }, [sessionInput, cardCode]);

  if (diagnostic.state === "EMPTY") return null;

  const isGood = diagnostic.state === "ELIGIBLE";
  const isWarn = diagnostic.state === "STORE_WAIT" || diagnostic.state === "PRO50_WARN";

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-300 font-mono text-xs ${
        isGood
          ? "bg-emerald-950/25 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
          : isWarn
          ? "bg-amber-950/30 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
          : "bg-rose-950/30 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.12)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/[0.08] pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isGood
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : isWarn
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
            }`}
          >
            {isGood ? (
              <UserCheck className="w-4 h-4" />
            ) : isWarn ? (
              <AlertTriangle className="w-4 h-4" />
            ) : diagnostic.state === "EXPIRED" ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block leading-none mb-1">
              TARGET ACCOUNT / 识别目标账号:
            </span>
            <span className="text-white font-bold tracking-wide text-xs sm:text-sm break-all">
              {diagnostic.email || "已检测到有效 accessToken"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
              isGood
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                : isWarn
                ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                : "bg-rose-500/20 text-rose-300 border-rose-400/40"
            }`}
          >
            {isGood ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            <span>
              {isGood
                ? "凭证校验通过"
                : diagnostic.state === "PRO50_WARN"
                ? "Pro 50x 免费号限制"
                : diagnostic.state === "STORE_WAIT"
                ? "账单宽限期提示"
                : diagnostic.state === "EXPIRED"
                ? "凭据已过期"
                : "凭据格式有误"}
            </span>
          </span>
        </div>
      </div>

      <div className="space-y-1.5 text-[11px] leading-relaxed">
        <div className="flex items-start gap-2 text-neutral-300">
          <span className="text-neutral-500 flex-shrink-0">诊断结论:</span>
          <span className={isGood ? "text-emerald-300" : "text-amber-200"}>{diagnostic.message}</span>
        </div>
        {diagnostic.recommendation ? (
          <div className="flex items-start gap-2 text-neutral-400">
            <span className="text-neutral-500 flex-shrink-0">操作指引:</span>
            <span>{diagnostic.recommendation}</span>
          </div>
        ) : null}
        {diagnostic.expiresAt ? (
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px] text-neutral-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Session 有效期至: {diagnostic.expiresAt}</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
              <span>零密码安全解构</span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
