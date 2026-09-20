"use client";

import React, { useState, useEffect } from "react";
import { TelemetryHeader } from "@/components/TelemetryHeader";
import { StorePricingCabin } from "@/components/StorePricingCabin";
import { FulfillmentConsole } from "@/components/FulfillmentConsole";
import { OrderQueryCabin } from "@/components/OrderQueryCabin";
import { 
  ShoppingCart, 
  Terminal, 
  Search, 
  ShieldCheck, 
  Radio, 
  Cpu, 
  Zap, 
  Layers
} from "lucide-react";

type ActiveTab = "store" | "redeem" | "query";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<ActiveTab>("store");
  const [presetPrefix, setPresetPrefix] = useState<string>("");
  const [activeTaskCount, setActiveTaskCount] = useState<number>(0);
  const [engineMode, setEngineMode] = useState<string>("SANDBOX_SIMULATION");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.mode) setEngineMode(data.mode);
      })
      .catch(() => {});
  }, []);

  const handleGoToRedeem = (prefix?: string) => {
    if (prefix) setPresetPrefix(prefix);
    setCurrentTab("redeem");
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-[#f0f7f7] relative selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* 顶部柔和环境弥散光晕 */}
      <div className="ambient-glow" />
      <div className="screen-lines" />
      <div className="hud-grid" />

      {/* 顶部遥测监控栏 */}
      <TelemetryHeader mode={engineMode} activeTaskCount={activeTaskCount} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        {/* 全息浮动胶囊导航 (Floating Capsule Nav) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--line)]/60 pb-5 mb-10">
          <div className="flex items-center p-1 border border-[var(--line)] bg-[#090e16]/80 backdrop-blur-md rounded-full shadow-lg">
            <button
              onClick={() => setCurrentTab("store")}
              className={`px-5 py-2 rounded-full font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                currentTab === "store"
                  ? "bg-cyan-950/80 text-white border border-[var(--holo)]/80 shadow-[0_0_16px_rgba(0,229,216,0.3)]"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[var(--holo)]" />
              <span>01. 订阅套餐选购 (STORE)</span>
            </button>

            <button
              onClick={() => setCurrentTab("redeem")}
              className={`px-5 py-2 rounded-full font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                currentTab === "redeem"
                  ? "bg-amber-950/80 text-white border border-[var(--warm)]/80 shadow-[0_0_16px_rgba(255,184,133,0.3)]"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[var(--warm)]" />
              <span>02. 自助激活开通 (REDEEM)</span>
            </button>

            <button
              onClick={() => setCurrentTab("query")}
              className={`px-5 py-2 rounded-full font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                currentTab === "query"
                  ? "bg-purple-950/80 text-white border border-purple-400/80 shadow-[0_0_16px_rgba(192,132,252,0.3)]"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <Search className="w-3.5 h-3.5 text-purple-400" />
              <span>03. 进度凭证查询 (TRACE)</span>
            </button>
          </div>

          {/* 右侧微光状态指示 */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-2 px-3 py-1 border border-white/5 bg-black/40 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 signal-dot" />
              <span>UPSTREAM DISPATCH: READY</span>
            </span>
          </div>
        </div>

        {/* 舱位 1：订阅套餐商城 */}
        {currentTab === "store" && (
          <StorePricingCabin onGoToRedeem={handleGoToRedeem} />
        )}

        {/* 舱位 2：自助激活终端 */}
        {currentTab === "redeem" && (
          <div className="space-y-6">
            <div className="p-3.5 border border-[var(--line)] bg-[#070d16]/85 backdrop-blur-md rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="w-2 h-2 bg-[var(--holo)] rounded-full" />
                <span>欢迎来到 ChatGPT / Claude 自动化交付中枢。请在下方录入卡密与 Session 启动下发。</span>
              </div>
              <button
                onClick={() => setCurrentTab("store")}
                className="text-[var(--warm)] hover:underline inline-flex items-center gap-1 text-[11px] self-start sm:self-auto"
              >
                尚未获取卡密？返回选购套餐 →
              </button>
            </div>

            <FulfillmentConsole
              presetPrefix={presetPrefix}
              onTaskChange={(count) => setActiveTaskCount(count)}
            />
          </div>
        )}

        {/* 舱位 3：订单与凭据查询 */}
        {currentTab === "query" && (
          <OrderQueryCabin />
        )}

        {/* 底部保障与全局说明 */}
        <footer className="mt-20 pt-8 border-t border-[var(--line)]/60 flex flex-col sm:flex-row items-center justify-between font-mono text-xs text-neutral-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--holo)]" />
            <span>QUANTUM LINK PROTOCOL · INTEGRATED STORE & FULFILLMENT</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>NODE: TOKYO-BGP-01</span>
            <span>UPSTREAM: SUZHE.AI V1</span>
          </div>
        </footer>
      </main>
    </div>
  );
}