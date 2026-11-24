"use client";

import React, { useState, useEffect } from "react";
import { TelemetryHeader } from "@/components/TelemetryHeader";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { StorePricingCabin } from "@/components/StorePricingCabin";
import { FulfillmentConsole } from "@/components/FulfillmentConsole";
import { OrderQueryCabin } from "@/components/OrderQueryCabin";
import { FinnInfraAndFaq } from "@/components/FinnInfraAndFaq";
import { Footer } from "@/components/Footer";
import { ShoppingCart, Terminal, Search } from "lucide-react";

type ActiveTab = "store" | "redeem" | "query";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<ActiveTab>("store");
  const [presetPrefix, setPresetPrefix] = useState<string>("");
  const [activeTaskCount, setActiveTaskCount] = useState<number>(0);
  const [engineMode, setEngineMode] = useState<string>("UPSTREAM_PRODUCTION");

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-[#f0f7f7] relative selection:bg-cyan-500/20 selection:text-cyan-200">
      <div className="ambient-glow" />
      <div className="screen-lines" />
      <div className="hud-grid" />

      <TelemetryHeader mode={engineMode} activeTaskCount={activeTaskCount} />
      <LiveActivityFeed />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-8">
          <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center p-1 border border-white/10 bg-[#090e16]/90 backdrop-blur-md rounded-xl sm:rounded-full shadow-lg">
            <button
              onClick={() => setCurrentTab("store")}
              className={`px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === "store"
                  ? "bg-cyan-950/90 text-white border border-[var(--holo)]/70 shadow-[0_0_15px_rgba(0,229,216,0.25)] font-bold"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[var(--holo)] flex-shrink-0" />
              <span className="hidden sm:inline">01. 严选套餐商城</span>
              <span className="sm:hidden">选购套餐</span>
            </button>

            <button
              onClick={() => setCurrentTab("redeem")}
              className={`px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === "redeem"
                  ? "bg-amber-950/90 text-white border border-[var(--warm)]/70 shadow-[0_0_15px_rgba(255,184,133,0.25)] font-bold"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[var(--warm)] flex-shrink-0" />
              <span className="hidden sm:inline">02. 七合一自助激活</span>
              <span className="sm:hidden">自助激活</span>
            </button>

            <button
              onClick={() => setCurrentTab("query")}
              className={`px-2 sm:px-5 py-2 rounded-lg sm:rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === "query"
                  ? "bg-purple-950/90 text-white border border-purple-400/70 shadow-[0_0_15px_rgba(192,132,252,0.25)] font-bold"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <Search className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span className="hidden sm:inline">03. 订单与卡密查询</span>
              <span className="sm:hidden">查单取卡</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-2 px-3.5 py-1.5 border border-white/5 bg-white/[0.02] rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 signal-dot" />
              <span>SUZHE V2 · SUPABASE VAULT ACTIVE</span>
            </span>
          </div>
        </div>

        {currentTab === "store" ? (
          <StorePricingCabin onGoToRedeem={handleGoToRedeem} />
        ) : null}

        {currentTab === "redeem" ? (
          <div className="space-y-5">
            <div className="p-3.5 border border-white/[0.08] bg-[#070d16]/85 backdrop-blur-md rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="w-2 h-2 bg-[var(--holo)] rounded-full" />
                <span>
                  支持 ChatGPT 四档、Gemini 学生认证、Codex 在线接码、Grok、TG 会员、Muse 助力与 Gemini Pro 自动识别开通。
                </span>
              </div>
              <button
                onClick={() => setCurrentTab("store")}
                className="text-[var(--warm)] hover:underline inline-flex items-center gap-1 text-[11px] self-start sm:self-auto cursor-pointer"
              >
                尚未获取卡密？返回商城选购 →
              </button>
            </div>

            <FulfillmentConsole
              presetPrefix={presetPrefix}
              onTaskChange={(count) => setActiveTaskCount(count)}
            />
          </div>
        ) : null}

        {currentTab === "query" ? (
          <OrderQueryCabin onGoToRedeem={handleGoToRedeem} />
        ) : null}

        <FinnInfraAndFaq />
      </main>

      <Footer onNavigateTab={(tab) => setCurrentTab(tab)} />
    </div>
  );
}
