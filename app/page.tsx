"use client";

import React, { useState, useEffect } from "react";
import { TelemetryHeader, NavTab } from "@/components/TelemetryHeader";
import { AmbientAuroraCanvas } from "@/components/AmbientAuroraCanvas";
import { EntranceCurtain } from "@/components/EntranceCurtain";
import { StorePricingCabin } from "@/components/StorePricingCabin";
import { FulfillmentConsole } from "@/components/FulfillmentConsole";
import { OrderQueryCabin } from "@/components/OrderQueryCabin";
import { FinnInfraAndFaq } from "@/components/FinnInfraAndFaq";
import { Footer } from "@/components/Footer";
import { ActivationLine } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import { soundFX } from "@/lib/tactile-feedback";

const LINE_ACCENT_MAP: Record<ActivationLine, string> = {
  chatgpt: "#4E9578",
  sheerid: "#7386E8",
  codex_sms: "#E27B58",
  grok: "#C7B293",
  tg_premium: "#4A96D9",
  muse_boost: "#D97757",
  gemini_pro: "#8676E6",
};

const HERO_COPY: Record<
  NavTab,
  {
    eyebrow: string;
    lead: string;
    highlight: string;
    sub: string;
    accent: string;
  }
> = {
  store: {
    eyebrow: "官方正版供应链实时直连 · 零密码安全协议",
    lead: "顶配 AI 生产力，",
    highlight: "一步优雅入手。",
    sub: "严选 ChatGPT Pro 10x / 20x、Gemini 学生身份认证、SuperGrok 与海外接码绑卡，库存实时同步、云端保险柜存证。",
    accent: "#D97757",
  },
  redeem: {
    eyebrow: "7 合 1 智能履约引擎 · 自动识别卡密档位",
    lead: "输入专属卡密，",
    highlight: "全自动秒级开通。",
    sub: "无需提供聊天账号密码，粘贴卡密自动展开对应向导，前置体检不扣次数，全程透明追踪。",
    accent: "#4E9578",
  },
  query: {
    eyebrow: "Supabase 加密保险柜 · 永久防丢单存证",
    lead: "订单与卡密进度，",
    highlight: "随时一键溯源。",
    sub: "输入本站 QL 订单号、预留微信号或任意卡密，实时调取交付凭证与上游核验状态。",
    accent: "#7386E8",
  },
};

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("store");
  const [presetPrefix, setPresetPrefix] = useState<string>("");
  const [activeTaskCount, setActiveTaskCount] = useState<number>(0);
  const [activeLine, setActiveLine] = useState<ActivationLine>("chatgpt");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("ql_theme");
    const initial = saved === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    const timer = window.setTimeout(() => setBooted(true), 1150);
    return () => window.clearTimeout(timer);
  }, []);

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("ql_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const handleGoToRedeem = (prefix?: string) => {
    soundFX.play("switch");
    if (prefix) setPresetPrefix(prefix);
    setCurrentTab("redeem");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hero = HERO_COPY[currentTab];
  const dynamicAccent =
    currentTab === "redeem" ? LINE_ACCENT_MAP[activeLine] || hero.accent : hero.accent;
  const baseDelay = booted ? 0 : 440;

  return (
    <div className="min-h-screen relative">
      {/* 进站序幕揭幕仪式（0.54s 非阻塞丝绸雾化揭幕） */}
      <EntranceCurtain theme={theme} />

      {/* 进站顶部流光序幕线 */}
      <div
        aria-hidden="true"
        className="ql-curtain-bar fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, #4E9578 0%, #E6BE8A 50%, #E27B58 100%)",
        }}
      />

      {/* 60fps 交互式星轨极光背景 */}
      <AmbientAuroraCanvas accentHex={dynamicAccent} theme={theme} />

      {/* 顶栏悬浮玻璃导航 */}
      <TelemetryHeader
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeTaskCount={activeTaskCount}
      />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-24">
        {/* 艺术杂志级 Hero 主舞台（带逐段模糊微倾揭幕动效） */}
        <section key={currentTab} className="text-center max-w-3xl mx-auto mb-7 sm:mb-9">
          <div
            style={{ animationDelay: `${baseDelay + 30}ms` }}
            className="ql-rise inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[var(--rule-strong)] bg-[var(--bg-elevated)] backdrop-blur-md text-xs font-medium text-[var(--ink-2)] shadow-sm"
          >
            <span
              className="w-2 h-2 rounded-full ql-halo-dot"
              style={{ backgroundColor: dynamicAccent }}
            />
            <span>{hero.eyebrow}</span>
          </div>

          <h1 className="font-serif-editorial text-[30px] sm:text-[46px] lg:text-[52px] leading-[1.14] tracking-[-0.025em] text-[var(--ink)] mt-4 sm:mt-5 font-medium">
            <span style={{ animationDelay: `${baseDelay + 100}ms` }} className="ql-word-reveal">
              {hero.lead}
            </span>
            <span
              style={{
                animationDelay: `${baseDelay + 210}ms`,
                color: dynamicAccent,
              }}
              className="ql-word-reveal transition-colors duration-700"
            >
              {hero.highlight}
            </span>
          </h1>

          <p
            style={{ animationDelay: `${baseDelay + 300}ms` }}
            className="ql-rise text-sm sm:text-[15.5px] leading-relaxed text-[var(--ink-2)] max-w-2xl mx-auto mt-3.5 sm:mt-4"
          >
            {hero.sub}
          </p>

          {currentTab === "store" ? (
            <div
              style={{ animationDelay: `${baseDelay + 380}ms` }}
              className="ql-rise mt-4 sm:mt-5 flex items-center justify-center gap-3 flex-wrap text-xs"
            >
              <button
                type="button"
                onClick={() => handleGoToRedeem()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--rule-strong)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--ink)] font-medium transition-all cursor-pointer"
              >
                <span>已有卡密？直接进入 7 合 1 自助开通台</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--clay)]" />
              </button>
            </div>
          ) : null}
        </section>

        {/* 三大核心业务舱 */}
        {currentTab === "store" ? (
          <StorePricingCabin onGoToRedeem={handleGoToRedeem} />
        ) : null}

        {currentTab === "redeem" ? (
          <FulfillmentConsole
            presetPrefix={presetPrefix}
            onTaskChange={(count) => setActiveTaskCount(count)}
            onLineChange={(line) => setActiveLine(line)}
          />
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
