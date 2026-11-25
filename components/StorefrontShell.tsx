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
import { soundFX } from "@/lib/tactile-feedback";
import { Locale, UI_DICT } from "@/lib/i18n";

const LINE_ACCENT_MAP: Record<ActivationLine, string> = {
  chatgpt: "#10B981",
  sheerid: "#6366F1",
  codex_sms: "#FB5123",
  grok: "#E4B274",
  tg_premium: "#0EA5E9",
  muse_boost: "#A855F7",
  gemini_pro: "#6366F1",
};

const TAB_STYLE: Record<NavTab, { accent: string; formation: ParticleFormation }> = {
  store: { accent: "#10B981", formation: "torus" },
  redeem: { accent: "#FB5123", formation: "helix" },
  query: { accent: "#6366F1", formation: "sphere" },
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
  const [stageAccentHex, setStageAccentHex] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ql_theme");
    const initialTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    document.documentElement.style.backgroundColor =
      initialTheme === "light" ? "#f9f8f6" : "#0f1113";
    document.body.style.backgroundColor =
      initialTheme === "light" ? "#f9f8f6" : "#0f1113";
    document.documentElement.lang = initialLocale === "en" ? "en" : "zh-CN";

    const timer = window.setTimeout(() => setBooted(true), 1500);
    return () => window.clearTimeout(timer);
  }, [initialLocale]);

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("ql_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.backgroundColor = next === "light" ? "#f9f8f6" : "#0f1113";
    document.body.style.backgroundColor = next === "light" ? "#f9f8f6" : "#0f1113";
  };

  const handleToggleLocale = () => {
    const next: Locale = locale === "zh" ? "en" : "zh";
    setLocale(next);
    window.localStorage.setItem("ql_locale", next);
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
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
      ? stageAccentHex || tabMeta.accent
      : currentTab === "redeem"
        ? LINE_ACCENT_MAP[activeLine] || tabMeta.accent
        : tabMeta.accent;

  const baseDelay = booted ? 0 : 280;

  return (
    <div
      data-theme={theme}
      style={{
        backgroundColor: theme === "light" ? "#f9f8f6" : "#0f1113",
        color: theme === "light" ? "#141414" : "#ffffff",
      }}
      className="min-h-screen relative"
    >
      {/* 顶部 VidMuse 风格极细朱红进度序幕线 */}
      <div
        aria-hidden="true"
        className="ql-curtain-bar fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, #FB5123 0%, #E4B274 100%)",
        }}
      />

      {/* 3D 广域外缘粒子力场 + 中心文字静谧区 + VidMuse 左右边缘影棚氛围泛光 */}
      <QuantumParticleCanvas
        accentHex={dynamicAccent}
        secondaryHex="#E4B274"
        theme={theme}
        formation={tabMeta.formation}
      />

      {/* 极简无框摄影棚顶栏 */}
      <TelemetryHeader
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setStageAccentHex(null);
          setCurrentTab(tab);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        locale={locale}
        onToggleLocale={handleToggleLocale}
        activeTaskCount={activeTaskCount}
      />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
        {/* Sand.ai × VidMuse 极简紧凑片头排版（让大画幅导演展台完整落于首屏正中央） */}
        <section
          key={`${currentTab}_${locale}`}
          className={`mb-6 sm:mb-8 ${
            currentTab === "store"
              ? "flex flex-col md:flex-row md:items-end justify-between gap-4"
              : "text-center max-w-3xl mx-auto"
          }`}
        >
          <div className="space-y-2">
            <div
              style={{ animationDelay: `${baseDelay + 30}ms` }}
              className={`ql-rise inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.16em] uppercase text-[var(--ink-3)] ${
                currentTab === "store" ? "" : "justify-center"
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: dynamicAccent }}
              />
              <span>{heroCopy.eyebrow}</span>
            </div>

            <h1 className="text-[28px] sm:text-[40px] lg:text-[44px] leading-[1.12] tracking-[-0.035em] font-bold">
              <span
                style={{ animationDelay: `${baseDelay + 110}ms` }}
                className="ql-word-reveal ql-metallic-title"
              >
                {heroCopy.lead}
              </span>
              <span
                style={{ animationDelay: `${baseDelay + 210}ms` }}
                className="ql-word-reveal ql-aurora-highlight"
              >
                {heroCopy.highlight}
              </span>
            </h1>
          </div>

          <p
            style={{ animationDelay: `${baseDelay + 280}ms` }}
            className={`ql-rise text-xs sm:text-[13.5px] leading-relaxed text-[var(--ink-2)] ${
              currentTab === "store" ? "max-w-md md:text-right" : "max-w-2xl mx-auto mt-3"
            }`}
          >
            {heroCopy.sub}
          </p>
        </section>

        {/* 三大核心业务舱 */}
        {currentTab === "store" ? (
          <StorePricingCabin
            onGoToRedeem={handleGoToRedeem}
            onHoverAccent={(hex) => setStageAccentHex(hex)}
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
