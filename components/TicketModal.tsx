"use client";

import React, { useState } from "react";
import { 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  MessageSquare,
  ShieldCheck,
  Headphones
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
  const [category, setCategory] = useState<"409_conflict" | "card_invalid" | "subscription_dropped" | "general">("409_conflict");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg border border-purple-500/40 bg-[#090d16] p-6 sm:p-7 text-white corner-bracket shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-xl font-mono text-xs">
        
        {/* 头部标题与关闭 */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                极速售后工单中心 (SUPPORT TICKET)
              </h3>
              <span className="text-[10px] text-neutral-400 block font-mono">
                由 GPTibo 工业级工单状态机启发 · 15分钟专属排队通道
              </span>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 成功状态展示 */}
        {submittedTicket ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-base font-bold text-emerald-300">工单已成功立项归档</h4>
              <p className="text-neutral-400 text-xs">
                系统已将该工单推入站长运维专线队列，我们将优先为您排查！
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px]">TICKET ID:</span>
                <span className="text-cyan-300 font-bold font-mono text-sm">{submittedTicket.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px]">关联凭据:</span>
                <span className="text-neutral-200 font-mono">{submittedTicket.order_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px]">问题类别:</span>
                <span className="text-purple-300 font-mono">{submittedTicket.category_name}</span>
              </div>
            </div>

            {/* 优先催办与直通客服 */}
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-purple-200 font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span>添加站长微信快速核验 (优先催办)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">加急保障</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/50 border border-white/10">
                <span className="text-xs text-white font-mono">微信号: <strong className="text-cyan-300">{supportWechat}</strong></span>
                <button
                  type="button"
                  onClick={() => handleCopy(supportWechat, "wechatTicket")}
                  className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 inline-flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === "wechatTicket" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === "wechatTicket" ? "已复制" : "复制微信号"}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-xs transition-all"
            >
              完成并返回
            </button>
          </div>
        ) : (
          /* 表单录入模式 */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-neutral-300 text-[11px] mb-1.5 font-mono">
                关联订单号 / 卡密流水 (ORDER ID / CDK) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="例如: QL-20261014-XXXX 或 PH-XXXX-XXXX"
                className="w-full bg-black/50 border border-white/10 hover:border-white/20 focus:border-purple-400 rounded-md px-3.5 py-2.5 text-white placeholder-neutral-600 focus:outline-none transition-all font-mono text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 text-[11px] mb-1.5 font-mono">
                  问题类型 (CATEGORY) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 focus:border-purple-400 rounded-md px-3 py-2.5 text-white focus:outline-none text-xs"
                >
                  <option value="409_conflict">409 冲突 / 账号充值报错</option>
                  <option value="card_invalid">卡密无效 / 提示未找到</option>
                  <option value="subscription_dropped">掉订阅 / 申请质保补发</option>
                  <option value="general">其他咨询与对账</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 text-[11px] mb-1.5 font-mono">
                  您的联系微信 / 手机号 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="微信 / 手机号以便核对"
                  className="w-full bg-black/50 border border-white/10 focus:border-purple-400 rounded-md px-3.5 py-2.5 text-white placeholder-neutral-600 focus:outline-none text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 text-[11px] mb-1.5 font-mono">
                问题具体描述 (DESCRIPTION) <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请详细描述操作时遇到的报错提示或诉求（注：请勿提供您的个人邮箱密码）..."
                className="w-full bg-black/50 border border-white/10 focus:border-purple-400 rounded-md p-3 text-white placeholder-neutral-600 focus:outline-none text-xs leading-relaxed resize-none"
                required
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-lg border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white transition-all text-xs"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg border border-purple-500/80 bg-purple-950/80 hover:bg-purple-900 text-white font-bold transition-all inline-flex items-center gap-2 shadow-[0_0_15px_rgba(192,132,252,0.25)] text-xs disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" /> : <Send className="w-3.5 h-3.5 text-purple-300" />}
                <span>{submitting ? "正在提交工单..." : "立即提交售后工单"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
