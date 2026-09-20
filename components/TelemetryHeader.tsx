"use client";

import React from "react";
import { Terminal, Shield, Sparkles, Radio, Settings } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  mode?: string;
  activeTaskCount?: number;
}

export const TelemetryHeader: React.FC<HeaderProps> = ({
  mode = "SANDBOX_SIMULATION",
  activeTaskCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#06090e]/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* 左侧：Finn 专属双层品牌标识 */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 via-cyan-900/10 to-transparent border border-cyan-400/30 flex items-center justify-center text-[var(--holo)] shadow-[0_0_15px_rgba(0,229,216,0.15)] group-hover:shadow-[0_0_20px_rgba(0,229,216,0.3)] transition-all">
              <Terminal className="w-5 h-5 text-[var(--holo)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base text-white font-mono">
                  骁清 FINN
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded border border-[var(--warm)]/40 text-[var(--warm)] bg-amber-950/30 font-bold">
                  VIBE CODER
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-200/70 font-mono tracking-wide">
                <span>QUANTUMLINK · 神经订阅履约节点</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 中间：填补空白，呈现 Finn 标志性人文标语 */}
        <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--warm)] signal-dot" />
          <span className="text-neutral-300 font-medium">“做点有意思的东西，为爱我的人祈福挡灾”</span>
          <span className="text-neutral-600 text-[10px] ml-1">#KEEP REAL</span>
        </div>

        {/* 右侧：遥测指标与极低调的站长入口 */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 signal-dot" />
            <span className="text-neutral-400 text-[11px]">节点:</span>
            <span className="text-neutral-200 text-[11px] font-medium">TOKYO-01</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
            <span className="text-neutral-400 text-[11px]">状态:</span>
            <span className="text-emerald-300 text-[11px] font-medium">ONLINE</span>
          </div>

          {/* 低调隐蔽的齿轮按钮，不写“管理后台”4个字，防止客户疑虑 */}
          <Link
            href="/admin"
            className="w-8 h-8 rounded-full border border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/5 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors"
            title="站长中枢"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};