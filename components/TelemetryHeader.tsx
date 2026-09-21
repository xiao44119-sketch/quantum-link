"use client";

import React from "react";
import { Terminal, Settings } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  mode?: string;
  activeTaskCount?: number;
}

export const TelemetryHeader: React.FC<HeaderProps> = () => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.06] bg-[#05080e]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* 左侧：精简高级的品牌 Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-cyan-900/10 to-transparent border border-cyan-400/30 flex items-center justify-center text-[var(--holo)] shadow-[0_0_12px_rgba(0,229,216,0.15)] group-hover:shadow-[0_0_18px_rgba(0,229,216,0.3)] transition-all">
            <Terminal className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[var(--holo)]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-sm sm:text-base text-white font-mono">
                骁清 FINN
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-[var(--warm)]/40 text-[var(--warm)] bg-amber-950/30 font-bold hidden sm:inline-block">
                VIBE CODER
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono tracking-normal leading-none hidden sm:block mt-0.5">
              QUANTUMLINK · 自动化订阅履约节点
            </div>
          </div>
        </Link>

        {/* 中间：桌面端呈现 Finn 标志性人文标语 */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/5 bg-white/[0.02] text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--warm)] animate-ping" />
          <span className="text-neutral-300 font-medium text-[11px]">“做点有意思的东西，为爱我的人祈福挡灾”</span>
        </div>

        {/* 右侧：极简高级的遥测状态与站长入口 */}
        <div className="flex items-center gap-2 sm:gap-3 font-mono">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.02] text-[11px] text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>TOKYO BGP</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-[11px] whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONLINE</span>
          </div>

          {/* 隐蔽的后台管理入口 */}
          <Link
            href="/admin"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            title="控制台"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};