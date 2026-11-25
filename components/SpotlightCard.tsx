"use client";

import React, { useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  delayMs?: number;
  featured?: boolean;
  enableTilt?: boolean;
  onClick?: () => void;
  onMouseEnterCard?: () => void;
  onMouseLeaveCard?: () => void;
}

export const SpotlightCard: React.FC<Props> = ({
  children,
  className = "",
  spotlightColor = "rgba(56, 189, 248, 0.16)",
  delayMs = 0,
  featured = false,
  enableTilt = false,
  onClick,
  onMouseEnterCard,
  onMouseLeaveCard,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPos({ x, y });

    if (enableTilt) {
      const nx = x / rect.width - 0.5;
      const ny = y / rect.height - 0.5;
      setTilt({
        rx: -ny * 5.5,
        ry: nx * 5.5,
      });
    }
  };

  const handleMouseEnter = () => {
    setOpacity(1);
    onMouseEnterCard?.();
  };

  const handleMouseLeave = () => {
    setOpacity(0);
    if (enableTilt) {
      setTilt({ rx: 0, ry: 0 });
    }
    onMouseLeaveCard?.();
  };

  return (
    <div
      ref={divRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        animationDelay: `${delayMs}ms`,
        transform:
          enableTilt && opacity > 0
            ? `perspective(1050px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-4px)`
            : undefined,
      }}
      className={`ql-card ql-rise relative overflow-hidden rounded-[26px] ${
        featured ? "ql-card-featured" : ""
      } ${className}`}
    >
      {/* 顶部 1px 钛金属镜面高光折射棱 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-8 right-8 h-px opacity-75"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)",
        }}
      />

      {/* 鼠标跟随流体聚光灯高光层 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[26px] transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(480px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 46%)`,
        }}
      />
      <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
    </div>
  );
};
