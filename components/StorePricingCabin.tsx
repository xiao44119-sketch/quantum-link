"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  QrCode, 
  Zap, 
  Clock, 
  X, 
  Copy, 
  MessageSquare
} from "lucide-react";

interface Props {
  onGoToRedeem: (prefix?: string) => void;
}

export const StorePricingCabin: React.FC<Props> = ({ onGoToRedeem }) => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [copiedWeChat, setCopiedWeChat] = useState(false);

  const products = [
    {
      id: "plus",
      title: "ChatGPT Plus",
      sub: "个人主力 · 日常研发",
      badge: "热销 92%",
      badgeColor: "cyan",
      price: "158",
      period: "月卡 / 独立独享",
      prefix: "PH-",
      features: [
        "独享正规官方代开，绝非共享车队",
        "畅享 GPT-4o 顶配模型 & o1-preview 深度推理",
        "支持 DALL-E 3 超清画图 & 高级语音模式",
        "无需提供账号密码，仅凭会话凭证秒级下发",
        "7x24 小时翻车全额秒补 / 售后质保",
      ],
      tagline: "绝大多数个人开发者与创作者的最佳首选",
      isPopular: true,
    },
    {
      id: "pro_5x",
      title: "ChatGPT Pro 5x",
      sub: "算力增强 · 重度写码",
      badge: "高频首选",
      badgeColor: "amber",
      price: "298",
      period: "月卡 / 5倍配额",
      prefix: "PRO5-",
      features: [
        "5 倍于标准版的请求与调用配额",
        "亚太东京 BGP 原生专线极速分发",
        "面向重度 Claude Code / Codex 高频编程人群",
        "独享高速通道，高峰期绝无 429 限流报错",
        "优先专线客服，1对1 技术支持保障",
      ],
      tagline: "适合全职独立开发者与算法工程师的高频调用",
      isPopular: false,
    },
    {
      id: "pro_20x",
      title: "ChatGPT Pro 20x",
      sub: "算力旗舰 · 工业级吞吐",
      badge: "性能天花板",
      badgeColor: "purple",
      price: "688",
      period: "月卡 / 20倍配额",
      prefix: "PRO20SPECIAL-",
      features: [
        "顶格 20 倍工业级调用配额，满血不锁频",
        "海量长上下文超大项目代码库一次性灌入",
        "支持首开全新号与已过期历史老号重激活",
        "VIP 顶级冗余通道，99.9% 极端可用率",
        "专业团队级专属开票与履约保障协议",
      ],
      tagline: "针对创业团队与重度工程集群的算力怪兽",
      isPopular: false,
    },
  ];

  const handleCopyWeChat = () => {
    navigator.clipboard.writeText("AI-ASSIST-VIP");
    setCopiedWeChat(true);
    setTimeout(() => setCopiedWeChat(false), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* 购买收银台/客服弹窗 */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg border border-[var(--line-strong)] bg-[#090e15] p-6 text-white corner-bracket shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[var(--holo)]" />
                <h3 className="font-mono text-base font-bold text-white tracking-wider">
                  专属下单与卡密交付 (ORDER DISPATCH)
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-[var(--fg-muted)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs text-neutral-300">
              <div className="p-3 border border-[var(--line)] bg-black/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 block">选定商品</span>
                  <span className="text-sm font-bold text-white">{selectedProduct.title}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block">结算金额</span>
                  <span className="text-base font-bold text-[var(--warm)]">¥ {selectedProduct.price}</span>
                </div>
              </div>

              {/* 微信二维码与付款说明 */}
              <div className="p-4 border border-[var(--line)] bg-black/40 text-center space-y-3">
                <div className="w-44 h-44 mx-auto p-2 bg-white rounded-sm relative flex items-center justify-center">
                  {/* 模拟二维码或提示 */}
                  <div className="w-full h-full border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-800 p-2">
                    <QrCode className="w-16 h-16 text-neutral-800 mb-1" />
                    <span className="text-[11px] font-bold">微信 / 支付宝扫码下单</span>
                    <span className="text-[9px] text-neutral-500">备注：{selectedProduct.id}</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed">
                  扫码付款后，或添加官方客服微信，人工 / 自动秒发卡密：
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--holo)]/40 bg-cyan-950/30 text-white text-xs">
                  <span>客服微信号: <strong className="text-[var(--holo)]">AI-ASSIST-VIP</strong></span>
                  <button
                    onClick={handleCopyWeChat}
                    className="text-[10px] text-[var(--warm)] hover:underline inline-flex items-center gap-0.5"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedWeChat ? "已复制" : "复制"}
                  </button>
                </div>
              </div>

              <div className="p-3 border-l-2 border-[var(--holo)] bg-cyan-950/20 text-[11px] text-cyan-200">
                💡 <strong>已拿到卡密？</strong> 无需等待客服，直接点击下方切换至【激活终端】，10秒内全自动充值到账。
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  const prefix = selectedProduct.prefix;
                  setSelectedProduct(null);
                  onGoToRedeem(prefix);
                }}
                className="px-4 py-2 border border-[var(--holo)] bg-cyan-950/60 hover:bg-cyan-900 text-white font-bold inline-flex items-center gap-1.5"
              >
                我有卡密，去激活 (GO TO REDEEM)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 border border-neutral-700 text-neutral-400 hover:text-white"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 顶部标语 */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--warm)]/30 bg-amber-950/20 text-[var(--warm)] font-mono text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PRO-GRADE SUBSCRIPTION MATRIX · 原生企业级直通</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
          挑选最适合您工作流的算力配额
        </h2>
        <p className="text-xs sm:text-sm font-mono text-[var(--fg-muted)]">
          所有订阅均由官方原生通道下发，一人一码独立独享，支持随时换设备登录与历史记忆延续。
        </p>
      </div>

      {/* 三列价格卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className={`corner-bracket border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative bg-[#070b12]/90 backdrop-blur-md ${
              p.isPopular
                ? "border-[var(--holo)] shadow-[0_0_35px_rgba(0,212,200,0.18)]"
                : "border-[var(--line)] hover:border-[var(--line-strong)]"
            }`}
          >
            {p.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-widest uppercase px-3 py-0.5 border border-[var(--holo)] bg-[var(--ink)] text-[var(--holo)] font-bold shadow-md">
                MOST POPULAR CHOICE
              </div>
            )}

            <div>
              {/* 卡片头部 */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-mono text-lg font-bold text-white tracking-wide">
                    {p.title}
                  </h3>
                  <span className="text-xs font-mono text-[var(--fg-muted)]">{p.sub}</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 border border-[var(--warm)]/40 bg-amber-950/30 text-[var(--warm)]">
                  {p.badge}
                </span>
              </div>

              {/* 价格 */}
              <div className="my-6 pb-6 border-b border-[var(--line)]">
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-xs text-neutral-400">¥</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    {p.price}
                  </span>
                  <span className="text-xs text-neutral-500 ml-2">/ {p.period}</span>
                </div>
                <p className="text-[11px] font-mono text-cyan-200/70 mt-2">
                  {p.tagline}
                </p>
              </div>

              {/* 特性列表 */}
              <ul className="space-y-3 font-mono text-xs text-neutral-300 mb-8">
                {p.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[var(--holo)] flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 购买按钮 */}
            <div className="space-y-3 pt-4 border-t border-[var(--line)]/60">
              <button
                type="button"
                onClick={() => setSelectedProduct(p)}
                className={`w-full py-3 px-4 font-mono text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 laser-sweeper ${
                  p.isPopular
                    ? "border border-[var(--holo)] bg-cyan-950/60 hover:bg-cyan-900/80 text-white shadow-[0_0_20px_rgba(0,212,200,0.2)]"
                    : "border border-[var(--line-strong)] bg-black/40 hover:bg-neutral-800 text-white"
                }`}
              >
                <span>立即下单获取卡密</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 px-1">
                <span>交付前缀: <strong className="text-[var(--holo)]">{p.prefix}</strong></span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Clock className="w-3 h-3" /> 秒发卡密
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部信任说明 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[var(--line)] font-mono text-xs text-neutral-400 text-center">
        <div className="p-3 border border-[var(--line)] bg-black/40">
          <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-[var(--holo)]" />
          <span className="text-white block font-bold">100% 独立正规订阅</span>
          <span className="text-[10px] text-neutral-500">绝不要求账密，零封号风险</span>
        </div>
        <div className="p-3 border border-[var(--line)] bg-black/40">
          <Zap className="w-4 h-4 mx-auto mb-1 text-[var(--warm)]" />
          <span className="text-white block font-bold">自动化激活秒到账</span>
          <span className="text-[10px] text-neutral-500">凭会话凭证 10 秒下发完成</span>
        </div>
        <div className="p-3 border border-[var(--line)] bg-black/40">
          <MessageSquare className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
          <span className="text-white block font-bold">全程售后质保兜底</span>
          <span className="text-[10px] text-neutral-500">官方 API 接口直联保障</span>
        </div>
      </div>
    </div>
  );
};