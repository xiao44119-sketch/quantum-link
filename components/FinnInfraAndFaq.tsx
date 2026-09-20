"use client";

import React, { useState } from "react";
import { 
  Server, 
  ShieldAlert, 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Sparkles, 
  Zap, 
  Lock, 
  CheckCircle2,
  Terminal,
  MessageSquare,
  Copy,
  Check
} from "lucide-react";

export const FinnInfraAndFaq: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("AI-ASSIST-VIP");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const faqs = [
    {
      q: "为什么代充完全不需要提供账号和密码？",
      a: "传统代充要求买家交出账号密码，存在隐私泄露、异地登录异动触发封控等巨大风险。QuantumLink 采用官方会话凭证 (Session Token) 原生协议，系统仅在内存中安全解构会话签名并调用订阅激活端点，全程绝不接触也不记录您的密码，安全等级达到银行传输标准。"
    },
    {
      q: "如果不小心在 24 小时内重复充值，会白白浪费卡密吗？",
      a: "不会！系统内置严格的「HTTP 409 周期防重碰撞保护算法」。若检测到目标账号在 24 小时内刚完成充值，系统会直接进行硬熔断拒绝，卡密完全不被核销；若在 24小时~30天内，会弹出带有历史充值记录的二次安全确认弹窗，由您知情后自主决定是否覆盖。"
    },
    {
      q: "遇到官方封号或者翻车了怎么处理？",
      a: "所有订阅均走正规海外实体商务卡扣款，一人一卡开票结算，绝不使用低价黑卡、学生包或家庭共享拼车。所有订单均享有完整的 30 天质保兜底，在质保期内如遇任何官方策略异动，联系客服微信号秒级补发新卡或全额退还。"
    },
    {
      q: "拿到卡密后怎么快速开通？",
      a: "在上方导航切换至【02. 自助激活开通】，第一步输入购买收到的卡密（系统会自动识别档位），第二步按指引粘贴 chatgpt.com/api/auth/session 的 JSON，点击提交后，右侧大盘将以全息日志流实时展示调度过程，通常 8~12 秒内即可在官网生效！"
    }
  ];

  return (
    <div className="space-y-16 mt-16 pt-12 border-t border-white/[0.08] font-mono">
      {/* 模块 A：Finn 节点基础设施与网络拓扑 */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-300 font-bold mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 signal-dot" />
              <span>INFRASTRUCTURE TOPOLOGY · 调度底层基础设施</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              高可用独立出海节点与防风控集群
            </h3>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">
            ENGINEERED BY FINN · VIBE CODING LAB
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-lg border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">调度网关</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
            <div className="text-xl font-bold text-white">TOKYO BGP</div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              亚太东京专属软银/IIJ 高质量链路，回国延迟仅 38ms，直连 OpenAI 原生 API 零丢包。
            </p>
          </div>

          <div className="glass-card p-5 rounded-lg border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">出站防封</span>
              <span className="text-[var(--holo)] font-bold">WARP PROXY</span>
            </div>
            <div className="text-xl font-bold text-white">ANYCAST IP</div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              部署 Cloudflare WARP 出站转发，将机房 IP 深度混淆为原生 Anycast 住宅级信誉流量。
            </p>
          </div>

          <div className="glass-card p-5 rounded-lg border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">前置防重</span>
              <span className="text-[var(--warm)] font-bold">24H SHIELD</span>
            </div>
            <div className="text-xl font-bold text-white">409 COLLISION</div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              端到端防重充熔断拦截，杜绝买家误操作导致的卡密浪费与旧订阅时长不可逆覆盖。
            </p>
          </div>

          <div className="glass-card p-5 rounded-lg border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">隐式缓存</span>
              <span className="text-purple-300 font-bold">95.1% HIT</span>
            </div>
            <div className="text-xl font-bold text-white">ZERO DELAY</div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              跨账号会话隐式前缀缓存技术，大幅缩短会话校验用时，P50 履约交付耗时压至 3.36 秒。
            </p>
          </div>
        </div>
      </div>

      {/* 模块 B：Finn 开发者常见问题 FAQ */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-950/20 text-cyan-300 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>KNOWLEDGE BASE · 极客问答与技术透明</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            关于订阅履约，您可能想了解的细节
          </h3>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="glass-card border border-white/[0.08] rounded-lg overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-white hover:text-cyan-300 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-[var(--holo)] font-mono text-xs">0{idx + 1}.</span>
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-neutral-300 leading-relaxed border-t border-white/[0.04] bg-black/20">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 模块 C：Finn 个人独立实验室签名卡（彻底去除 GitHub 源码链接，改为商业级官方客服） */}
      <div className="glass-card corner-bracket p-6 sm:p-8 rounded-lg border border-cyan-400/20 bg-gradient-to-r from-cyan-950/30 via-[#070d16]/80 to-amber-950/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-[11px] text-[var(--warm)] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>骁清 FINN · VIBE CODER & INDIE LAB</span>
          </div>
          <h4 className="text-base sm:text-lg font-bold text-white tracking-wide">
            “做点有意思的东西，为爱我的人祈福挡灾。”
          </h4>
          <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
            QuantumLink 系 Finn 个人全栈独立研发的 AI 神经订阅履约节点。拒绝中间商暴利与黑卡劣质车队，以工程师的标准打磨每一个交付细节。
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-full border border-[var(--holo)] bg-cyan-950/60 hover:bg-cyan-900 text-xs text-white transition-all inline-flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,216,0.2)] font-bold"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[var(--holo)]" />
            <span>{copied ? "微信号已复制！" : "官方微信: AI-ASSIST-VIP"}</span>
            {copied && <Check className="w-3 h-3 text-emerald-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};