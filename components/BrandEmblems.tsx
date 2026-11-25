"use client";

import React from "react";

export type BrandHouseKey =
  | "openai"
  | "gemini"
  | "grok"
  | "card_sms"
  | "telegram"
  | "creative";

interface EmblemProps {
  brand: BrandHouseKey;
  size?: "md" | "lg";
}

/**
 * 殿堂级高精度矢量品牌发光徽标 (取代廉价通用线条小图标)
 */
export const BrandEmblem: React.FC<EmblemProps> = ({ brand, size = "lg" }) => {
  const boxCls =
    size === "lg"
      ? "w-13 h-13 sm:w-14 sm:h-14 rounded-2xl"
      : "w-10 h-10 rounded-xl";
  const svgSize = size === "lg" ? 26 : 20;

  if (brand === "openai") {
    return (
      <div
        className={`${boxCls} relative flex items-center justify-center border border-emerald-400/30 shadow-[0_0_28px_-4px_rgba(16,185,129,0.45)] overflow-hidden`}
        style={{
          background:
            "linear-gradient(145deg, rgba(16,185,129,0.24) 0%, rgba(6,78,59,0.38) 100%)",
        }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 24 24"
          fill="none"
          className="text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
        >
          <g stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.75c2.1 0 3.85 1.48 4.25 3.46a4.35 4.35 0 0 1 3.72 2.17c1.05 1.82.62 4.1-.94 5.42.26 2.06-.82 4.1-2.78 4.9a4.35 4.35 0 0 1-4.25 2.55c-2.1 0-3.85-1.48-4.25-3.46a4.35 4.35 0 0 1-3.72-2.17c-1.05-1.82-.62-4.1.94-5.42-.26-2.06.82-4.1 2.78-4.9A4.35 4.35 0 0 1 12 2.75Z" />
            <polygon points="12,7.8 15.6,9.9 15.6,14.1 12,16.2 8.4,14.1 8.4,9.9" />
            <line x1="12" y1="7.8" x2="16.25" y2="6.2" />
            <line x1="15.6" y1="9.9" x2="19.0" y2="13.8" />
            <line x1="15.6" y1="14.1" x2="16.2" y2="18.7" />
            <line x1="12" y1="16.2" x2="7.75" y2="17.8" />
            <line x1="8.4" y1="14.1" x2="5.0" y2="10.2" />
            <line x1="8.4" y1="9.9" x2="7.8" y2="5.3" />
          </g>
        </svg>
      </div>
    );
  }

  if (brand === "gemini") {
    return (
      <div
        className={`${boxCls} relative flex items-center justify-center border border-indigo-400/35 shadow-[0_0_30px_-4px_rgba(129,140,248,0.5)] overflow-hidden`}
        style={{
          background:
            "linear-gradient(145deg, rgba(56,189,248,0.22) 0%, rgba(129,140,248,0.26) 55%, rgba(192,132,252,0.2) 100%)",
        }}
      >
        <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="geminiStarGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="52%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#E879F9" />
            </linearGradient>
          </defs>
          <path
            d="M12 1.8C12.35 7.25 16.75 11.65 22.2 12C16.75 12.35 12.35 16.75 12 22.2C11.65 16.75 7.25 12.35 1.8 12C7.25 11.65 11.65 7.25 12 1.8Z"
            fill="url(#geminiStarGrad)"
          />
        </svg>
      </div>
    );
  }

  if (brand === "grok") {
    return (
      <div
        className={`${boxCls} relative flex items-center justify-center border border-slate-300/30 shadow-[0_0_28px_-4px_rgba(226,232,240,0.35)] overflow-hidden`}
        style={{
          background:
            "linear-gradient(145deg, rgba(248,250,252,0.16) 0%, rgba(71,85,105,0.28) 100%)",
        }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 24 24"
          fill="none"
          className="text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
        >
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.75" strokeDasharray="34 12" />
          <path d="M5.2 19.2L19.2 4.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (brand === "card_sms") {
    return (
      <div
        className={`${boxCls} relative flex items-center justify-center border border-sky-400/35 shadow-[0_0_28px_-4px_rgba(56,189,248,0.45)] overflow-hidden`}
        style={{
          background:
            "linear-gradient(145deg, rgba(56,189,248,0.24) 0%, rgba(14,116,144,0.32) 100%)",
        }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 24 24"
          fill="none"
          className="text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.55)]"
        >
          <rect x="2.5" y="5" width="19" height="14" rx="3" stroke="currentColor" strokeWidth="1.7" />
          <rect x="5.5" y="9.5" width="4.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2.5 8.5H21.5" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.6" />
          <path d="M15.5 13.5C16.3 12.7 16.3 11.3 15.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M17.8 15C19.2 13.4 19.2 10.6 17.8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (brand === "telegram") {
    return (
      <div
        className={`${boxCls} relative flex items-center justify-center border border-cyan-400/35 shadow-[0_0_28px_-4px_rgba(14,165,233,0.48)] overflow-hidden`}
        style={{
          background:
            "linear-gradient(145deg, rgba(14,165,233,0.26) 0%, rgba(2,132,199,0.32) 100%)",
        }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 24 24"
          fill="none"
          className="text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.55)]"
        >
          <path
            d="M21.2 4.4L2.9 11.5C2.1 11.8 2.1 12.9 2.9 13.2L7.6 14.8L18.2 7.9L10.1 15.8L9.8 20.1C9.8 20.8 10.6 21.1 11.1 20.6L13.9 17.9L18.4 21.1C19.1 21.6 20.1 21.2 20.3 20.3L22.5 5.6C22.7 4.7 21.9 4.1 21.2 4.4Z"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${boxCls} relative flex items-center justify-center border border-purple-400/35 shadow-[0_0_28px_-4px_rgba(168,85,247,0.48)] overflow-hidden`}
      style={{
        background:
          "linear-gradient(145deg, rgba(168,85,247,0.24) 0%, rgba(236,72,153,0.22) 100%)",
      }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 24 24"
        fill="none"
        className="text-purple-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]"
      >
        <path
          d="M13.2 2.5L4.8 13.4H11.6L10.8 21.5L19.2 10.6H12.4L13.2 2.5Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
