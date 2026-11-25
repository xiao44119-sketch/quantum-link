"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Send,
  Copy,
  Check,
  XCircle,
} from "lucide-react";

function MobileQuickApproveInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const orderId = decodeURIComponent(params?.id || "");
  const sig = searchParams.get("sig") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const loadOrder = async () => {
    if (!orderId || !sig) {
      setError("核销链接缺少安全签名参数");
      setLoading(false);
      return;
    }
    try {
      const resp = await fetch(
        `/api/approve/${encodeURIComponent(orderId)}?sig=${encodeURIComponent(sig)}`
      );
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || "无法加载订单信息");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("网络请求异常，请刷新重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId, sig]);

  const handleAction = async (action: "approve" | "close") => {
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch(`/api/approve/${encodeURIComponent(orderId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sig, action }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error || "操作未成功");
      } else {
        setSuccessMsg(data.message);
        await loadOrder();
      }
    } catch {
      setError("网络异常，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const isDelivered =
    order &&
    (order.fulfillment_status === "delivered" ||
      order.fulfillment_status === "manual_delivered") &&
    Array.isArray(order.delivered_items) &&
    order.delivered_items.length > 0;

  return (
    <div className="min-h-screen bg-[#05060b] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0c101c] p-6 shadow-2xl space-y-5">
        {/* 顶部标识 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-300 font-bold">
              F
            </div>
            <div>
              <h1 className="text-base font-bold text-white">站长手机极速发卡台</h1>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                HMAC 加密免登专线
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{orderId}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-sky-400 mx-auto" />
            <p className="text-xs text-slate-400">正在安全校验订单签名...</p>
          </div>
        ) : error && !order ? (
          <div className="py-8 text-center space-y-3">
            <AlertTriangle className="w-9 h-9 text-rose-400 mx-auto" />
            <p className="text-sm text-rose-300 font-medium">{error}</p>
          </div>
        ) : order ? (
          <>
            {/* 核心金额核对卡片 */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1.5">
              <span className="text-xs text-slate-400 block">
                请核对微信 / 支付宝是否收到此金额
              </span>
              <div className="text-4xl font-extrabold tracking-tight text-emerald-400 tabular-nums">
                ¥{order.amount_yuan}
              </div>
              <div className="text-xs text-slate-400 pt-1">
                上游成本 ¥{order.cost_yuan} · 本单净赚{" "}
                <strong className="text-sky-300">+¥{order.profit_yuan}</strong>
              </div>
            </div>

            {/* 订单明细 */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">选购商品</span>
                <span className="text-white font-semibold text-right">
                  {order.product_name} {order.variant ? `[${order.variant}]` : ""} ×{" "}
                  {order.quantity}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">买家预留联系</span>
                <span className="text-sky-300 font-mono">
                  {order.buyer_contact || "未填写"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">付款备注</span>
                <span className="text-amber-300 font-medium">
                  {order.payer_note || "无备注"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">当前状态</span>
                <span
                  className={`font-semibold ${
                    isDelivered
                      ? "text-emerald-400"
                      : order.payment_status === "expired"
                        ? "text-rose-400"
                        : "text-amber-300"
                  }`}
                >
                  {isDelivered
                    ? "✅ 已成功自动发卡"
                    : order.payment_status === "expired"
                      ? "已关闭"
                      : "⏳ 等待站长点击确认"}
                </span>
              </div>
            </div>

            {error ? (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs">
                {error}
              </div>
            ) : null}

            {successMsg ? (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-medium">
                {successMsg}
              </div>
            ) : null}

            {/* 已发货：直接显示发放给买家的卡密，方便站长留档或微信转发 */}
            {isDelivered ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>顾客网页已实时弹出以下卡密</span>
                </div>
                {order.delivered_items.map((item: any, idx: number) => {
                  const val = item.copy_text || item.value;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-200 font-medium">
                          {item.title || `卡密 #${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(val);
                            setCopiedIdx(idx);
                            setTimeout(() => setCopiedIdx(null), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          {copiedIdx === idx ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedIdx === idx ? "已复制" : "复制卡密"}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 rounded-xl bg-black/50 text-xs font-mono text-white whitespace-pre-wrap break-all">
                        {val}
                      </pre>
                    </div>
                  );
                })}
              </div>
            ) : order.payment_status === "expired" ? (
              <div className="text-center py-2 text-xs text-slate-400">
                该订单已标记关闭；若买家刚刚补付了款项，仍可点击下方重新提卡发货：
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction("approve")}
                  className="mt-3 w-full py-3 rounded-2xl border border-emerald-400/40 text-emerald-300 font-semibold text-xs"
                >
                  补发：确认已收款并调苏哲发卡
                </button>
              </div>
            ) : (
              /* 待核销：大拇指一键秒发按钮 */
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction("approve")}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold text-sm shadow-[0_12px_32px_-8px_rgba(16,185,129,0.55)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {submitting
                      ? "正在从苏哲自动提卡发货..."
                      : `确认已收 ¥${order.amount_yuan} · 立即自动发卡`}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction("close")}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-rose-300 text-xs flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>没收到钱 · 关闭此订单</span>
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function MobileQuickApprovePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05060b] text-slate-400 flex items-center justify-center text-xs">
          正在加载核销专线...
        </div>
      }
    >
      <MobileQuickApproveInner />
    </Suspense>
  );
}
