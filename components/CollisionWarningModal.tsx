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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <div className="ql-pop relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-[var(--bg-elevated)] p-6 sm:p-7 text-[var(--ink)] shadow-2xl backdrop-blur-2xl">
        {/* 头部告警 */}
        <div className="flex items-start gap-3.5 border-b border-[var(--rule)] pb-4 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 flex-shrink-0">
            {isStrictlyBlocked ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-serif-editorial text-lg font-semibold text-[var(--ink)]">
              {isStrictlyBlocked ? "24 小时防重保护已拦截" : "检测到历史订阅生效冲突"}
            </h3>
            <span className="text-xs text-[var(--ink-3)] block mt-0.5">
              防误充保护机制 · 避免重复消耗卡密
            </span>
          </div>
        </div>

        {/* 详情卡片 */}
        <div className="space-y-3.5 text-xs text-[var(--ink-2)] leading-relaxed">
          <div className="p-4 rounded-2xl border border-[var(--rule)] bg-[var(--bg-subtle)] space-y-2.5">
            <div className="flex items-center justify-between text-[11.5px] border-b border-[var(--rule)] pb-2">
              <span className="flex items-center gap-1.5 text-[var(--ink-2)] font-medium">
                <History className="w-3.5 h-3.5 text-amber-500" />
                上次成功开通记录
              </span>
              <span className="text-amber-500 font-semibold tabular-nums">
                {errorInfo.hours_ago.toFixed(1)} 小时前
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11.5px]">
              <div>
                <span className="text-[var(--ink-3)] block mb-0.5">生效套餐</span>
                <span className="text-[var(--ink)] font-semibold">
                  {errorInfo.last_product || "ChatGPT 官方订阅"}
                </span>
              </div>
              <div>
                <span className="text-[var(--ink-3)] block mb-0.5">上次开通时间</span>
                <span className="text-[var(--ink)] font-mono text-[11px]">
                  {errorInfo.last_at}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[var(--ink)]">
            {errorInfo.detail_zh || errorInfo.detail}
          </div>

          {!isStrictlyBlocked ? (
            <p className="text-[11.5px] text-[var(--ink-3)]">
              温馨提示：重复充值同类套餐<strong>无法叠加时长</strong>，仅会覆盖当前有效期并消耗新卡密。如确需更换或重开，可点击下方确认继续。
            </p>
          ) : null}
        </div>

        {/* 操作区 */}
        <div className="mt-6 flex items-center justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-[var(--rule-strong)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            先不操作
          </button>

          {!isStrictlyBlocked ? (
            <button
              type="button"
              onClick={onConfirmOverride}
              disabled={isLoading}
              className="ql-shimmer-btn px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isLoading ? "正在提交..." : "已知悉风险，继续开通"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
