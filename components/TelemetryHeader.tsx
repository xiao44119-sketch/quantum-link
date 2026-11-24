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
} from "lucide-react";
import Link from "next/link";
import { soundFX } from "@/lib/tactile-feedback";

export type NavTab = "store" | "redeem" | "query";

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  activeTaskCount?: number;
}

export const TelemetryHeader: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  theme,
  onToggleTheme,
  activeTaskCount = 0,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(soundFX.isMuted());
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems: Array<{ id: NavTab; label: string; mobileLabel: string; icon: any }> = [
    { id: "store", label: "严选商店", mobileLabel: "商店", icon: ShoppingBag },
    { id: "redeem", label: "自助开通", mobileLabel: "开通", icon: Sparkles },
    { id: "query", label: "查单取卡", mobileLabel: "查单", icon: Search },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--rule)] bg-[var(--nav-glass)] backdrop-blur-2xl shadow-sm"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-3">
        {/* 左侧：艺术感品牌徽标（带苏哲同款弹簧微倾反馈） */}
        <button
          type="button"
          onClick={() => {
            soundFX.play("tap");
            onSelectTab("store");
          }}
          className="flex items-center gap-3 group text-left cursor-pointer"
        >
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-[13px] flex items-center justify-center shadow-md transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #E27B58 0%, #C85A38 100%)",
              color: "#FAF8F5",
            }}
          >
            <span className="font-serif-editorial font-bold text-lg leading-none">F</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-editorial font-semibold text-base sm:text-[17px] tracking-tight text-[var(--ink)]">
                骁清 FINN
              </span>
              <span className="hidden md:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border border-[var(--rule-strong)] text-[var(--ink-2)] bg-[var(--bg-subtle)]">
                数字算力馆
              </span>
            </div>
            <span className="hidden sm:block text-[11px] text-[var(--ink-3)] mt-0.5">
              Official AI Subscription Studio
            </span>
          </div>
        </button>

        {/* 中部：高定悬浮胶囊分段导航 */}
        <nav
          aria-label="主导航"
          className="flex items-center p-1 rounded-full border border-[var(--rule)] bg-[var(--bg-elevated)] backdrop-blur-xl shadow-sm"
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
                className={`relative px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13.5px] font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
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

        {/* 右侧：状态、微音效、日夜纸墨双主题切换与站长入口 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--rule)] bg-[var(--bg-subtle)] text-[11.5px] text-[var(--ink-2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ql-halo-dot" />
            <span>网关在线</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextMuted = soundFX.toggleMute();
              setMuted(nextMuted);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[var(--rule)] bg-[var(--bg-subtle)] hover:border-[var(--rule-strong)] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition-all cursor-pointer"
            title={muted ? "开启轻触微音效" : "静音微音效"}
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
            title={theme === "dark" ? "切换至「日出暖纸」主题" : "切换至「深夜星屿」主题"}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline text-[11.5px]">暖纸</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden md:inline text-[11.5px]">星屿</span>
              </>
            )}
          </button>

          <Link
            href="/admin"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[var(--rule)] bg-[var(--bg-subtle)] hover:border-[var(--rule-strong)] flex items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)] transition-all"
            title="站长运营后台"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
