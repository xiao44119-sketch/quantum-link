"use client";

import React from "react";
import { ShieldCheck, Cpu, Terminal, Radio } from "lucide-react";

interface HeaderProps {
  mode?: string;
  activeTaskCount?: number;
}

export const TelemetryHeader: React.FC<HeaderProps> = ({
  mode = "SANDBOX_SIMULATION",
  activeTaskCount = 0,
}) => {
  return (
    <header className="relative z-20 border-b border-[var(--line)] bg-[var(--ink)]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo 与系统标识 */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 corner-bracket bg-cyan-950/40 border border-[var(--line-strong)] flex items-center justify-center text-[var(--holo)]">
            <Terminal className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-base sm:text-lg text-white font-mono">
                QUANTUMLINK
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 border border-[var(--holo)]/40 text-[var(--holo)] bg-cyan-950/30">
                v2.4-PRO
              </span>
            </div>
            <p className="text-[11px] text-[var(--fg-muted)] tracking-widest uppercase font-mono">
              AI Subscription Autonomous Dispatcher
            </p>
          </div>
        </div>

        {/* 右侧遥测监控指标 */}
        <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-[var(--line)] bg-cyan-950/20 text-[var(--fg-muted)]">
            <Radio className="w-3.5 h-3.5 text-[var(--holo)]" />
            <span>NODE:</span>
            <span className="text-white">TOKYO-BGP-01</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-[var(--line)] bg-cyan-950/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 signal-dot" />
            <span className="text-[var(--fg-muted)]">ENGINE:</span>
            <span className={mode === "SANDBOX_SIMULATION" ? "text-amber-300 font-medium" : "text-emerald-300"}>
              {mode === "SANDBOX_SIMULATION" ? "SANDBOX SIMULATOR" : "LIVE FULFILLMENT"}
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 border border-[var(--line)] bg-black/40">
            <Cpu className="w-3.5 h-3.5 text-[var(--warm)]" />
            <span className="text-[var(--fg-muted)]">TASKS:</span>
            <span className="text-[var(--warm)] font-bold">{activeTaskCount}</span>
          </div>
        </div>
      </div>
    </header>
  );
};