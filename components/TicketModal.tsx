"use client";

import React, { useState } from "react";
import {
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  MessageSquare,
  Headphones,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  presetOrderId?: string;
  supportWechat?: string;
}

export const TicketModal: React.FC<Props> = ({
  isOpen,
  onClose,
  presetOrderId = "",
  supportWechat = "18300425760",
}) => {
  const [orderId, setOrderId] = useState(presetOrderId);
  const [category, setCategory] = useState<
    "409_conflict" | "card_invalid" | "subscription_dropped" | "general"
  >("409_conflict");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  React.useEffect(() => {
    if (presetOrderId) {
      setOrderId(presetOrderId);
    }
  }, [presetOrderId]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !contact.trim() || !description.trim()) {
      setErrorMsg("请完整填写订单号/卡密、您的联系方式以及问题描述");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const resp = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId.trim(),
          category,
          contact: contact.trim(),
          description: description.trim(),
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        setSubmittedTicket(data.ticket);
      } else {
        setErrorMsg(data.error || "工单提交失败，请重试");
      }
    } catch {
      setErrorMsg("网络异常，未能成功投递工单");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setDescription("");
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <div className="ql-pop relative w-full max-w-lg rounded-3xl border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-6 sm:p-7 text-[var(--ink)] shadow-2xl backdrop-blur-2xl text-xs">
        {/* 头部标题与关闭 */}
        <div className="flex items-center justify-between border-b border-[var(--rule)] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-center text-[var(--clay)]">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-editorial text-lg font-semibold text-[var(--ink)]">
                专属售后工单中心
              </h3>
              <span className="text-[11px] text-[var(--ink-3)] block">
                云端加密保险柜存档 · 站长直连优先排查
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 成功状态展示 */}
        {submittedTicket ? (
          <div className="text-center py-3 space-y-4">
            <div className="ql-pop w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif-editorial text-lg font-semibold text-[var(--ink)]">
                工单已成功归档入库
              </h4>
              <p className="text-[var(--ink-2)] text-xs">
                已同步至站长运维队列，我们将尽快为您核验处理。
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-3)]">工单编号</span>
                <span className="text-[var(--clay)] font-bold font-mono text-sm">
                  {submittedTicket.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-3)]">关联凭据</span>
                <span className="text-[var(--ink)] font-mono">{submittedTicket.order_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-3)]">问题类别</span>
                <span className="text-[var(--ink-2)] font-medium">
                  {submittedTicket.category_name}
                </span>
              </div>
            </div>

            {/* 优先催办与直通客服 */}
            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule-strong)] text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--ink)] font-semibold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--clay)]" />
                  <span>添加站长微信加速核验</span>
                </span>
                <span className="text-[11px] text-emerald-500 font-medium">直通保障</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)]">
                <span className="text-xs text-[var(--ink)] font-mono">
                  微信号：<strong className="text-[var(--clay)]">{supportWechat}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(supportWechat, "wechatTicket")}
                  className="px-3 py-1.5 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                >
                  {copiedKey === "wechatTicket" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === "wechatTicket" ? "已复制" : "复制微信号"}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold text-xs transition-opacity hover:opacity-95 cursor-pointer"
            >
              完成并返回
            </button>
          </div>
        ) : (
          /* 表单录入模式 */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[var(--ink-2)] text-xs font-medium mb-1.5">
                关联订单号或卡密 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="例如 QL-2026... 或卡密编码"
                className="ql-input w-full px-3.5 py-2.5 font-mono text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--ink-2)] text-xs font-medium mb-1.5">
                  问题类型 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="ql-input w-full px-3 py-2.5 text-xs"
                >
                  <option value="409_conflict">账号充值冲突 / 报错</option>
                  <option value="card_invalid">卡密无效 / 无法识别</option>
                  <option value="subscription_dropped">订阅异常 / 申请质保</option>
                  <option value="general">其他咨询与对账</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--ink-2)] text-xs font-medium mb-1.5">
                  您的联系微信 / 手机号 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="方便站长联系核对"
                  className="ql-input w-full px-3.5 py-2.5 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--ink-2)] text-xs font-medium mb-1.5">
                问题具体描述 <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请简述操作时遇到的提示信息（无需也请勿填写您的邮箱登录密码）..."
                className="ql-input w-full p-3.5 text-xs leading-relaxed resize-none"
                required
              />
            </div>

            {errorMsg ? (
              <div className="p-3 rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-[var(--rule-strong)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="ql-shimmer-btn px-5 py-2.5 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold transition-all inline-flex items-center gap-2 text-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{submitting ? "正在提交..." : "提交售后工单"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
