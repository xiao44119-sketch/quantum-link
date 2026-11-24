"use client";

import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Zap, Radio, Globe, Terminal } from "lucide-react";

export const LiveActivityFeed: React.FC = () => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" }) + " CST"
      );
    };
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  const mockFeeds = [
    { time: "8秒前", card: "PH-****-8812", product: "ChatGPT Plus", node: "TOKYO-01", status: "下发成功" },
    { time: "26秒前", card: "PRO5-****-9104", product: "Claude Pro 尊享月卡", node: "TOKYO-02", status: "极速秒开" },
    { time: "1分钟前", card: "PRO20-****-0321", product: "ChatGPT Pro 20x", node: "WARP-ANYCAST", status: "满血激活" },
    { time: "2分钟前", card: "PH-****-4419", product: "ChatGPT Plus", node: "TOKYO-01", status: "下发成功" },
  ];

  return (
    <div className="w-full border-y border-white/[0.06] bg-black/40 backdrop-blur-md py-2.5 px-4 sm:px-8 font-mono text-[11px] text-neutral-400 flex flex-col md:flex-row items-center justify-between gap-3 relative z-20">
      {/* 左侧：实时节点指标与 Finn 青岛时钟 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-[var(--holo)] signal-dot" />
          <span>FINN LAB · QINGDAO</span>
          <span className="text-neutral-500 font-normal ml-1">[{currentTime || "SYNCING..."}]</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-neutral-400 border-l border-white/10 pl-4">
          <span className="flex items-center gap-1 text-[10px]">
            <Globe className="w-3 h-3 text-[var(--warm)]" />
            <span>出口: CF WARP ANYCAST</span>
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>延迟: 38ms (东京直连)</span>
          </span>
        </div>
      </div>

      {/* 右侧：实时滚动的出单脉冲 */}
      <div className="flex items-center gap-3 overflow-hidden text-[10px]">
        <span className="text-neutral-500 flex items-center gap-1">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>实时履约脉冲:</span>
        </span>
        <div className="flex items-center gap-4 text-neutral-300">
          <span className="text-emerald-400 font-medium">
            ● 8秒前 [PLS-****8812] ChatGPT Plus 下发完毕
          </span>
          <span className="hidden lg:inline text-neutral-400">
            | 21秒前 [GSTU-****9104] Gemini 学生认证通过
          </span>
          <span className="hidden xl:inline text-neutral-400">
            | 1分钟前 [P10X-****0321] Pro 10x 无损直升完成
          </span>
        </div>
      </div>
    </div>
  );
};