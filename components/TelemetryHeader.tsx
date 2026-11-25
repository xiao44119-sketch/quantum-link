"use client";

import React, { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Settings,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { soundFX } from "@/lib/tactile-feedback";
import { Locale, UI_DICT } from "@/lib/i18n";

export type NavTab = "store" | "redeem" | "query";

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  locale: Locale;
  onToggleLocale: () => void;
  activeTaskCount?: number;
}

/**
 * Sand.ai × VidMuse 极简无框摄影棚顶栏：
 * - 摒弃厚重胶囊套壳，改用清爽底边高亮文字导航
 * - 克制的高级字标 + 右侧极简工具组
 */
export const TelemetryHeader: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  theme,
  onToggleTheme,
  locale,
  onToggleLocale,
  activeTaskCount = 0,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [muted, setMuted] = useState(false);
  const t = UI_DICT[locale];

  useEffect(() => {
    setMuted(soundFX.isMuted());
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems: Array<{ id: NavTab; label: string; mobileLabel: string }> = [
    { id: "store", label: t.nav.store, mobileLabel: t.nav.storeMobile },
    { id: "redeem", label: t.nav.redeem, mobileLabel: t.nav.redeemMobile },
    { id: "query", label: t.nav.query, mobileLabel: t.nav.queryMobile },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--rule)] bg-[var(--nav-glass)] backdrop-blur-2xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* 左侧：Sand.ai 风格极简几何沙漏/棱镜字标 */}
        <button
          type="button"
          onClick={() => {
            soundFX.play("tap");
            onSelectTab("store");
          }}
          className="flex items-center gap-2.5 group text-left cursor-pointer"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[var(--ink)] transition-transform duration-500 group-hover:rotate-12"
          >
            <path
              d="M5 4.5H19L12 12L19 19.5H5L12 12L5 4.5Z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="2" fill="var(--vermilion)" />
          </svg>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[15px] sm:text-base tracking-[-0.03em] text-[var(--ink)]">
              {locale === "en" ? "FINN.AI" : "骁清 FINN"}
            </span>
            <span className="hidden md:inline text-[11px] font-mono text-[var(--ink-3)]">
              {locale === "en" ? "/ QUANTUMLINK" : "/ 数字算力馆"}
            </span>
          </div>
        </button>

        {/* 中部：VidMuse 同款清爽无框文字导航 + 底部精确指示短线 */}
        <nav aria-label="Main Navigation" className="flex items-center gap-5 sm:gap-8">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundFX.play("switch");
                  onSelectTab(item.id);
                }}
                className={`relative py-2 text-[13px] sm:text-[14px] transition-colors cursor-pointer ${
                  active
                    ? "text-[var(--ink)] font-semibold"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.mobileLabel}</span>
                {item.id === "redeem" && activeTaskCount > 0 ? (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[var(--vermilion)] align-middle animate-ping" />
                ) : null}
                <span
                  className={`absolute left-0 right-0 bottom-0 h-[1.5px] rounded-full transition-all duration-300 ${
                    active ? "bg-[var(--ink)] opacity-100 scale-x-100" : "opacity-0 scale-x-50"
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* 右侧：极简语言/主题/音效/后台控制 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              soundFX.play("switch");
              onToggleLocale();
            }}
            className="h-8 px-2.5 sm:px-3 rounded-lg border border-[var(--rule)] hover:border-[var(--rule-strong)] bg-[var(--bg-subtle)] flex items-center gap-1.5 text-xs font-medium text-[var(--ink)] transition-colors cursor-pointer"
            title={t.nav.langToggleTitle}
          >
            <Globe className="w-3.5 h-3.5 text-[var(--vermilion)]" />
            <span>{t.nav.langToggleLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextMuted = soundFX.toggleMute();
              setMuted(nextMuted);
            }}
            className="hidden sm:flex w-8 h-8 rounded-lg border border-[var(--rule)] hover:border-[var(--rule-strong)] bg-[var(--bg-subtle)] items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.play("switch");
              onToggleTheme();
            }}
            className="h-8 px-2.5 rounded-lg border border-[var(--rule)] hover:border-[var(--rule-strong)] bg-[var(--bg-subtle)] flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            title={theme === "dark" ? "切换至 Sand.ai 暖纸浅色" : "切换至 VidMuse 影棚深色"}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#e4b274]" />
                <span className="hidden md:inline text-[11.5px]">
                  {locale === "en" ? "Paper" : "暖纸"}
                </span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[var(--ink)]" />
                <span className="hidden md:inline text-[11.5px]">
                  {locale === "en" ? "Studio" : "影棚"}
                </span>
              </>
            )}
          </button>

          <Link
            href="/admin"
            className="w-8 h-8 rounded-lg border border-[var(--rule)] hover:border-[var(--rule-strong)] bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
            title={t.nav.adminTitle}
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
