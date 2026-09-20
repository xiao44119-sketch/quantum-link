"use client";

import React from "react";
import { Terminal, Shield, Sparkles } from "lucide-react";
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
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.06] bg-[#06090e]/75 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo 区域 */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-400/30 flex items-center justify-center text-[var(--holo)] shadow-[0_0_15px_rgba(0,229,216,0.15)] group-hover:shadow-[0_0_20px_rgba(0,229,216,0.3)] transition-all">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-white font-mono bg-gradient-to-r from-white via-neutral-200 to-cyan-200 bg-clip-text text-transparent">
                QUANTUMLINK
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-400/30 text-cyan-300 bg-cyan-950/40">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-mono tracking-wider hidden sm:block">
              Autonomous AI Provisioning Node
            </p>
          </div>
        </Link>

        {/* 右侧微光指示状态 */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 signal-dot" />
            <span className="text-neutral-400 text-[11px]">节点:</span>
            <span className="text-neutral-200 text-[11px] font-medium">TOKYO-01</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
            <span className="text-neutral-400 text-[11px]">引擎:</span>
            <span className={mode === "SANDBOX_SIMULATION" ? "text-amber-300 text-[11px] font-medium" : "text-emerald-300 text-[11px]"}>
              {mode === "SANDBOX_SIMULATION" ? "SANDBOX" : "ONLINE"}
            </span>
          </div>

          {/* 站长后台入口 */}
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-full border border-white/10 hover:border-cyan-400/50 bg-white/[0.03] hover:bg-cyan-950/30 text-neutral-300 hover:text-cyan-200 text-[11px] inline-flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>管理后台</span>
          </Link>
        </div>
      </div>
    </header>
  );
};