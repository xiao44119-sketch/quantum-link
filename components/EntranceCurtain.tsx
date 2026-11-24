"use client";

import React, { useEffect, useState } from "react";

interface Props {
  theme?: "dark" | "light";
}

/**
 * 进站序幕仪式层 (Awwwards / 苏哲画册级非阻塞揭幕动效)
 * - 0 ~ 520ms: 徽章弹簧浮现 + 金陶流光掠影 + 网关同步读数
 * - 520 ~ 1050ms: 丝绸雾化揭幕 (pointer-events-none 不阻挡任何点击)
 * - 1080ms: 完全卸载 DOM，零性能负担
 */
export const EntranceCurtain: React.FC<Props> = ({ theme = "dark" }) => {
  const [phase, setPhase] = useState<"enter" | "leave" | "done">("enter");
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const t1 = window.setTimeout(() => setProgress(76), 140);
    const t2 = window.setTimeout(() => setProgress(100), 380);
    const tLeave = window.setTimeout(() => setPhase("leave"), 540);
    const tDone = window.setTimeout(() => setPhase("done"), 1120);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(tLeave);
      window.clearTimeout(tDone);
    };
  }, []);

  if (phase === "done") return null;

  const isDark = theme === "dark";

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center select-none transition-all duration-500 ${
        phase === "leave"
          ? "opacity-0 scale-[1.035] blur-md pointer-events-none"
          : "opacity-100 scale-100 blur-0 pointer-events-none"
      }`}
      style={{
        backgroundColor: isDark ? "#0b0c10" : "#f5f2ea",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* 中心呼吸极光晕 */}
      <div
        className="absolute w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] rounded-full blur-3xl opacity-35"
        style={{
          background:
            "radial-gradient(circle, rgba(226,123,88,0.42) 0%, rgba(230,190,138,0.18) 45%, transparent 72%)",
        }}
      />

      {/* 品牌高定印章与衬线序幕 */}
      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
        <div
          className="ql-pop w-14 h-14 rounded-[18px] flex items-center justify-center shadow-xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #E27B58 0%, #C85A38 100%)",
            color: "#FAF8F5",
          }}
        >
          <span className="font-serif-editorial font-bold text-2xl tracking-tight">F</span>
          <span
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)",
              animation: "shimmerGlide 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          />
        </div>

        <div className="space-y-1.5">
          <div
            className="font-serif-editorial text-xl sm:text-2xl font-medium tracking-tight"
            style={{ color: isDark ? "#F5F3EC" : "#1B1A17" }}
          >
            骁清 FINN · 数字算力馆
          </div>
          <div
            className="text-[11px] font-mono tracking-[0.22em] uppercase"
            style={{ color: isDark ? "#9A968C" : "#6E6A61" }}
          >
            ATELIER AI STOREFRONT · {progress}%
          </div>
        </div>

        {/* 极细丝绸进度弧线 */}
        <div
          className="w-40 sm:w-48 h-[2px] rounded-full overflow-hidden mt-1"
          style={{
            backgroundColor: isDark ? "rgba(245,243,236,0.1)" : "rgba(27,26,23,0.1)",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #4E9578 0%, #E6BE8A 50%, #E27B58 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
};
