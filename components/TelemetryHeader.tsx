"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Sparkles,
  Search,
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

  const navItems: Array<{ id: NavTab; label: string; mobileLabel: string; icon: any }> = [
    { id: "store", label: t.nav.store, mobileLabel: t.nav.storeMobile, icon: ShoppingBag },
    { id: "redeem", label: t.nav.redeem, mobileLabel: t.nav.redeemMobile, icon: Sparkles },
    { id: "query", label: t.nav.query, mobileLabel: t.nav.queryMobile, icon: Search },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--rule)] bg-[var(--nav-glass)] backdrop-blur-2xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-[70px] flex items-center justify-between gap-2.5">
        {/* 左侧：黑钛冰青棱镜品牌标识 */}
        <button
          type="button"
          onClick={() => {
            soundFX.play("tap");
            onSelectTab("store");
          }}
          className="flex items-center gap-2.5 sm:gap-3 group text-left cursor-pointer"
        >
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border border-sky-400/30 shadow-[0_0_24px_-4px_rgba(56,189,248,0.5)] transition-transform duration-500 group-hover:scale-105 flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(56,189,248,0.22) 0%, rgba(99,102,241,0.34) 100%)",
            }}
          >
            <span className="font-bold text-base sm:text-lg tracking-tighter text-sky-300">
              F
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[14.5px] sm:text-base tracking-tight text-[var(--ink)]">
                {t.brandName}
              </span>
              <span className="hidden lg:inline-block text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border border-[var(--rule-strong)] text-[var(--ink-2)] bg-[var(--bg-subtle)]">
                {locale === "en" ? "USD · GLOBAL" : "QUANTUM"}
              </span>
            </div>
            <span className="hidden sm:block text-[11px] text-[var(--ink-3)]">
              {t.brandSub}
            </span>
          </div>
        </button>

        {/* 中部：Linear 风格高透悬浮胶囊分段导航 */}
        <nav
          aria-label="Main Navigation"
          className="flex items-center p-1 rounded-full border border-[var(--rule)] bg-[var(--bg-elevated)] backdrop-blur-2xl shadow-sm"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundFX.play("switch");
                  onSelectTab(item.id);
                }}
                className={`relative px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] shadow-sm font-semibold"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.mobileLabel}</span>
                {item.id === "redeem" && activeTaskCount > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* 右侧：中英双语切换 (ZH/EN + USD)、微音效、黑钛/雾白主题与站长后台 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--rule)] bg-[var(--bg-subtle)] text-[11px] font-mono text-[var(--ink-2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ql-halo-dot" />
            <span>{t.nav.syncLive}</span>
          </div>

          {/* 中英双语 / 美金切换按钮 */}
          <button
            type="button"
            onClick={() => {
              soundFX.play("switch");
              onToggleLocale();
            }}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border border-sky-400/35 bg-sky-500/10 hover:bg-sky-500/20 flex items-center gap-1.5 text-xs font-semibold text-sky-400 transition-all cursor-pointer"
            title={t.nav.langToggleTitle}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.nav.langToggleLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextMuted = soundFX.toggleMute();
              setMuted(nextMuted);
            }}
            className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[var(--rule)] bg-[var(--bg-subtle)] hover:border-[var(--rule-strong)] items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition-all cursor-pointer"
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
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border border-[var(--rule)] bg-[var(--bg-subtle)] hover:border-[var(--rule-strong)] flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-all cursor-pointer"
            title={theme === "dark" ? t.nav.switchToLight : t.nav.switchToDark}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-sky-300" />
                <span className="hidden md:inline text-[11.5px]">{t.nav.lightMode}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline text-[11.5px]">{t.nav.darkMode}</span>
              </>
            )}
          </button>

          <Link
            href="/admin"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[var(--rule)] bg-[var(--bg-subtle)] hover:border-[var(--rule-strong)] flex items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)] transition-all"
            title={t.nav.adminTitle}
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
