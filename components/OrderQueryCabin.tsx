"use client";

import React, { useState } from "react";
import { Search, Loader2, CheckCircle2, AlertCircle, Clock, ShieldCheck, FileText } from "lucide-react";

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

    // 模拟或查询卡密状态
    setTimeout(() => {
      setLoading(false);
      const codeUpper = queryCode.trim().toUpperCase();

      if (codeUpper.includes("TEST") || codeUpper.startsWith("PH-") || codeUpper.startsWith("PRO")) {
        setResult({
          card_code_masked: codeUpper.slice(0, 4) + "••••-••••-" + (codeUpper.slice(-4) || "8888"),
          product_name: codeUpper.startsWith("PRO20") ? "ChatGPT Pro 20x" : codeUpper.startsWith("PRO5") ? "ChatGPT Pro 5x" : "ChatGPT Plus (标准版)",
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
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[var(--holo)]/40 bg-cyan-950/20 text-[var(--holo)] font-mono text-xs">
          <Search className="w-3.5 h-3.5" />
          <span>QUERY TELEMETRY · 凭据与进度全网追溯</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-mono text-white">
          查询您的卡密使用情况与激活凭证
        </h2>
        <p className="text-xs font-mono text-[var(--fg-muted)]">
          输入您购买收到的卡密（如 PH-XXXX-XXXX-XXXX）或 任务 ID，即可实时检索履约状态。
        </p>
      </div>

      <div className="corner-bracket border border-[var(--line)] bg-[#070b12]/90 p-6 sm:p-8 backdrop-blur-md">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="font-mono text-xs text-gray-300 tracking-wider block mb-2">
              卡密兑换码 / 任务流水号 (CARD CODE / TASK ID)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={queryCode}
                onChange={(e) => setQueryCode(e.target.value)}
                placeholder="例如: PH-XXXX-XXXX-XXXX 或 task_xxxxxx"
                className="flex-1 bg-black/60 border border-[var(--line)] px-4 py-3 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-[var(--holo)] transition-colors"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 border border-[var(--holo)] bg-cyan-950/50 hover:bg-cyan-900 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-[var(--holo)]" /> : <Search className="w-4 h-4 text-[var(--holo)]" />}
                <span>检索凭证 (TRACE)</span>
              </button>
            </div>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 border border-rose-500/50 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {result && (
          <div className="mt-6 border-t border-[var(--line)] pt-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">检索结果:</span>
              <span className="px-2 py-0.5 border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {result.status_zh}
              </span>
            </div>

            <div className="p-4 border border-[var(--line)] bg-black/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-neutral-500 block text-[10px]">兑换卡密</span>
                <span className="text-white font-bold">{result.card_code_masked}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">绑定账号</span>
                <span className="text-gray-200">{result.account_email}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">生效套餐</span>
                <span className="text-[var(--warm)] font-medium">{result.product_name}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">调度节点</span>
                <span className="text-[var(--holo)]">{result.node}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">激活时间戳</span>
                <span className="text-neutral-300">{result.activated_at}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">质保有效期至</span>
                <span className="text-neutral-300">{result.expire_at}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};