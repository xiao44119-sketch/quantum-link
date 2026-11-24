"use client";

import React, { useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  delayMs?: number;
  featured?: boolean;
}

export const SpotlightCard: React.FC<Props> = ({
  children,
  className = "",
  spotlightColor = "rgba(229, 184, 126, 0.16)",
  delayMs = 0,
  featured = false,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      style={{
        animationDelay: `${delayMs}ms`,
      }}
      className={`ql-card ql-rise relative overflow-hidden rounded-[26px] transition-all duration-500 ${
        featured ? "ql-card-featured" : ""
      } ${className}`}
    >
      {/* 鼠标跟随流体聚光灯高光层 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[26px] transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(460px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 45%)`,
        }}
      />
      <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
    </div>
  );
};
