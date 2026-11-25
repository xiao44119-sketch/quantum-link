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
import { Locale, UI_DICT } from "@/lib/i18n";

const LINE_ACCENT_MAP: Record<ActivationLine, string> = {
  chatgpt: "#10B981",
  sheerid: "#818CF8",
  codex_sms: "#38BDF8",
  grok: "#E2E8F0",
  tg_premium: "#0EA5E9",
  muse_boost: "#A855F7",
  gemini_pro: "#818CF8",
};

const TAB_STYLE: Record<NavTab, { accent: string; formation: ParticleFormation }> = {
  store: { accent: "#38BDF8", formation: "torus" },
  redeem: { accent: "#10B981", formation: "helix" },
  query: { accent: "#818CF8", formation: "sphere" },
};

interface Props {
  initialLocale?: Locale;
}

export const StorefrontShell: React.FC<Props> = ({ initialLocale = "zh" }) => {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [currentTab, setCurrentTab] = useState<NavTab>("store");
  const [presetPrefix, setPresetPrefix] = useState<string>("");
  const [activeTaskCount, setActiveTaskCount] = useState<number>(0);
  const [activeLine, setActiveLine] = useState<ActivationLine>("chatgpt");
  const [hoveredBrandHex, setHoveredBrandHex] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ql_theme");
    const initialTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    document.documentElement.lang = initialLocale === "en" ? "en" : "zh-CN";

    // 若用户直接访问根路径 `/` 且之前未手动选择过语言，海外纯英文浏览器自动友好提示或保持当前路由一致
    const timer = window.setTimeout(() => setBooted(true), 1600);
    return () => window.clearTimeout(timer);
  }, [initialLocale]);

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("ql_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const handleToggleLocale = () => {
    const next: Locale = locale === "zh" ? "en" : "zh";
    setLocale(next);
    window.localStorage.setItem("ql_locale", next);
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
    // 无刷新同步 URL 至 /en 或 /，既保持 3D 粒子场不中断，又方便直接复制分享英文独立链接
    if (typeof window !== "undefined") {
      const targetPath = next === "en" ? "/en" : "/";
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, "", targetPath);
      }
    }
  };

  const handleGoToRedeem = (prefix?: string) => {
    soundFX.play("switch");
    if (prefix) setPresetPrefix(prefix);
    setCurrentTab("redeem");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const heroCopy = UI_DICT[locale].hero[currentTab];
  const tabMeta = TAB_STYLE[currentTab];
  const dynamicAccent =
    currentTab === "store"
      ? hoveredBrandHex || tabMeta.accent
      : currentTab === "redeem"
        ? LINE_ACCENT_MAP[activeLine] || tabMeta.accent
        : tabMeta.accent;

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
        formation={tabMeta.formation}
      />

      {/* 顶栏黑钛悬浮玻璃导航（含中/EN 双语及美金切换） */}
      <TelemetryHeader
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setHoveredBrandHex(null);
          setCurrentTab(tab);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        locale={locale}
        onToggleLocale={handleToggleLocale}
        activeTaskCount={activeTaskCount}
      />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-7 pb-24">
        {/* Linear / Vercel 风格冷冽流光主舞台 */}
        <section key={`${currentTab}_${locale}`} className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <div
            style={{ animationDelay: `${baseDelay + 40}ms` }}
            className="ql-rise inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full border border-[var(--rule-strong)] bg-[var(--bg-elevated)] backdrop-blur-xl text-[10.5px] font-mono tracking-[0.14em] uppercase text-[var(--ink-2)] shadow-sm"
          >
            <span
              className="w-1.5 h-1.5 rounded-full ql-halo-dot"
              style={{ backgroundColor: dynamicAccent }}
            />
            <span>{heroCopy.eyebrow}</span>
          </div>

          <h1 className="text-[30px] sm:text-[46px] lg:text-[52px] leading-[1.1] tracking-[-0.038em] font-bold mt-4">
            <span
              style={{ animationDelay: `${baseDelay + 140}ms` }}
              className="ql-word-reveal ql-metallic-title"
            >
              {heroCopy.lead}
            </span>
            <br className="sm:hidden" />
            <span
              style={{ animationDelay: `${baseDelay + 260}ms` }}
              className="ql-word-reveal ql-aurora-highlight"
            >
              {heroCopy.highlight}
            </span>
          </h1>

          <p
            style={{ animationDelay: `${baseDelay + 360}ms` }}
            className="ql-rise text-sm sm:text-[15px] leading-relaxed text-[var(--ink-2)] max-w-2xl mx-auto mt-3"
          >
            {heroCopy.sub}
          </p>

          {currentTab === "store" && heroCopy.ctaRedeem ? (
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
                <span>{heroCopy.ctaRedeem}</span>
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
            locale={locale}
          />
        ) : null}

        {currentTab === "redeem" ? (
          <FulfillmentConsole
            presetPrefix={presetPrefix}
            onTaskChange={(count) => setActiveTaskCount(count)}
            onLineChange={(line) => setActiveLine(line)}
            locale={locale}
          />
        ) : null}

        {currentTab === "query" ? (
          <OrderQueryCabin onGoToRedeem={handleGoToRedeem} locale={locale} />
        ) : null}

        <FinnInfraAndFaq locale={locale} />
      </main>

      <Footer onNavigateTab={(tab) => setCurrentTab(tab)} locale={locale} />
    </div>
  );
};
