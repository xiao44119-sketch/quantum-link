"use client";

import React, { useEffect, useRef } from "react";

interface Props {
  accentHex?: string;
  theme?: "dark" | "light";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16
  );
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export const AmbientAuroraCanvas: React.FC<Props> = ({
  accentHex = "#D97757",
  theme = "dark",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRgbRef = useRef<[number, number, number]>(hexToRgb(accentHex));
  const currentRgbRef = useRef<[number, number, number]>(hexToRgb(accentHex));
  const themeRef = useRef<"dark" | "light">(theme);

  useEffect(() => {
    targetRgbRef.current = hexToRgb(accentHex);
  }, [accentHex]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animId = 0;
    const pointer = { x: width * 0.5, y: height * 0.26, active: false };

    const count = Math.min(58, Math.max(28, Math.floor((width * height) / 28000)));
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.24 - 0.05,
      radius: Math.random() * 1.8 + 0.7,
      alpha: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }));

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const onMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });

    let t = 0;
    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      t += 0.007;
      const cur = currentRgbRef.current;
      const tgt = targetRgbRef.current;
      cur[0] += (tgt[0] - cur[0]) * 0.045;
      cur[1] += (tgt[1] - cur[1]) * 0.045;
      cur[2] += (tgt[2] - cur[2]) * 0.045;

      const r = Math.round(cur[0]);
      const g = Math.round(cur[1]);
      const b = Math.round(cur[2]);
      const isDark = themeRef.current === "dark";

      ctx.clearRect(0, 0, width, height);

      // 1. 顶部呼吸极光主星云（随鼠标微视差漂移 + 随业务线无极变色）
      const orb1X =
        width * 0.5 +
        Math.sin(t) * 110 +
        (pointer.active ? (pointer.x - width * 0.5) * 0.1 : 0);
      const orb1Y =
        height * 0.12 +
        Math.cos(t * 0.85) * 45 +
        (pointer.active ? (pointer.y - height * 0.28) * 0.06 : 0);
      const grad1 = ctx.createRadialGradient(
        orb1X,
        orb1Y,
        10,
        orb1X,
        orb1Y,
        Math.max(width * 0.54, 520)
      );
      grad1.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${isDark ? 0.22 : 0.17})`);
      grad1.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${isDark ? 0.08 : 0.06})`);
      grad1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // 2. 右下暖香槟伴生星云与左侧翡翠微晕
      const orb2X = width * 0.84 + Math.cos(t * 0.65) * 80;
      const orb2Y = height * 0.68 + Math.sin(t * 0.9) * 65;
      const grad2 = ctx.createRadialGradient(
        orb2X,
        orb2Y,
        10,
        orb2X,
        orb2Y,
        Math.max(width * 0.4, 390)
      );
      grad2.addColorStop(
        0,
        isDark ? "rgba(230, 190, 138, 0.12)" : "rgba(217, 119, 87, 0.11)"
      );
      grad2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // 3. 光标跟随微柔光晕
      if (pointer.active) {
        const cursorGrad = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          4,
          pointer.x,
          pointer.y,
          240
        );
        cursorGrad.addColorStop(
          0,
          `rgba(${r}, ${g}, ${b}, ${isDark ? 0.075 : 0.055})`
        );
        cursorGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = cursorGrad;
        ctx.fillRect(pointer.x - 240, pointer.y - 240, 480, 480);
      }

      // 4. 星尘微粒运动与物理排斥
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 22500 && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = (150 - dist) / 150;
            p.x += (dx / dist) * force * 0.85;
            p.y += (dy / dist) * force * 0.85;
          }
        }
      }

      // 5. 星轨纤丝连线（近距微粒与鼠标牵引星网）
      const maxDistSq = 135 * 135;
      ctx.lineWidth = 0.65;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const bPt = particles[j];
          const dx = a.x - bPt.x;
          const dy = a.y - bPt.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < maxDistSq) {
            const ratio = 1 - dSq / maxDistSq;
            const lineAlpha = ratio * (isDark ? 0.085 : 0.065);
            ctx.strokeStyle = isDark
              ? `rgba(235, 226, 208, ${lineAlpha.toFixed(3)})`
              : `rgba(${r}, ${g}, ${b}, ${lineAlpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(bPt.x, bPt.y);
            ctx.stroke();
          }
        }
      }

      // 6. 绘制呼吸星尘点
      for (const p of particles) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * 3.2 + p.phase);
        const alpha = p.alpha * twinkle * (isDark ? 1 : 0.62);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(246, 241, 230, ${alpha.toFixed(3)})`
          : `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};
