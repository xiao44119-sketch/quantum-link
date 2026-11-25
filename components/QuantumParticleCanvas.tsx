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
  // Current 3D position
  x: number;
  y: number;
  z: number;
  // Velocity
  vx: number;
  vy: number;
  vz: number;
  // Parametric seeds [0..1]
  u: number;
  v: number;
  w: number;
  // Visual traits
  size: number;
  alpha: number;
  tintMix: number; // 0 = primary accent, 1 = ice/silver
  isOuterDust: boolean;
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
  const num = parseInt(full || "38bdf8", 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function makeGlowSprite(r: number, g: number, b: number, isDark: boolean): HTMLCanvasElement {
  const size = 48;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  if (isDark) {
    grad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
    grad.addColorStop(0.11, `rgba(${r}, ${g}, ${b}, 0.88)`);
    grad.addColorStop(0.32, `rgba(${r}, ${g}, ${b}, 0.22)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  } else {
    grad.addColorStop(0, `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 20)}, 0.9)`);
    grad.addColorStop(0.22, `rgba(${r}, ${g}, ${b}, 0.34)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/**
 * 3D 动态虚拟粒子力场引擎 (Quantum Torus Collapse + Magnetic Fluid Curl + Shockwave)
 * - 0.0s ~ 1.05s: 深空漩涡引力坍缩成 3D 倾角量子星环
 * - 1.05s: 自动释放全息脉冲冲击波，舒展为常驻可交互 3D 粒子场
 * - 鼠标物理：3D 磁流体斥力推开 + 切向漩涡牵引 + 近距高光激发
 * - 点击物理：任意位置点击释放 3D 扩散冲击波涟漪
 */
export const QuantumParticleCanvas: React.FC<Props> = ({
  accentHex = "#38BDF8",
  secondaryHex = "#818CF8",
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

    // Adaptive particle count: ~2100 on desktop, ~1050 on mobile for locked 60-120fps
    const isMobile = width < 768;
    const PARTICLE_COUNT = isMobile ? 1050 : 2200;

    // Initialize particles scattered in deep outer vortex for dramatic entrance implosion
    const particles: Particle3D[] = Array.from({ length: PARTICLE_COUNT }, (_, idx) => {
      const u = idx / PARTICLE_COUNT;
      const v = ((idx * 0.61803398875) % 1);
      const w = Math.random();
      const spawnAngle = u * Math.PI * 12 + (Math.random() - 0.5) * 0.8;
      const spawnRadius = 850 + Math.random() * 1350;
      const sx = Math.cos(spawnAngle) * spawnRadius;
      const sy = Math.sin(spawnAngle) * spawnRadius * 0.72;
      const sz = (Math.random() - 0.5) * 1400 + 450;

      // Initial tangential swirl velocity
      return {
        x: sx,
        y: sy,
        z: sz,
        vx: -Math.sin(spawnAngle) * 18,
        vy: Math.cos(spawnAngle) * 14,
        vz: -16,
        u,
        v,
        w,
        size: Math.random() * 1.9 + (idx % 9 === 0 ? 2.1 : 0.85),
        alpha: Math.random() * 0.58 + 0.28,
        tintMix: idx % 3 === 0 ? 0.85 : Math.random() * 0.55,
        isOuterDust: idx >= PARTICLE_COUNT * 0.78,
      };
    });

    const pointer = {
      x: width * 0.5,
      y: height * 0.34,
      vx: 0,
      vy: 0,
      prevX: width * 0.5,
      prevY: height * 0.34,
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
        radius: 8,
        maxRadius: Math.max(width, height) * 0.48,
        alpha: 0.55,
      });
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    // Cached glow sprites regenerated only when RGB/theme noticeably shifts
    let spritePrimary = makeGlowSprite(56, 189, 248, themeRef.current === "dark");
    let spriteSecondary = makeGlowSprite(129, 140, 248, themeRef.current === "dark");
    let spriteIce = makeGlowSprite(226, 232, 240, themeRef.current === "dark");
    let lastSpriteKey = "";

    const startTime = performance.now();
    let animId = 0;

    const render = (now: number) => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      const elapsed = (now - startTime) * 0.001; // seconds
      const isDark = themeRef.current === "dark";

      // Smoothly interpolate primary brand RGB
      const cur = currentPrimaryRef.current;
      const tgt = targetPrimaryRef.current;
      cur[0] += (tgt[0] - cur[0]) * 0.06;
      cur[1] += (tgt[1] - cur[1]) * 0.06;
      cur[2] += (tgt[2] - cur[2]) * 0.06;
      const r = Math.round(cur[0]);
      const g = Math.round(cur[1]);
      const b = Math.round(cur[2]);
      const [sr, sg, sb] = secondaryRgbRef.current;

      // Refresh cached glow sprites if quantized color or theme changed
      const spriteKey = `${r >> 2}_${g >> 2}_${b >> 2}_${sr >> 2}_${isDark ? 1 : 0}`;
      if (spriteKey !== lastSpriteKey) {
        spritePrimary = makeGlowSprite(r, g, b, isDark);
        spriteSecondary = makeGlowSprite(sr, sg, sb, isDark);
        spriteIce = makeGlowSprite(
          isDark ? 241 : 71,
          isDark ? 245 : 85,
          isDark ? 249 : 105,
          isDark
        );
        lastSpriteKey = spriteKey;
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width, height);

      // Center stage coordinates (upper-hero focal point)
      const cx = width * 0.5;
      const cy = Math.min(height * 0.34, 310);

      // Entrance choreography envelope:
      // 0.0s -> 1.02s: Tight singularity torus compression (scale 0.58)
      // 1.02s: Automatic pulse shockwave + smooth expansion to 1.0
      let formationScale = 1.0;
      if (elapsed < 1.02) {
        const p = elapsed / 1.02;
        formationScale = 0.52 + 0.14 * Math.sin(p * Math.PI);
      } else if (!entranceBurstFired) {
        entranceBurstFired = true;
        shockwaves.push({
          x: cx,
          y: cy,
          radius: 24,
          maxRadius: Math.max(width, height) * 0.68,
          alpha: 0.65,
        });
      }
      if (elapsed >= 1.02 && elapsed < 2.2) {
        const ep = Math.min(1, (elapsed - 1.02) / 1.18);
        const easeOut = 1 - Math.pow(1 - ep, 3);
        formationScale = 0.58 + 0.42 * easeOut;
      }

      // Deep ambient volumetric glow behind the 3D core
      const coreGlow = ctx.createRadialGradient(
        cx + (pointer.active ? (pointer.x - cx) * 0.06 : 0),
        cy + (pointer.active ? (pointer.y - cy) * 0.05 : 0),
        10,
        cx,
        cy,
        Math.max(width * 0.48, 460)
      );
      coreGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${isDark ? 0.16 : 0.11})`);
      coreGlow.addColorStop(0.45, `rgba(${sr}, ${sg}, ${sb}, ${isDark ? 0.06 : 0.04})`);
      coreGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, width, height);

      // 3D rotation angles (gentle mouse parallax + continuous orbital spin)
      const mouseTiltX = pointer.active ? ((pointer.y - cy) / height) * 0.28 : 0;
      const mouseTiltY = pointer.active ? ((pointer.x - cx) / width) * 0.34 : 0;

      const rotSpin = elapsed < 1.05 ? elapsed * 2.1 : 2.205 + (elapsed - 1.05) * 0.24;
      const pitch = 0.98 + mouseTiltX; // Tilted Saturn/Torus angle
      const roll = -0.24 + mouseTiltY * 0.5;

      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const cosR = Math.cos(roll);
      const sinR = Math.sin(roll);

      const fov = 560;
      const camZ = 720;
      const baseRadius = Math.min(width * 0.31, 330) * formationScale;
      const mode = formationRef.current;

      // Update shockwaves
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s];
        sw.radius += (sw.maxRadius - sw.radius) * 0.075 + 6;
        sw.alpha *= 0.945;
        if (sw.alpha < 0.012 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(s, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(sw.alpha * (isDark ? 0.55 : 0.35)).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Additive glow blending for luminous virtual particles in dark mode
      ctx.globalCompositeOperation = isDark ? "lighter" : "source-over";

      const springK = elapsed < 1.08 ? 0.072 : 0.044;
      const damping = elapsed < 1.08 ? 0.82 : 0.87;

      // Decay pointer velocity smoothly
      pointer.vx *= 0.85;
      pointer.vy *= 0.85;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];

        // Compute target 3D manifold coordinates (mx, my, mz)
        let mx = 0;
        let my = 0;
        let mz = 0;

        if (p.isOuterDust) {
          // Deep space orbital dust field
          const angle = p.u * Math.PI * 2 + rotSpin * 0.35;
          const dist = baseRadius * (1.45 + p.w * 1.45);
          mx = Math.cos(angle) * dist;
          mz = Math.sin(angle) * dist;
          my = (p.v - 0.5) * 420;
        } else if (mode === "torus") {
          // 3D Quantum Twisted Torus (Saturn / Tokamak magnetic field lines)
          const theta = p.u * Math.PI * 2 + rotSpin;
          const phi = p.v * Math.PI * 2 * 3 + theta * 2 + elapsed * 0.55;
          const tubeR = baseRadius * (0.26 + 0.08 * Math.sin(p.w * Math.PI * 2));
          const ringR = baseRadius + Math.cos(phi) * tubeR;
          mx = Math.cos(theta) * ringR;
          mz = Math.sin(theta) * ringR;
          my = Math.sin(phi) * tubeR;
        } else if (mode === "helix") {
          // Dual Neural Helix Ribbon for 7-in-1 Activation Studio
          const strand = i % 2 === 0 ? 0 : Math.PI;
          const span = (p.u - 0.5) * Math.min(width * 0.78, 860);
          const waveAngle = p.u * Math.PI * 5 + elapsed * 0.9 + strand;
          const helixR = 88 + p.w * 42;
          mx = span;
          my = Math.sin(waveAngle) * helixR;
          mz = Math.cos(waveAngle) * helixR;
        } else {
          // Geodesic Fibonacci Sphere for Encrypted Vault Query
          const yNorm = 1 - 2 * p.u;
          const radAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
          const lon = i * 2.39996323 + rotSpin * 0.85;
          const sphR = baseRadius * 0.86 * (0.94 + 0.08 * p.w);
          mx = Math.cos(lon) * radAtY * sphR;
          my = yNorm * sphR;
          mz = Math.sin(lon) * radAtY * sphR;
        }

        // Apply 3D pitch & roll rotation to target manifold
        const y1 = my * cosP - mz * sinP;
        const z1 = my * sinP + mz * cosP;
        const tx = mx * cosR - y1 * sinR;
        const ty = mx * sinR + y1 * cosR;
        const tz = z1;

        // Spring acceleration toward target 3D formation
        p.vx += (tx - p.x) * springK;
        p.vy += (ty - p.y) * springK;
        p.vz += (tz - p.z) * springK;

        // Project current 3D position to 2D screen space for cursor/shockwave physics
        const depth = camZ + p.z;
        if (depth > 40) {
          const scale = fov / depth;
          const sx = cx + p.x * scale;
          const sy = cy + p.y * scale;

          // Cursor Magnetic Fluid Force (Repulsion + Tangential Curl Swirl)
          let cursorBoost = 0;
          if (pointer.active) {
            const dx = sx - pointer.x;
            const dy = sy - pointer.y;
            const dSq = dx * dx + dy * dy;
            const influenceR = 175;
            if (dSq < influenceR * influenceR && dSq > 0.5) {
              const dist = Math.sqrt(dSq);
              const ratio = 1 - dist / influenceR;
              const force = ratio * ratio * 5.2;
              const nx = dx / dist;
              const ny = dy / dist;
              // Radial fluid push + tangential vortex curl + pointer momentum drag
              p.vx += (nx * force - ny * force * 0.48 + pointer.vx * ratio * 0.14) / scale;
              p.vy += (ny * force + nx * force * 0.48 + pointer.vy * ratio * 0.14) / scale;
              p.vz -= ratio * 3.2;
              cursorBoost = ratio;
            }
          }

          // Shockwave radial impulse
          for (let s = 0; s < shockwaves.length; s++) {
            const sw = shockwaves[s];
            const dx = sx - sw.x;
            const dy = sy - sw.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const band = Math.abs(dist - sw.radius);
            if (band < 48 && dist > 1) {
              const waveForce = (1 - band / 48) * sw.alpha * 9.5;
              p.vx += ((dx / dist) * waveForce) / scale;
              p.vy += ((dy / dist) * waveForce) / scale;
              p.vz -= waveForce * 0.6;
              cursorBoost = Math.max(cursorBoost, (1 - band / 48) * sw.alpha);
            }
          }

          // Integrate velocity
          p.vx *= damping;
          p.vy *= damping;
          p.vz *= damping;
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;

          // Final screen projection & depth-of-field alpha
          const newDepth = camZ + p.z;
          if (newDepth > 50) {
            const pScale = fov / newDepth;
            const drawX = cx + p.x * pScale;
            const drawY = cy + p.y * pScale;

            if (drawX > -40 && drawX < width + 40 && drawY > -40 && drawY < height + 40) {
              const depthFade = Math.min(1.1, Math.max(0.15, (1150 - newDepth) / 740));
              const drawRadius = p.size * pScale * (1 + cursorBoost * 0.75) * 1.75;
              const finalAlpha = Math.min(
                0.88,
                p.alpha * depthFade * (isDark ? 0.56 : 0.48) + cursorBoost * 0.42
              );

              ctx.globalAlpha = finalAlpha;
              const sprite =
                cursorBoost > 0.25
                  ? spriteIce
                  : p.tintMix > 0.72
                    ? spriteIce
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
