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
        message: "",
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
          message: "缺少核心字段 accessToken（可能未登录或仅复制了部分内容）",
          recommendation: "请先登录 chatgpt.com，重新打开 chatgpt.com/api/auth/session 全选复制",
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
          message: "该 Session 凭证已过期",
          recommendation: "请在 chatgpt.com 网页端刷新对话页（勿点退出登录），重新复制最新 Session",
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
          message: "账号处于欠费或应用商店宽限期",
          recommendation: "若此前通过 App Store / Google Play 订阅，到期后需等待约 72 小时释放账单",
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
          message: `当前账号套餐为 ${planType}，Pro 50x 仅支持无任何订阅的纯免费账号`,
          recommendation: "请更换一个无订阅的免费账号提交（前置拦截不会消耗卡密）",
        };
      }

      return {
        state: "ELIGIBLE",
        email,
        name,
        expiresAt: expiresFormatted,
        isExpired: false,
        planType: planType || "free",
        message: isPro10Or20
          ? "Session 格式有效，支持免费号新开或菲区(PHP)订阅无损直升"
          : "Session 凭据校验通过，可立即提交开通",
        recommendation: "开通完成前请保持浏览器中 chatgpt.com 的登录态不要退出",
      };
    } catch {
      return {
        state: "INVALID",
        email: null,
        name: null,
        expiresAt: null,
        isExpired: false,
        planType: null,
        message: "JSON 格式不完整，存在未闭合括号",
        recommendation: "请使用 Ctrl+A / Cmd+A 全选复制 chatgpt.com/api/auth/session 完整内容",
      };
    }
  }, [sessionInput, cardCode]);

  if (diagnostic.state === "EMPTY") return null;

  const isGood = diagnostic.state === "ELIGIBLE";
  const isWarn = diagnostic.state === "STORE_WAIT" || diagnostic.state === "PRO50_WARN";

  return (
    <div
      className={`ql-rise p-4 rounded-2xl border text-xs space-y-2.5 ${
        isGood
          ? "bg-emerald-500/10 border-emerald-500/30"
          : isWarn
          ? "bg-amber-500/10 border-amber-500/35"
          : "bg-rose-500/10 border-rose-500/35"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isGood
                ? "bg-emerald-500/15 text-emerald-500"
                : isWarn
                ? "bg-amber-500/15 text-amber-500"
                : "bg-rose-500/15 text-rose-400"
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
            <span className="text-[11px] text-[var(--ink-3)] block">识别目标账号</span>
            <span className="text-[var(--ink)] font-semibold break-all">
              {diagnostic.email || "已检测到有效 accessToken"}
            </span>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 self-start sm:self-auto ${
            isGood
              ? "bg-emerald-500/15 text-emerald-500"
              : isWarn
              ? "bg-amber-500/15 text-amber-500"
              : "bg-rose-500/15 text-rose-400"
          }`}
        >
          {isGood ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          <span>{isGood ? "凭证有效" : "需要注意"}</span>
        </span>
      </div>

      <div className="space-y-1 text-[11.5px] text-[var(--ink-2)] leading-relaxed pt-2 border-t border-[var(--rule)]">
        <p>{diagnostic.message}</p>
        {diagnostic.recommendation ? (
          <p className="text-[var(--ink-3)]">{diagnostic.recommendation}</p>
        ) : null}
        {diagnostic.expiresAt ? (
          <div className="flex items-center justify-between pt-1.5 text-[11px] text-[var(--ink-3)]">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>有效期至 {diagnostic.expiresAt}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <ShieldCheck className="w-3 h-3" />
              <span>零密码解析</span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
