"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, History, ArrowRight } from "lucide-react";
import { DuplicateConfirmError } from "@/lib/types";

interface Props {
  isOpen: boolean;
  errorInfo: DuplicateConfirmError | null;
  onCancel: () => void;
  onConfirmOverride: () => void;
  isLoading?: boolean;
}

export const CollisionWarningModal: React.FC<Props> = ({
  isOpen,
  errorInfo,
  onCancel,
  onConfirmOverride,
  isLoading,
}) => {
  if (!isOpen || !errorInfo) return null;

  const isStrictlyBlocked = errorInfo.error === "duplicate_email_blocked";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg border border-amber-500/60 bg-[#0d0a06] p-6 text-white corner-bracket corner-bracket-warm shadow-[0_0_50px_rgba(255,179,127,0.15)]">
        {/* 头部告警 */}
        <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4 mb-4">
          <div className="w-10 h-10 rounded-none bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
            {isStrictlyBlocked ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-mono text-base font-bold tracking-wider text-amber-300">
              {isStrictlyBlocked
                ? "24H 周期防重保护熔断 (COLLISION BLOCKED)"
                : "历史订阅生效冲突确认 (SUBSCRIPTION OVERLAP)"}
            </h3>
            <span className="text-xs text-amber-200/60 font-mono">
              HTTP 409 · DUPLICATE REDEEM INTERCEPTOR
            </span>
          </div>
        </div>

        {/* 详情卡片 */}
        <div className="space-y-3 font-mono text-xs text-neutral-300 leading-relaxed">
          <div className="p-3 border border-amber-500/20 bg-black/50 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-white/5 pb-1">
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-amber-400" />
                上次成功充值记录
              </span>
              <span className="text-amber-400 font-bold">{errorInfo.hours_ago.toFixed(1)} 小时前</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-neutral-500 block">生效套餐:</span>
                <span className="text-white font-medium">{errorInfo.last_product || "ChatGPT Plus"}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">充值时间戳:</span>
                <span className="text-white">{errorInfo.last_at}</span>
              </div>
            </div>
          </div>

          <p className="text-amber-200/90 bg-amber-950/20 p-3 border-l-2 border-amber-500">
            {errorInfo.detail_zh || errorInfo.detail}
          </p>

          {!isStrictlyBlocked && (
            <p className="text-[11px] text-neutral-400">
              提示：重复充值同类套餐<strong>无法叠加时长</strong>，仅会覆盖当前有效期并消耗新卡密。确认继续将绕过保护强行提交激活。
            </p>
          )}
        </div>

        {/* 操作区 */}
        <div className="mt-6 flex justify-end gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
          >
            取消操作 (ABORT)
          </button>

          {!isStrictlyBlocked && (
            <button
              type="button"
              onClick={onConfirmOverride}
              disabled={isLoading}
              className="px-5 py-2 border border-amber-500 text-black font-bold bg-amber-400 hover:bg-amber-300 transition-colors inline-flex items-center gap-1.5"
            >
              {isLoading ? "调度中..." : "已知悉风险，强制覆盖 (CONFIRM)"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};