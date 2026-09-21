"use client";

import React, { useState, useEffect } from "react";
import { TelemetryHeader } from "@/components/TelemetryHeader";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { StorePricingCabin } from "@/components/StorePricingCabin";
import { FulfillmentConsole } from "@/components/FulfillmentConsole";
import { OrderQueryCabin } from "@/components/OrderQueryCabin";
import { FinnInfraAndFaq } from "@/components/FinnInfraAndFaq";
import { Footer } from "@/components/Footer";
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

      {/* Finn 实时节点与履约动态走马灯 */}
      <LiveActivityFeed />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* 现代极简浮动胶囊导航 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-8">
          <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center p-1 border border-white/10 bg-[#090e16]/90 backdrop-blur-md rounded-xl sm:rounded-full shadow-lg">
            <button
              onClick={() => setCurrentTab("store")}
              className={`px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                currentTab === "store"
                  ? "bg-cyan-950/90 text-white border border-[var(--holo)]/70 shadow-[0_0_15px_rgba(0,229,216,0.25)] font-bold"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[var(--holo)] flex-shrink-0" />
              <span className="hidden sm:inline">01. 订阅套餐选购</span>
              <span className="sm:hidden">选购套餐</span>
            </button>

            <button
              onClick={() => setCurrentTab("redeem")}
              className={`px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                currentTab === "redeem"
                  ? "bg-amber-950/90 text-white border border-[var(--warm)]/70 shadow-[0_0_15px_rgba(255,184,133,0.25)] font-bold"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[var(--warm)] flex-shrink-0" />
              <span className="hidden sm:inline">02. 自助激活开通</span>
              <span className="sm:hidden">自助激活</span>
            </button>

            <button
              onClick={() => setCurrentTab("query")}
              className={`px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                currentTab === "query"
                  ? "bg-purple-950/90 text-white border border-purple-400/70 shadow-[0_0_15px_rgba(192,132,252,0.25)] font-bold"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <Search className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span className="hidden sm:inline">03. 履约凭据查询</span>
              <span className="sm:hidden">凭据查询</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-2 px-3.5 py-1.5 border border-white/5 bg-white/[0.02] rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 signal-dot" />
              <span>DISPATCH CLUSTER · ALL SYSTEMS NOMINAL</span>
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
            <div className="p-3.5 border border-white/[0.08] bg-[#070d16]/85 backdrop-blur-md rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
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

        {/* Finn 节点基础设施与 FAQ 深度内容区（解决页面空旷问题） */}
        <FinnInfraAndFaq />
      </main>

      {/* 全宽底部社区与多渠道支持中心 */}
      <Footer onNavigateTab={(tab) => setCurrentTab(tab)} />
    </div>
  );
}