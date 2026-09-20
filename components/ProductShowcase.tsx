"use client";

import React from "react";
import { PRODUCTS_CATALOG } from "@/lib/products-config";
import { ProductInfo } from "@/lib/types";
import { Zap, Sparkles, Server, CheckCircle2 } from "lucide-react";

interface Props {
  onSelectSampleCode: (prefix: string) => void;
  activePrefix?: string;
}

export const ProductShowcase: React.FC<Props> = ({
  onSelectSampleCode,
  activePrefix,
}) => {
  return (
    <section className="relative z-10 my-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--fg-muted)]">
          <span className="w-1.5 h-1.5 bg-[var(--holo)]" />
          <span className="uppercase tracking-widest text-white font-bold">
            SUPPORTED TIER MATRICES (套餐支持矩阵)
          </span>
        </div>
        <span className="text-[11px] font-mono text-[var(--holo)]">
          前缀自动判定协议 · 免选档位
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {PRODUCTS_CATALOG.map((p) => {
          const isSelected = activePrefix && activePrefix.toUpperCase().startsWith(p.codePrefix.toUpperCase());
          return (
            <div
              key={p.id}
              onClick={() => onSelectSampleCode(p.codePrefix)}
              className={`corner-bracket cursor-pointer border p-4 transition-all duration-300 relative group flex flex-col justify-between ${
                isSelected
                  ? "border-[var(--holo)] bg-cyan-950/30 shadow-[0_0_20px_rgba(0,212,200,0.2)]"
                  : "border-[var(--line)] bg-[#080d14]/70 hover:border-[var(--line-strong)] hover:bg-[#0a121d]"
              }`}
            >
              <div>
                {/* 顶栏徽章 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[var(--warm)] border border-[var(--warm)]/40 px-1.5 py-0.5 bg-amber-950/20">
                    {p.badge}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                    LV.{p.tierLevel}
                  </span>
                </div>

                {/* 标题 */}
                <h4 className="font-bold text-sm text-white group-hover:text-[var(--holo)] transition-colors line-clamp-1">
                  {p.name}
                </h4>

                <p className="text-[11px] text-[var(--fg-muted)] mt-2 leading-relaxed line-clamp-3">
                  {p.description}
                </p>
              </div>

              {/* 底部卡密前缀 */}
              <div className="mt-4 pt-3 border-t border-[var(--line)]/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-gray-400">前缀:</span>
                <span className="text-[var(--holo)] font-bold bg-cyan-950/50 px-1.5 py-0.5 border border-[var(--holo)]/30">
                  {p.codePrefix}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};