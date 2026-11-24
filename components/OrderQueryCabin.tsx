"use client";

import React, { useState } from "react";
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Headphones,
  Copy,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { TicketModal } from "./TicketModal";
import { DeliveredItem, RetailOrderRecord, TaskRecord } from "@/lib/types";
import { soundFX } from "@/lib/tactile-feedback";

interface Props {
  onGoToRedeem?: (cdk: string) => void;
}

export const OrderQueryCabin: React.FC<Props> = ({ onGoToRedeem }) => {
  const [queryCode, setQueryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [traceData, setTraceData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);

  const handleCopy = (text: string, key: string) => {
    soundFX.play("tap");
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = queryCode.trim();
    if (!q) return;

    soundFX.play("tap");
    setLoading(true);
    setErrorMsg(null);
    setTraceData(null);

    try {
      const resp = await fetch(`/api/trace?q=${encodeURIComponent(q)}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setErrorMsg(data.detail || data.error || "未查询到匹配的订单、卡密或激活记录");
      } else {
        soundFX.play("switch");
        setTraceData(data);
      }
    } catch {
      setErrorMsg("网络查询异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const renderOrderCard = (order: RetailOrderRecord) => {
    const items: DeliveredItem[] = Array.isArray(order.delivered_items)
      ? order.delivered_items
      : [];
    const isDelivered = items.length > 0 && order.payment_status === "paid";

    return (
      <div
        key={order.order_id}
        className="ql-rise p-5 sm:p-6 rounded-2xl border border-[var(--rule-strong)] bg-[var(--bg-subtle)] space-y-4 text-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--rule)] pb-3">
          <div>
            <span className="text-[11px] text-[var(--ink-3)] block">订单编号</span>
            <span className="font-mono text-sm font-bold text-[var(--ink)]">{order.order_id}</span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border self-start sm:self-auto ${
              isDelivered
                ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-500"
                : "border-amber-500/35 bg-amber-500/12 text-amber-500"
            }`}
          >
            {isDelivered
              ? "● 已完成发卡"
              : order.payment_status === "awaiting_confirm"
              ? "● 待站长确认收款"
              : `● ${order.payment_status}`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)]">
            <span className="text-[var(--ink-3)] block text-[11px]">选购套餐</span>
            <span className="text-[var(--ink)] font-semibold mt-0.5 block">
              {order.product_name} {order.quantity > 1 ? `× ${order.quantity}` : ""}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)]">
            <span className="text-[var(--ink-3)] block text-[11px]">实付金额</span>
            <span className="text-[var(--clay)] font-bold tabular-nums mt-0.5 block">
              ¥{(order.retail_total_fen / 100).toFixed(2)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)]">
            <span className="text-[var(--ink-3)] block text-[11px]">创建时间</span>
            <span className="text-[var(--ink-2)] tabular-nums mt-0.5 block">
              {new Date(order.created_at).toLocaleString("zh-CN", { hour12: false })}
            </span>
          </div>
        </div>

        {isDelivered ? (
          <div className="space-y-3 pt-1">
            {items.map((it, idx) => {
              const val = it.copy_text || it.value;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[var(--bg-field)] border border-[var(--rule-strong)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--ink)]">
                      {it.title || "交付卡密 / 凭证"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(val, `${order.order_id}_${idx}`)}
                      className="px-3 py-1 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === `${order.order_id}_${idx}` ? "已复制" : "复制"}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-[var(--bg-subtle)] font-mono font-semibold text-[var(--ink)] whitespace-pre-wrap break-all">
                    {val}
                  </pre>
                </div>
              );
            })}

            {order.requires_activation && onGoToRedeem ? (
              <button
                type="button"
                onClick={() => onGoToRedeem(items[0]?.copy_text || items[0]?.value || "")}
                className="ql-shimmer-btn w-full h-11 rounded-2xl bg-[var(--clay)] text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>带入卡密 · 一键前往自助开通台</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const renderTaskSummary = (task: TaskRecord) => (
    <div className="ql-rise p-5 rounded-2xl border border-[var(--rule-strong)] bg-[var(--bg-subtle)] space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
        <div>
          <span className="text-[11px] text-[var(--ink-3)] block">任务编号</span>
          <span className="font-mono text-sm font-bold text-[var(--ink)]">{task.task_id}</span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
            task.success
              ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-500"
              : task.finished
              ? "border-rose-500/35 bg-rose-500/12 text-rose-400"
              : "border-[var(--rule-strong)] bg-[var(--bg-field)] text-[var(--ink)]"
          }`}
        >
          {task.success ? "● 已成功生效" : task.finished ? "● 未完成" : `● 进行中 (${task.progress}%)`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)]">
          <span className="text-[var(--ink-3)] block text-[11px]">产品通道</span>
          <span className="text-[var(--clay)] font-semibold mt-0.5 block">{task.product_name}</span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)]">
          <span className="text-[var(--ink-3)] block text-[11px]">绑定账号</span>
          <span className="text-[var(--ink)] break-all mt-0.5 block">{task.target_email || "—"}</span>
        </div>
      </div>

      {task.redirect_url ? (
        <a
          href={task.redirect_url}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold inline-flex items-center justify-center gap-1.5"
        >
          <span>打开 Google 官方学生优惠领取链接</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      ) : null}

      {task.disposal_hint ? (
        <div className="p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)] text-[var(--ink-2)]">
          建议：{task.disposal_hint}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <TicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        presetOrderId={queryCode}
      />

      <div className="ql-panel p-6 sm:p-9 space-y-6">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="text-sm font-medium text-[var(--ink)] block">
            输入订单号、预留微信号或卡密
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              placeholder="例如 QL-261124-XXXX / 微信号 / PLS-XXXX / GSTU-XXXX..."
              className="ql-input flex-1 h-12 px-4 font-mono text-sm"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="ql-shimmer-btn h-12 px-7 rounded-[14px] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>立即检索</span>
            </button>
          </div>
        </form>

        {errorMsg ? (
          <div className="ql-rise space-y-3">
            <div className="p-4 rounded-2xl border border-rose-500/35 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[var(--ink-2)]">付款待核销或需要人工协助对账？</span>
              <button
                type="button"
                onClick={() => setIsTicketOpen(true)}
                className="px-4 py-2 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>提交售后工单</span>
              </button>
            </div>
          </div>
        ) : null}

        {traceData?.kind === "retail_order" && traceData.order
          ? renderOrderCard(traceData.order)
          : null}

        {traceData?.kind === "retail_order_list" && Array.isArray(traceData.orders) ? (
          <div className="space-y-4">
            <div className="text-xs text-[var(--ink-2)]">
              为您检索到 {traceData.orders.length} 笔关联订单：
            </div>
            {traceData.orders.map((o: RetailOrderRecord) => renderOrderCard(o))}
          </div>
        ) : null}

        {traceData?.kind === "activation_task" && traceData.task
          ? renderTaskSummary(traceData.task)
          : null}

        {traceData?.kind === "card_trace" ? (
          <div className="ql-rise space-y-4 text-xs border-t border-[var(--rule)] pt-5">
            {traceData.upstream?.success ? (
              <div className="p-5 rounded-2xl border border-[var(--rule-strong)] bg-[var(--bg-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>上游实时核验结果 ({traceData.upstream.line?.toUpperCase()})</span>
                  </span>
                  <span className="font-mono text-[var(--ink-3)]">{traceData.card_code_masked}</span>
                </div>
                <p className="text-[var(--ink-2)] leading-relaxed">{traceData.upstream.message}</p>

                {traceData.upstream.bound_email ? (
                  <p className="text-[var(--clay)] font-medium">
                    绑定续升账号：{traceData.upstream.bound_email}
                  </p>
                ) : null}

                {traceData.upstream.redirect_url ? (
                  <a
                    href={traceData.upstream.redirect_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold"
                  >
                    <span>打开学生优惠领取链接</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null}

                {traceData.upstream.redeemable && onGoToRedeem ? (
                  <button
                    type="button"
                    onClick={() => onGoToRedeem(traceData.card_code_raw)}
                    className="px-5 py-2.5 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>该卡密可用 · 一键带入自助开通</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            ) : null}

            {traceData.latest_task ? renderTaskSummary(traceData.latest_task) : null}

            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-between">
              <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>有疑问可随时联系人工客服处理</span>
              </span>
              <button
                type="button"
                onClick={() => setIsTicketOpen(true)}
                className="px-3.5 py-1.5 rounded-full border border-[var(--rule-strong)] text-[var(--ink)] font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>提交工单</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
