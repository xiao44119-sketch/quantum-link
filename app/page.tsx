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
  // 默认定位在 01. 订阅选购
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
    <div className="min-h-screen bg-[#05070a] text-[#eaf8f7] relative selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* 视觉扫描层 */}
      <div className="screen-lines" />
      <div className="hud-grid" />

      {/* 顶部遥测监控栏 */}
      <TelemetryHeader mode={engineMode} activeTaskCount={activeTaskCount} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {/* 全息主导航 Tab 控制台 */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4 mb-8">
          {/* 左侧三大舱位切换器：顺序 01. 选购 -> 02. 激活 -> 03. 查询 */}
          <div className="flex items-center gap-1 sm:gap-2 font-mono text-xs">
            <button
              onClick={() => setCurrentTab("store")}
              className={`px-4 py-2.5 corner-bracket transition-all flex items-center gap-2 font-bold ${
                currentTab === "store"
                  ? "border border-[var(--holo)] bg-cyan-950/50 text-white shadow-[0_0_15px_rgba(0,212,200,0.25)]"
                  : "border border-transparent text-neutral-400 hover:text-white hover:border-[var(--line)]"
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-[var(--holo)]" />
              <span>01. 订阅套餐选购 (STORE)</span>
            </button>

            <button
              onClick={() => setCurrentTab("redeem")}
              className={`px-4 py-2.5 corner-bracket transition-all flex items-center gap-2 font-bold ${
                currentTab === "redeem"
                  ? "border border-[var(--warm)] bg-amber-950/40 text-white shadow-[0_0_15px_rgba(255,179,127,0.25)]"
                  : "border border-transparent text-neutral-400 hover:text-white hover:border-[var(--line)]"
              }`}
            >
              <Terminal className="w-4 h-4 text-[var(--warm)]" />
              <span>02. 自助激活开通 (REDEEM)</span>
            </button>

            <button
              onClick={() => setCurrentTab("query")}
              className={`px-4 py-2.5 corner-bracket transition-all flex items-center gap-2 font-bold ${
                currentTab === "query"
                  ? "border border-purple-400 bg-purple-950/40 text-white shadow-[0_0_15px_rgba(192,132,252,0.25)]"
                  : "border border-transparent text-neutral-400 hover:text-white hover:border-[var(--line)]"
              }`}
            >
              <Search className="w-4 h-4 text-purple-400" />
              <span>03. 进度与凭证查询 (TRACE)</span>
            </button>
          </div>

          {/* 右侧快捷状态指示 */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 signal-dot" />
              <span>UPSTREAM DISPATCH: READY</span>
            </span>
          </div>
        </div>

        {/* 舱位 1：订阅套餐商城 (默认显示在第一项) */}
        {currentTab === "store" && (
          <StorePricingCabin onGoToRedeem={handleGoToRedeem} />
        )}

        {/* 舱位 2：自助激活终端 */}
        {currentTab === "redeem" && (
          <div className="space-y-6">
            <div className="p-3 border border-[var(--line)] bg-[#070d16]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="w-2 h-2 bg-[var(--holo)]" />
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