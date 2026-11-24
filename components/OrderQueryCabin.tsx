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
  Clock,
} from "lucide-react";
import { TicketModal } from "./TicketModal";
import { DeliveredItem, RetailOrderRecord, TaskRecord } from "@/lib/types";

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
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = queryCode.trim();
    if (!q) return;

    setLoading(true);
    setErrorMsg(null);
    setTraceData(null);

    try {
      const resp = await fetch(`/api/trace?q=${encodeURIComponent(q)}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setErrorMsg(data.detail || data.error || "未查询到匹配的订单、卡密或激活记录");
      } else {
        setTraceData(data);
      }
    } catch {
      setErrorMsg("网络查询异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const renderOrderCard = (order: RetailOrderRecord) => {
    const items: DeliveredItem[] = Array.isArray(order.delivered_items) ? order.delivered_items : [];
    const isDelivered = items.length > 0 && order.payment_status === "paid";

    return (
      <div
        key={order.order_id}
        className="p-5 rounded-xl border border-white/[0.08] bg-black/50 space-y-4 font-mono text-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div>
            <span className="text-[10px] text-neutral-400 block">本站订单号:</span>
            <span className="text-sm font-bold text-[var(--holo)]">{order.order_id}</span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold border self-start sm:self-auto ${
              isDelivered
                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                : order.payment_status === "awaiting_confirm"
                ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                : "border-amber-500/40 bg-amber-950/40 text-amber-300"
            }`}
          >
            {isDelivered
              ? "● 已完成发卡"
              : order.payment_status === "awaiting_confirm"
              ? "● 待站长确认收款发卡"
              : `● 状态: ${order.payment_status}`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
          <div className="p-2.5 rounded bg-white/[0.02]">
            <span className="text-neutral-500 block">选购套餐</span>
            <span className="text-white font-bold">
              {order.product_name} {order.quantity > 1 ? `× ${order.quantity}` : ""}
            </span>
          </div>
          <div className="p-2.5 rounded bg-white/[0.02]">
            <span className="text-neutral-500 block">订单金额</span>
            <span className="text-[var(--warm)] font-bold">
              ¥{(order.retail_total_fen / 100).toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded bg-white/[0.02]">
            <span className="text-neutral-500 block">下单时间</span>
            <span className="text-neutral-300">
              {new Date(order.created_at).toLocaleString("zh-CN", { hour12: false })}
            </span>
          </div>
        </div>

        {isDelivered ? (
          <div className="space-y-2.5 pt-2">
            {items.map((it, idx) => {
              const val = it.copy_text || it.value;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300 font-bold">{it.title || "交付卡密 / 凭证"}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(val, `${order.order_id}_${idx}`)}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === `${order.order_id}_${idx}` ? "已复制" : "复制"}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded bg-black/70 text-[var(--holo)] font-bold whitespace-pre-wrap break-all">
                    {val}
                  </pre>
                </div>
              );
            })}

            {order.requires_activation && onGoToRedeem ? (
              <button
                type="button"
                onClick={() => onGoToRedeem(items[0]?.copy_text || items[0]?.value || "")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>带入卡密 · 前往 7 合 1 全能激活台</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const renderTaskSummary = (task: TaskRecord) => (
    <div className="p-5 rounded-xl border border-white/[0.08] bg-black/50 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div>
          <span className="text-[10px] text-neutral-400 block">激活任务号 (TASK ID):</span>
          <span className="text-sm font-bold text-cyan-300">{task.task_id}</span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
            task.success
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
              : task.finished
              ? "border-rose-500/40 bg-rose-950/40 text-rose-300"
              : "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
          }`}
        >
          {task.success ? "● 激活已生效" : task.finished ? "● 未完成/已终止" : `● 进行中 (${task.progress}%)`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
        <div className="p-2.5 rounded bg-white/[0.02]">
          <span className="text-neutral-500 block">产品通道</span>
          <span className="text-[var(--warm)] font-bold">{task.product_name}</span>
        </div>
        <div className="p-2.5 rounded bg-white/[0.02]">
          <span className="text-neutral-500 block">绑定目标</span>
          <span className="text-white break-all">{task.target_email || "—"}</span>
        </div>
      </div>

      {task.redirect_url ? (
        <a
          href={task.redirect_url}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 rounded-xl bg-emerald-500 text-black font-extrabold text-xs inline-flex items-center justify-center gap-1.5"
        >
          <span>🎉 打开 Google 官方学生优惠领取链接</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      ) : null}

      {task.disposal_hint ? (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px]">
          处置建议：{task.disposal_hint}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-300">
      <TicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        presetOrderId={queryCode}
      />

      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 border border-purple-500/30 bg-purple-950/20 text-purple-300 font-mono text-[11px] rounded-full">
          <Search className="w-3.5 h-3.5 text-purple-400" />
          <span>REAL-TIME CLOUD TRACE · 订单取卡与全品类卡密体检</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
          订单取卡与苏哲卡密实时体检中心
        </h2>
        <p className="text-xs sm:text-sm font-mono text-[var(--fg-muted)]">
          支持输入本站单号 (<code className="text-cyan-300">QL-...</code>)、下单预留微信号/邮箱、任意苏哲卡密（<code className="text-amber-300">PLS- / P10X- / GSTU- / SMS- / GROK- / TGPREM- / MB-</code>）或激活任务号。
        </p>
      </div>

      <div className="glass-card corner-bracket p-6 sm:p-8 rounded-lg shadow-xl space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              placeholder="输入 QL-订单号 / 预留微信邮箱 / 任意苏哲卡密 / 任务ID..."
              className="flex-1 bg-black/50 border border-white/10 hover:border-white/20 focus:border-purple-400 rounded-md px-4 py-3 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 border border-purple-500/80 bg-purple-950/60 hover:bg-purple-900 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 rounded-md shadow-[0_0_15px_rgba(192,132,252,0.2)] cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
              ) : (
                <Search className="w-4 h-4 text-purple-300" />
              )}
              <span>实时检索 (TRACE)</span>
            </button>
          </div>
        </form>

        {errorMsg ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-md border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>

            <div className="p-3.5 rounded-md bg-purple-950/20 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <span className="text-purple-300">付款待对账、报错申诉或需要人工核实？</span>
              <button
                type="button"
                onClick={() => setIsTicketOpen(true)}
                className="px-3.5 py-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 font-bold inline-flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>一键提交售后工单</span>
              </button>
            </div>
          </div>
        ) : null}

        {traceData?.kind === "retail_order" && traceData.order ? renderOrderCard(traceData.order) : null}

        {traceData?.kind === "retail_order_list" && Array.isArray(traceData.orders) ? (
          <div className="space-y-4">
            <div className="text-xs font-mono text-neutral-400">
              为您检索到 {traceData.orders.length} 笔关联订单：
            </div>
            {traceData.orders.map((o: RetailOrderRecord) => renderOrderCard(o))}
          </div>
        ) : null}

        {traceData?.kind === "activation_task" && traceData.task ? renderTaskSummary(traceData.task) : null}

        {traceData?.kind === "card_trace" ? (
          <div className="space-y-4 font-mono text-xs border-t border-white/[0.08] pt-5">
            {traceData.upstream?.success ? (
              <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-950/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>上游实时核验结果 ({traceData.upstream.line?.toUpperCase()})</span>
                  </span>
                  <span className="text-neutral-400">{traceData.card_code_masked}</span>
                </div>
                <p className="text-white leading-relaxed">{traceData.upstream.message}</p>

                {traceData.upstream.bound_email ? (
                  <p className="text-amber-300 text-[11px]">
                    绑定续升账号：{traceData.upstream.bound_email}（请使用该账号继续提交升级）
                  </p>
                ) : null}

                {traceData.upstream.redirect_url ? (
                  <a
                    href={traceData.upstream.redirect_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-black font-bold"
                  >
                    <span>打开学生优惠领取链接</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null}

                {traceData.upstream.redeemable && onGoToRedeem ? (
                  <button
                    type="button"
                    onClick={() => onGoToRedeem(traceData.card_code_raw)}
                    className="px-4 py-2 rounded-lg bg-amber-400 text-black font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>该卡密可用 · 带入激活台立即开通</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            ) : null}

            {traceData.latest_task ? renderTaskSummary(traceData.latest_task) : null}

            <div className="p-3 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <span className="text-neutral-400 text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>需要站长人工协助核查流水？</span>
              </span>
              <button
                type="button"
                onClick={() => setIsTicketOpen(true)}
                className="px-3 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 font-bold inline-flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Headphones className="w-3 h-3" />
                <span>提交售后工单</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
