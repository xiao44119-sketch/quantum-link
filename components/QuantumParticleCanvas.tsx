"use client";

import React, { useEffect, useRef } from "react";

export type ParticleFormation = "torus" | "helix" | "sphere";

interface Props {
  accentHex?: string;
  secondaryHex?: string;
  theme?: "dark" | "light";
  formation?: ParticleFormation;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  u: number;
  v: number;
  w: number;
  size: number;
  alpha: number;
  tintMix: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full || "fb5123", 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function makePinpointSprite(r: number, g: number, b: number, isDark: boolean): HTMLCanvasElement {
  const size = 32;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  if (isDark) {
    grad.addColorStop(0, "rgba(255, 255, 255, 0.92)");
    grad.addColorStop(0.16, `rgba(${r}, ${g}, ${b}, 0.72)`);
    grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.12)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  } else {
    grad.addColorStop(0, `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 30)}, 0.78)`);
    grad.addColorStop(0.26, `rgba(${r}, ${g}, ${b}, 0.28)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/**
 * QuantumLink V5 · VidMuse 电影级克制粒子力场引擎
 * - 0.0s ~ 1.1s：1,400 颗锐利微光子从深空旋转坍缩成 3D 倾角星环（高定入场特效）
 * - 1.1s+：轻脉冲自动向外缘广域轨道退让舒展，中心文字安全区自动衰减至极低亮度，彻底告别雪花脏屏！
 * - 左右两侧渲染 VidMuse 同款电影棚边缘氛围暗角光（随当前选中 AI 品牌无极变色）
 * - 保留丝滑鼠标磁流体涡旋与点击冲击波交互
 */
export const QuantumParticleCanvas: React.FC<Props> = ({
  accentHex = "#FB5123",
  secondaryHex = "#E4B274",
  theme = "dark",
  formation = "torus",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetPrimaryRef = useRef<[number, number, number]>(hexToRgb(accentHex));
  const currentPrimaryRef = useRef<[number, number, number]>(hexToRgb(accentHex));
  const secondaryRgbRef = useRef<[number, number, number]>(hexToRgb(secondaryHex));
  const themeRef = useRef<"dark" | "light">(theme);
  const formationRef = useRef<ParticleFormation>(formation);

  useEffect(() => {
    targetPrimaryRef.current = hexToRgb(accentHex);
  }, [accentHex]);

  useEffect(() => {
    secondaryRgbRef.current = hexToRgb(secondaryHex);
  }, [secondaryHex]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    formationRef.current = formation;
  }, [formation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const isMobile = width < 768;
    const PARTICLE_COUNT = isMobile ? 680 : 1450;

    // 初始散落在深空外圈，呈现极具电影空间感的旋聚开场
    const particles: Particle3D[] = Array.from({ length: PARTICLE_COUNT }, (_, idx) => {
      const u = idx / PARTICLE_COUNT;
      const v = (idx * 0.61803398875) % 1;
      const w = Math.random();
      const angle = u * Math.PI * 10 + (Math.random() - 0.5) * 0.6;
      const dist = 780 + Math.random() * 1150;
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.68,
        z: (Math.random() - 0.5) * 1100 + 360,
        vx: -Math.sin(angle) * 15,
        vy: Math.cos(angle) * 11,
        vz: -14,
        u,
        v,
        w,
        size: Math.random() * 1.15 + 0.55,
        alpha: Math.random() * 0.45 + 0.25,
        tintMix: idx % 3 === 0 ? 0.82 : Math.random() * 0.55,
      };
    });

    const pointer = {
      x: width * 0.5,
      y: height * 0.35,
      vx: 0,
      vy: 0,
      prevX: width * 0.5,
      prevY: height * 0.35,
      active: false,
    };

    const shockwaves: Shockwave[] = [];
    let entranceBurstFired = false;

    const onPointerMove = (e: PointerEvent) => {
      pointer.vx = e.clientX - pointer.prevX;
      pointer.vy = e.clientY - pointer.prevY;
      pointer.prevX = e.clientX;
      pointer.prevY = e.clientY;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };

    const onPointerDown = (e: PointerEvent) => {
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 6,
        maxRadius: Math.max(width, height) * 0.42,
        alpha: 0.42,
      });
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    let spritePrimary = makePinpointSprite(251, 81, 35, themeRef.current === "dark");
    let spriteSecondary = makePinpointSprite(228, 178, 116, themeRef.current === "dark");
    let spriteNeutral = makePinpointSprite(235, 238, 245, themeRef.current === "dark");
    let lastSpriteKey = "";

    const startTime = performance.now();
    let animId = 0;

    const render = (now: number) => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      const elapsed = (now - startTime) * 0.001;
      const isDark = themeRef.current === "dark";

      const cur = currentPrimaryRef.current;
      const tgt = targetPrimaryRef.current;
      cur[0] += (tgt[0] - cur[0]) * 0.055;
      cur[1] += (tgt[1] - cur[1]) * 0.055;
      cur[2] += (tgt[2] - cur[2]) * 0.055;
      const r = Math.round(cur[0]);
      const g = Math.round(cur[1]);
      const b = Math.round(cur[2]);
      const [sr, sg, sb] = secondaryRgbRef.current;

      const spriteKey = `${r >> 2}_${g >> 2}_${b >> 2}_${sr >> 2}_${isDark ? 1 : 0}`;
      if (spriteKey !== lastSpriteKey) {
        spritePrimary = makePinpointSprite(r, g, b, isDark);
        spriteSecondary = makePinpointSprite(sr, sg, sb, isDark);
        spriteNeutral = makePinpointSprite(
          isDark ? 236 : 78,
          isDark ? 240 : 82,
          isDark ? 248 : 92,
          isDark
        );
        lastSpriteKey = spriteKey;
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width, height);

      // 1. VidMuse 同款电影棚左右双侧氛围泛光（绝不在正文背后制造浑浊大亮斑）
      const leftWash = ctx.createRadialGradient(
        -width * 0.06,
        height * 0.45,
        10,
        -width * 0.06,
        height * 0.45,
        Math.max(width * 0.44, 420)
      );
      leftWash.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${isDark ? 0.2 : 0.08})`);
      leftWash.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${isDark ? 0.05 : 0.02})`);
      leftWash.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = leftWash;
      ctx.fillRect(0, 0, width, height);

      const rightWash = ctx.createRadialGradient(
        width * 1.05,
        height * 0.56,
        10,
        width * 1.05,
        height * 0.56,
        Math.max(width * 0.42, 400)
      );
      rightWash.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${isDark ? 0.17 : 0.07})`);
      rightWash.addColorStop(0.55, `rgba(${sr}, ${sg}, ${sb}, ${isDark ? 0.05 : 0.02})`);
      rightWash.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rightWash;
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.46;

      // 入场 0.0s ~ 1.05s 凝聚星环 -> 1.05s 脉冲向屏幕外缘广域轨道优雅退让
      let ringScale = 1.0;
      let quietZoneStrength = 0; // 0 during intro ring, eases to 1 so text stays 100% clean
      if (elapsed < 1.05) {
        const p = elapsed / 1.05;
        ringScale = 0.46 + 0.1 * Math.sin(p * Math.PI);
        quietZoneStrength = 0.15;
      } else if (!entranceBurstFired) {
        entranceBurstFired = true;
        shockwaves.push({
          x: cx,
          y: height * 0.36,
          radius: 18,
          maxRadius: Math.max(width, height) * 0.62,
          alpha: 0.45,
        });
      }
      if (elapsed >= 1.05 && elapsed < 2.25) {
        const ep = Math.min(1, (elapsed - 1.05) / 1.2);
        const easeOut = 1 - Math.pow(1 - ep, 3);
        ringScale = 0.52 + 0.86 * easeOut; // 退让到宽阔外环
        quietZoneStrength = 0.15 + 0.85 * easeOut;
      } else if (elapsed >= 2.25) {
        ringScale = 1.38;
        quietZoneStrength = 1.0;
      }

      // 脉冲涟漪细环
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s];
        sw.radius += (sw.maxRadius - sw.radius) * 0.07 + 5;
        sw.alpha *= 0.94;
        if (sw.alpha < 0.012 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(s, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(sw.alpha * (isDark ? 0.42 : 0.25)).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      const mouseTiltX = pointer.active ? ((pointer.y - cy) / height) * 0.18 : 0;
      const mouseTiltY = pointer.active ? ((pointer.x - cx) / width) * 0.24 : 0;
      const rotSpin = elapsed < 1.08 ? elapsed * 2.0 : 2.16 + (elapsed - 1.08) * 0.16;
      const pitch = 1.05 + mouseTiltX;
      const roll = -0.18 + mouseTiltY * 0.45;
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const cosR = Math.cos(roll);
      const sinR = Math.sin(roll);

      const fov = 560;
      const camZ = 760;
      const baseRadius = Math.min(width * 0.34, 380) * ringScale;
      const mode = formationRef.current;

      ctx.globalCompositeOperation = isDark ? "lighter" : "source-over";
      const springK = elapsed < 1.1 ? 0.07 : 0.04;
      const damping = elapsed < 1.1 ? 0.82 : 0.88;

      pointer.vx *= 0.84;
      pointer.vy *= 0.84;

      // 中心阅读静谧区半径（避免白斑挡住主标题和展台文字）
      const quietRx = Math.min(width * 0.38, 460);
      const quietRy = Math.min(height * 0.36, 300);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        let mx = 0;
        let my = 0;
        let mz = 0;

        if (mode === "torus") {
          const theta = p.u * Math.PI * 2 + rotSpin;
          const phi = p.v * Math.PI * 2 * 2 + theta * 2 + elapsed * 0.4;
          const tubeR = baseRadius * (0.16 + 0.08 * p.w);
          const ringR = baseRadius + Math.cos(phi) * tubeR;
          mx = Math.cos(theta) * ringR;
          mz = Math.sin(theta) * ringR;
          my = Math.sin(phi) * tubeR;
        } else if (mode === "helix") {
          const strand = i % 2 === 0 ? 0 : Math.PI;
          const span = (p.u - 0.5) * Math.min(width * 0.86, 980);
          const waveAngle = p.u * Math.PI * 4.5 + elapsed * 0.75 + strand;
          const helixR = 76 + p.w * 34;
          mx = span;
          my = Math.sin(waveAngle) * helixR;
          mz = Math.cos(waveAngle) * helixR;
        } else {
          const yNorm = 1 - 2 * p.u;
          const radAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
          const lon = i * 2.39996323 + rotSpin * 0.7;
          const sphR = baseRadius * 0.78 * (0.94 + 0.06 * p.w);
          mx = Math.cos(lon) * radAtY * sphR;
          my = yNorm * sphR;
          mz = Math.sin(lon) * radAtY * sphR;
        }

        const y1 = my * cosP - mz * sinP;
        const z1 = my * sinP + mz * cosP;
        const tx = mx * cosR - y1 * sinR;
        const ty = mx * sinR + y1 * cosR;
        const tz = z1;

        p.vx += (tx - p.x) * springK;
        p.vy += (ty - p.y) * springK;
        p.vz += (tz - p.z) * springK;

        const depth = camZ + p.z;
        if (depth > 40) {
          const scale = fov / depth;
          const sx = cx + p.x * scale;
          const sy = cy + p.y * scale;

          let cursorBoost = 0;
          if (pointer.active) {
            const dx = sx - pointer.x;
            const dy = sy - pointer.y;
            const dSq = dx * dx + dy * dy;
            const influenceR = 160;
            if (dSq < influenceR * influenceR && dSq > 0.5) {
              const dist = Math.sqrt(dSq);
              const ratio = 1 - dist / influenceR;
              const force = ratio * ratio * 4.6;
              const nx = dx / dist;
              const ny = dy / dist;
              p.vx += (nx * force - ny * force * 0.45 + pointer.vx * ratio * 0.12) / scale;
              p.vy += (ny * force + nx * force * 0.45 + pointer.vy * ratio * 0.12) / scale;
              p.vz -= ratio * 2.8;
              cursorBoost = ratio;
            }
          }

          for (let s = 0; s < shockwaves.length; s++) {
            const sw = shockwaves[s];
            const dx = sx - sw.x;
            const dy = sy - sw.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const band = Math.abs(dist - sw.radius);
            if (band < 42 && dist > 1) {
              const waveForce = (1 - band / 42) * sw.alpha * 8.2;
              p.vx += ((dx / dist) * waveForce) / scale;
              p.vy += ((dy / dist) * waveForce) / scale;
              cursorBoost = Math.max(cursorBoost, (1 - band / 42) * sw.alpha);
            }
          }

          p.vx *= damping;
          p.vy *= damping;
          p.vz *= damping;
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;

          const newDepth = camZ + p.z;
          if (newDepth > 50) {
            const pScale = fov / newDepth;
            const drawX = cx + p.x * pScale;
            const drawY = cy + p.y * pScale;

            if (drawX > -24 && drawX < width + 24 && drawY > -24 && drawY < height + 24) {
              // 计算中心静谧区衰减：让标题与展台区保持极致干净清晰，外围粒子精致闪烁
              const qx = (drawX - cx) / quietRx;
              const qy = (drawY - height * 0.34) / quietRy;
              const qDist = Math.sqrt(qx * qx + qy * qy);
              const quietAttenuation =
                qDist < 1.0
                  ? 1 - quietZoneStrength * (1 - qDist * qDist) * 0.84
                  : 1.0;

              const depthFade = Math.min(1.0, Math.max(0.18, (1180 - newDepth) / 760));
              const drawRadius = p.size * pScale * (1 + cursorBoost * 0.65) * 1.45;
              const finalAlpha = Math.min(
                0.78,
                (p.alpha * depthFade * (isDark ? 0.54 : 0.42) * quietAttenuation) +
                  cursorBoost * 0.36
              );

              if (finalAlpha > 0.025) {
                ctx.globalAlpha = finalAlpha;
                const sprite =
                  cursorBoost > 0.28
                    ? spriteNeutral
                    : p.tintMix > 0.7
                      ? spriteNeutral
                      : p.tintMix > 0.38
                        ? spriteSecondary
                        : spritePrimary;

                ctx.drawImage(
                  sprite,
                  drawX - drawRadius,
                  drawY - drawRadius,
                  drawRadius * 2,
                  drawRadius * 2
                );
              }
            }
          }
        } else {
          p.z += 12;
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
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
