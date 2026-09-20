"use client";

import React, { useState, useEffect } from "react";
import { TelemetryHeader } from "@/components/TelemetryHeader";
import { ProductShowcase } from "@/components/ProductShowcase";
import { FulfillmentConsole } from "@/components/FulfillmentConsole";
import { 
  ShieldAlert, 
  Cpu, 
  Layers, 
  Activity, 
  Terminal, 
  Key, 
  Radio, 
  ExternalLink 
} from "lucide-react";

export default function Home() {
  const [activePrefix, setActivePrefix] = useState<string>("");
  const [activeTaskCount, setActiveTaskCount] = useState<number>(0);
  const [engineMode, setEngineMode] = useState<string>("SANDBOX_SIMULATION");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.mode) {
          setEngineMode(data.mode);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#05070a] text-[#eaf8f7] relative selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* 视觉全息层 */}
      <div className="screen-lines" />
      <div className="hud-grid" />

      {/* 顶部指标监视器 */}
      <TelemetryHeader mode={engineMode} activeTaskCount={activeTaskCount} />

      {/* 主界面内容 */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Hero 仪式标语区 */}
        <div className="corner-bracket border border-[var(--line)] bg-[#070d16]/70 p-6 sm:p-8 backdrop-blur-md mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--warm)] tracking-widest uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[var(--warm)] signal-dot" />
                <span>NEURAL SUBSCRIPTION DISPATCH PROTOCOL</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-mono text-white">
                QUANTUM LINK · 量子链路
              </h1>
              <p className="text-xs sm:text-sm font-mono text-[var(--fg-muted)] mt-2 max-w-2xl leading-relaxed">
                面向高强度开发者的 ChatGPT Plus / Pro 自动化极速履约系统。卡密前缀智能分流、Session 签名脱敏、24H 周期防重保护与端到端状态机可视化追踪。
              </p>
            </div>

            {/* 核心能力数据条 */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 font-mono text-center border-t md:border-t-0 md:border-l border-[var(--line)] pt-4 md:pt-0 md:pl-6">
              <div className="p-2 border border-[var(--line)] bg-black/40">
                <span className="block text-base sm:text-xl font-bold text-[var(--holo)]">99.88%</span>
                <span className="text-[10px] text-neutral-500">PROVISION RATE</span>
              </div>
              <div className="p-2 border border-[var(--line)] bg-black/40">
                <span className="block text-base sm:text-xl font-bold text-[var(--warm)]">3.36s</span>
                <span className="text-[10px] text-neutral-500">P50 LATENCY</span>
              </div>
              <div className="p-2 border border-[var(--line)] bg-black/40">
                <span className="block text-base sm:text-xl font-bold text-emerald-400">95.1%</span>
                <span className="text-[10px] text-neutral-500">CACHE HIT</span>
              </div>
            </div>
          </div>
        </div>

        {/* 套餐支持矩阵 */}
        <ProductShowcase
          activePrefix={activePrefix}
          onSelectSampleCode={(prefix) => setActivePrefix(prefix)}
        />

        {/* 核心兑换与状态控制台 */}
        <FulfillmentConsole
          presetPrefix={activePrefix}
          onTaskChange={(count) => setActiveTaskCount(count)}
        />

        {/* 架构与技术指标说明区 */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 border border-[var(--line)] bg-[#070b12]/80 corner-bracket">
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>409 周期防重充保护机制</span>
            </div>
            <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
              严格遵循 ChatGPT 订阅不可叠加特性。24h 内二次充值强制熔断；24h~30天内检测历史记录触发二次安全确认，杜绝卡密浪费与时长覆盖事故。
            </p>
          </div>

          <div className="p-4 border border-[var(--line)] bg-[#070b12]/80 corner-bracket">
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <Key className="w-4 h-4 text-[var(--holo)]" />
              <span>前缀识别自动定档 (PREFIX BOUND)</span>
            </div>
            <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
              调用端无需也不应手动选择套餐档位。后端通过 PH-、PRO5-、PRO20SPECIAL- 前缀硬编码隔离，杜绝误操作扣卡风险。
            </p>
          </div>

          <div className="p-4 border border-[var(--line)] bg-[#070b12]/80 corner-bracket">
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>5 阶段异步履约状态机</span>
            </div>
            <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
              入列 (QUEUED) → 会话签名校验 (VERIFYING) → 专线调度 (DISPATCHING) → 原生下发 (PROVISIONING) → 凭证就绪 (COMPLETED) 全程透明。
            </p>
          </div>
        </section>

        {/* 页脚 */}
        <footer className="mt-16 pt-8 border-t border-[var(--line)]/60 flex flex-col sm:flex-row items-center justify-between font-mono text-xs text-neutral-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--holo)]" />
            <span>QUANTUM LINK PROTOCOL · FOR DEVELOPER ECOSYSTEM</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>ENGINE: NEXT.JS 14+ APP ROUTER</span>
            <span>UPSTREAM: SUZHE.AI V1</span>
          </div>
        </footer>
      </main>
    </div>
  );
}