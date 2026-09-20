"use client";

import React, { useState } from "react";
import { Search, Loader2, CheckCircle2, AlertCircle, Clock, ShieldCheck, FileText, Check } from "lucide-react";

export const OrderQueryCabin: React.FC = () => {
  const [queryCode, setQueryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryCode.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    setTimeout(() => {
      setLoading(false);
      const codeUpper = queryCode.trim().toUpperCase();

      if (codeUpper.includes("TEST") || codeUpper.startsWith("PH-") || codeUpper.startsWith("PRO") || codeUpper.startsWith("CLAUDE")) {
        setResult({
          card_code_masked: codeUpper.slice(0, 4) + "••••-••••-" + (codeUpper.slice(-4) || "8888"),
          product_name: codeUpper.startsWith("PRO20") ? "ChatGPT Pro 20x" : codeUpper.startsWith("PRO5") ? "ChatGPT Pro 5x" : codeUpper.startsWith("CLAUDE") ? "Claude Pro 尊享月卡" : "ChatGPT Plus (标准版)",
          status: "SUCCESS",
          status_zh: "已成功激活并下发",
          account_email: "developer@openai-pro.io",
          activated_at: "2026-09-18 21:30:14",
          expire_at: "2026-10-18 21:30:14",
          node: "TOKYO-BGP-01",
          cache_hit: "95.8%",
        });
      } else {
        setErrorMsg("未检索到该卡密或任务记录，请确认卡密格式是否正确或已实际提交过激活。");
      }
    }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-300">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 border border-purple-500/30 bg-purple-950/20 text-purple-300 font-mono text-[11px] rounded-full">
          <Search className="w-3.5 h-3.5 text-purple-400" />
          <span>QUERY TELEMETRY · 凭据与进度全网追溯</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
          卡密使用情况与激活凭证查询
        </h2>
        <p className="text-xs sm:text-sm font-mono text-[var(--fg-muted)]">
          输入购买收到的卡密（如 PH-XXXX-XXXX）或 任务 ID，实时检索履约与生效状态。
        </p>
      </div>

      <div className="glass-card corner-bracket p-6 sm:p-8 rounded-lg shadow-xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="font-mono text-xs text-neutral-300 tracking-wide block mb-2">
              卡密兑换码 / 任务流水号 (CARD CODE / TASK ID)
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={queryCode}
                onChange={(e) => setQueryCode(e.target.value)}
                placeholder="例如: PH-XXXX-XXXX-XXXX 或 task_xxxxxx"
                className="flex-1 bg-black/50 border border-white/10 hover:border-white/20 focus:border-purple-400 rounded-md px-4 py-3 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 border border-purple-500/80 bg-purple-950/60 hover:bg-purple-900 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 rounded-md shadow-[0_0_15px_rgba(192,132,252,0.2)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-purple-300" /> : <Search className="w-4 h-4 text-purple-300" />}
                <span>检索凭证 (TRACE)</span>
              </button>
            </div>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-5 p-3.5 rounded-md border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {result && (
          <div className="mt-7 border-t border-white/[0.08] pt-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">检索结果:</span>
              <span className="px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {result.status_zh}
              </span>
            </div>

            <div className="p-5 rounded-md border border-white/[0.08] bg-black/40 grid grid-cols-1 sm:grid-cols-2 gap-4 leading-relaxed">
              <div className="p-2.5 rounded bg-white/[0.02]">
                <span className="text-neutral-500 block text-[10px] mb-0.5">兑换卡密</span>
                <span className="text-white font-bold tracking-wider">{result.card_code_masked}</span>
              </div>
              <div className="p-2.5 rounded bg-white/[0.02]">
                <span className="text-neutral-500 block text-[10px] mb-0.5">绑定账号</span>
                <span className="text-gray-200">{result.account_email}</span>
              </div>
              <div className="p-2.5 rounded bg-white/[0.02]">
                <span className="text-neutral-500 block text-[10px] mb-0.5">生效套餐</span>
                <span className="text-[var(--warm)] font-bold">{result.product_name}</span>
              </div>
              <div className="p-2.5 rounded bg-white/[0.02]">
                <span className="text-neutral-500 block text-[10px] mb-0.5">专线节点</span>
                <span className="text-[var(--holo)] font-medium">{result.node}</span>
              </div>
              <div className="p-2.5 rounded bg-white/[0.02]">
                <span className="text-neutral-500 block text-[10px] mb-0.5">激活时间戳</span>
                <span className="text-neutral-300">{result.activated_at}</span>
              </div>
              <div className="p-2.5 rounded bg-white/[0.02]">
                <span className="text-neutral-500 block text-[10px] mb-0.5">质保有效期至</span>
                <span className="text-neutral-300">{result.expire_at}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};