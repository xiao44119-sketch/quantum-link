"use client";

import React, { useState, useEffect } from "react";
import { TelemetryHeader, NavTab } from "@/components/TelemetryHeader";
import {
  QuantumParticleCanvas,
  ParticleFormation,
} from "@/components/QuantumParticleCanvas";
import { StorePricingCabin } from "@/components/StorePricingCabin";
import { FulfillmentConsole } from "@/components/FulfillmentConsole";
import { OrderQueryCabin } from "@/components/OrderQueryCabin";
import { FinnInfraAndFaq } from "@/components/FinnInfraAndFaq";
import { Footer } from "@/components/Footer";
import { ActivationLine } from "@/lib/types";
import { ArrowRight, Sparkles } from "lucide-react";
import { soundFX } from "@/lib/tactile-feedback";

const LINE_ACCENT_MAP: Record<ActivationLine, string> = {
  chatgpt: "#10B981",
  sheerid: "#818CF8",
  codex_sms: "#38BDF8",
  grok: "#E2E8F0",
  tg_premium: "#0EA5E9",
  muse_boost: "#A855F7",
  gemini_pro: "#818CF8",
};

const HERO_COPY: Record<
  NavTab,
  {
    eyebrow: string;
    lead: string;
    highlight: string;
    sub: string;
    accent: string;
    formation: ParticleFormation;
  }
> = {
  store: {
    eyebrow: "OFFICIAL AI SUPPLY CHAIN · ZERO-PASSWORD PROTOCOL",
    lead: "前沿 AI 旗舰算力，",
    highlight: "秒级直连交付。",
    sub: "直通 OpenAI、Google Gemini、xAI SuperGrok 官方源头仓。零密码安全履约，全单加密存入云端保险柜。",
    accent: "#38BDF8",
    formation: "torus",
  },
  redeem: {
    eyebrow: "7-IN-1 AUTONOMOUS ACTIVATION ENGINE",
    lead: "粘贴专属卡密，",
    highlight: "全自动无感开通。",
    sub: "无需提供聊天账号密码，智能识别 7 大产品线档位，前置体检零损耗、实时追踪履约进度。",
    accent: "#10B981",
    formation: "helix",
  },
  query: {
    eyebrow: "SUPABASE ENCRYPTED ORDER VAULT",
    lead: "订单与激活凭证，",
    highlight: "随时一键溯源。",
    sub: "输入本站 QL 订单号、预留微信号或任意卡密，即时调取云端加密存档与上游核验记录。",
    accent: "#818CF8",
    formation: "sphere",
  },
};

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("store");
  const [presetPrefix, setPresetPrefix] = useState<string>("");
  const [activeTaskCount, setActiveTaskCount] = useState<number>(0);
  const [activeLine, setActiveLine] = useState<ActivationLine>("chatgpt");
  const [hoveredBrandHex, setHoveredBrandHex] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("ql_theme");
    const initial = saved === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    const timer = window.setTimeout(() => setBooted(true), 1600);
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
    currentTab === "store"
      ? hoveredBrandHex || hero.accent
      : currentTab === "redeem"
        ? LINE_ACCENT_MAP[activeLine] || hero.accent
        : hero.accent;

  // 首次进站与 3D 量子星环坍缩入场编舞协同：星环凝聚瞬间标题破雾浮升
  const baseDelay = booted ? 0 : 320;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] transition-colors duration-300 relative">
      {/* 顶部冰川极光序幕线 */}
      <div
        aria-hidden="true"
        className="ql-curtain-bar fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%)",
        }}
      />

      {/* 3D 量子星环坍缩 + 磁流体斥力粒子引擎 */}
      <QuantumParticleCanvas
        accentHex={dynamicAccent}
        secondaryHex="#818CF8"
        theme={theme}
        formation={hero.formation}
      />

      {/* 顶栏黑钛悬浮玻璃导航 */}
      <TelemetryHeader
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setHoveredBrandHex(null);
          setCurrentTab(tab);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeTaskCount={activeTaskCount}
      />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-7 pb-24">
        {/* Linear / Vercel 风格冷冽流光主舞台 */}
        <section key={currentTab} className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <div
            style={{ animationDelay: `${baseDelay + 40}ms` }}
            className="ql-rise inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full border border-[var(--rule-strong)] bg-[var(--bg-elevated)] backdrop-blur-xl text-[10.5px] font-mono tracking-[0.14em] uppercase text-[var(--ink-2)] shadow-sm"
          >
            <span
              className="w-1.5 h-1.5 rounded-full ql-halo-dot"
              style={{ backgroundColor: dynamicAccent }}
            />
            <span>{hero.eyebrow}</span>
          </div>

          <h1 className="text-[30px] sm:text-[46px] lg:text-[52px] leading-[1.1] tracking-[-0.038em] font-bold mt-4">
            <span
              style={{ animationDelay: `${baseDelay + 140}ms` }}
              className="ql-word-reveal ql-metallic-title"
            >
              {hero.lead}
            </span>
            <br className="sm:hidden" />
            <span
              style={{ animationDelay: `${baseDelay + 260}ms` }}
              className="ql-word-reveal ql-aurora-highlight"
            >
              {hero.highlight}
            </span>
          </h1>

          <p
            style={{ animationDelay: `${baseDelay + 360}ms` }}
            className="ql-rise text-sm sm:text-[15px] leading-relaxed text-[var(--ink-2)] max-w-2xl mx-auto mt-3"
          >
            {hero.sub}
          </p>

          {currentTab === "store" ? (
            <div
              style={{ animationDelay: `${baseDelay + 450}ms` }}
              className="ql-rise mt-4 flex items-center justify-center gap-3 flex-wrap text-xs"
            >
              <button
                type="button"
                onClick={() => handleGoToRedeem()}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--rule-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] backdrop-blur-xl text-[var(--ink)] font-medium transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>已购卡密？一键进入 7 合 1 全自动开通台</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--clay)] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ) : null}
        </section>

        {/* 三大核心业务舱 */}
        {currentTab === "store" ? (
          <StorePricingCabin
            onGoToRedeem={handleGoToRedeem}
            onHoverAccent={(hex) => setHoveredBrandHex(hex)}
            entranceBaseDelayMs={baseDelay}
          />
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
