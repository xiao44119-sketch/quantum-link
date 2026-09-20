"use client";

import React, { useState, useEffect } from "react";
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
  MessageSquare,
  Flame,
  CreditCard,
  Layers,
  ChevronRight
} from "lucide-react";
import { STORE_PRODUCTS as FALLBACK_PRODUCTS, StoreProduct } from "@/config/store-products";

interface Props {
  onGoToRedeem: (prefix?: string) => void;
}

export const StorePricingCabin: React.FC<Props> = ({ onGoToRedeem }) => {
  const [products, setProducts] = useState<StoreProduct[]>(FALLBACK_PRODUCTS);
  const [contactInfo, setContactInfo] = useState({
    wechat: "AI-ASSIST-VIP",
    qrNote: "扫码添加客服 / 付款",
    noticeText: "支持充值至您现有的个人自用账号，正规海外实体卡结算，保留历史对话与全部数据，一人一卡安全稳定。"
  });

  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [copiedWeChat, setCopiedWeChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/store/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
          }
          if (data.contact) {
            setContactInfo(data.contact);
          }
        }
      })
      .catch((e) => console.error("Fetch products failed:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyWeChat = () => {
    navigator.clipboard.writeText(contactInfo.wechat);
    setCopiedWeChat(true);
    setTimeout(() => setCopiedWeChat(false), 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* 购买收银台 / 客服下单弹窗 */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg border border-[var(--line-strong)] bg-[#090e15]/95 p-6 sm:p-7 text-white corner-bracket shadow-[0_0_60px_rgba(0,0,0,0.8)] rounded-sm">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-[var(--holo)]" />
                <h3 className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
                  收银台 · 下单与卡密交付 (CHECKOUT)
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-[var(--fg-muted)] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs text-neutral-300">
              <div className="p-3.5 border border-[var(--line)] bg-black/50 rounded-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 block">选购商品</span>
                  <span className="text-sm font-bold text-white tracking-wide">{selectedProduct.title}</span>
                  <span className="text-[10px] text-cyan-200/70 block mt-0.5">{selectedProduct.sub}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block">应付金额</span>
                  <div className="flex items-baseline gap-1.5 justify-end">
                    {selectedProduct.originalPrice && (
                      <span className="line-through text-neutral-500 text-[11px]">
                        {selectedProduct.originalPrice}
                      </span>
                    )}
                    <span className="text-xl font-bold text-[var(--warm)] tracking-tight">
                      ¥ {selectedProduct.price}
                    </span>
                  </div>
                </div>
              </div>

              {/* 收款二维码区 */}
              <div className="p-5 border border-[var(--line)] bg-black/40 rounded-sm text-center space-y-3">
                <div className="w-44 h-44 mx-auto p-2 bg-white rounded shadow-md relative flex items-center justify-center">
                  <div className="w-full h-full border border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-800 p-2">
                    <QrCode className="w-16 h-16 text-neutral-900 mb-1" />
                    <span className="text-[11px] font-bold text-neutral-900">{contactInfo.qrNote}</span>
                    <span className="text-[9px] text-neutral-500 mt-0.5">备注：{selectedProduct.id}</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  扫码付款后，或添加官方微信，人工 / 自动秒发激活卡密：
                </p>

                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 border border-[var(--holo)]/40 bg-cyan-950/40 rounded-sm text-white text-xs">
                  <span>微信号: <strong className="text-[var(--holo)] font-bold">{contactInfo.wechat}</strong></span>
                  <button
                    onClick={handleCopyWeChat}
                    className="text-[11px] text-[var(--warm)] hover:underline inline-flex items-center gap-0.5"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedWeChat ? "已复制" : "点击复制"}
                  </button>
                </div>
              </div>

              <div className="p-3 border-l-2 border-[var(--holo)] bg-cyan-950/20 text-[11px] text-cyan-200/90 leading-relaxed">
                💡 <strong>已拿到卡密？</strong> 无需等待客服，直接点击下方切换至【激活开通】，10秒内全自动充值到账。
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
                className="px-4 py-2.5 border border-[var(--holo)] bg-cyan-950/70 hover:bg-cyan-900 text-white font-bold inline-flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,229,216,0.2)]"
              >
                我有卡密，去激活 (GO TO REDEEM)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2.5 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 顶部环境标语区 */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 border border-[var(--warm)]/30 bg-amber-950/20 text-[var(--warm)] font-mono text-[11px] rounded-full">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>OFFICIAL DIRECT ACTIVATION · 官方正规独享充值通道</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
          主流 AI 生产力订阅中心
        </h2>
        <p className="text-xs sm:text-sm font-mono text-[var(--fg-muted)] leading-relaxed max-w-2xl mx-auto">
          {contactInfo.noticeText}
        </p>
      </div>

      {/* 三列商品卡片：更通透、更舒适 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className={`glass-card corner-bracket p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative group ${
              p.isPopular
                ? "border-[var(--holo)] shadow-[0_0_30px_rgba(0,229,216,0.15)] bg-[#09111c]/85"
                : "border-[var(--line)] hover:border-[var(--line-strong)] hover:-translate-y-1"
            }`}
          >
            {p.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-widest uppercase px-3 py-0.5 border border-[var(--holo)] bg-[#06090e] text-[var(--holo)] font-bold shadow-lg rounded-full">
                ★ 销量冠军 · 强烈推荐
              </div>
            )}

            <div>
              {/* 卡片头部 */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-mono text-base sm:text-lg font-bold text-white tracking-wide group-hover:text-[var(--holo)] transition-colors">
                    {p.title}
                  </h3>
                  <span className="text-xs font-mono text-[var(--fg-muted)] mt-0.5 block">{p.sub}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-[10px] px-2 py-0.5 border border-[var(--warm)]/40 bg-amber-950/30 text-[var(--warm)] rounded-sm">
                    {p.badge}
                  </span>
                  <span className="font-mono text-[9px] text-emerald-400 font-medium">
                    ● {p.stockStatus}
                  </span>
                </div>
              </div>

              {/* 价格区域 */}
              <div className="my-5 pb-5 border-b border-[var(--line)]">
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-xs text-neutral-400">¥</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    {p.price}
                  </span>
                  {p.originalPrice && (
                    <span className="line-through text-xs text-neutral-500">
                      {p.originalPrice}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400 ml-auto font-medium">/ {p.period}</span>
                </div>
                <p className="text-[11px] font-mono text-cyan-200/80 mt-2.5 leading-relaxed">
                  {p.description}
                </p>
              </div>

              {/* 特性清单（带有轻量槽位底色） */}
              <ul className="space-y-2 font-mono text-xs text-neutral-300 mb-8">
                {p.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2 rounded-sm bg-white/[0.02] border border-transparent hover:border-white/5 transition-colors">
                    <Check className="w-3.5 h-3.5 text-[var(--holo)] flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed text-[11px] text-neutral-300">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 底部购买行动区 */}
            <div className="space-y-3 pt-4 border-t border-[var(--line)]/60">
              <button
                type="button"
                onClick={() => setSelectedProduct(p)}
                className={`w-full py-3.5 px-4 font-mono text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 laser-sweeper rounded-sm ${
                  p.isPopular
                    ? "border border-[var(--holo)] bg-cyan-950/70 hover:bg-cyan-900 text-white shadow-[0_0_20px_rgba(0,229,216,0.25)]"
                    : "border border-[var(--line-strong)] bg-black/50 hover:bg-neutral-800 text-white"
                }`}
              >
                <span>立即选购 · 获取卡密</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 px-1">
                <span>交付前缀: <strong className="text-[var(--holo)]">{p.prefix}</strong></span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Clock className="w-3 h-3" /> 自动发货 / 秒出卡密
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部保障标签条 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[var(--line)] font-mono text-xs text-neutral-400 text-center">
        <div className="p-3.5 border border-[var(--line)] bg-black/40 rounded-sm">
          <ShieldCheck className="w-4 h-4 mx-auto mb-1.5 text-[var(--holo)]" />
          <span className="text-white block font-bold">100% 独立正规代充</span>
          <span className="text-[10px] text-neutral-500">绝不索取账号密码，安全无忧</span>
        </div>
        <div className="p-3.5 border border-[var(--line)] bg-black/40 rounded-sm">
          <Zap className="w-4 h-4 mx-auto mb-1.5 text-[var(--warm)]" />
          <span className="text-white block font-bold">拿到卡密秒级开通</span>
          <span className="text-[10px] text-neutral-500">凭 Session 凭证 10 秒全自动下发</span>
        </div>
        <div className="p-3.5 border border-[var(--line)] bg-black/40 rounded-sm">
          <MessageSquare className="w-4 h-4 mx-auto mb-1.5 text-emerald-400" />
          <span className="text-white block font-bold">30 天完整售后质保</span>
          <span className="text-[10px] text-neutral-500">官方 API 状态追踪，翻车秒补</span>
        </div>
      </div>
    </div>
  );
};