"use client";

import React, { useState, useEffect } from "react";
import { 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  QrCode, 
  Zap, 
  Clock, 
  X, 
  Copy, 
  Flame, 
  CreditCard, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  Sparkles,
  MessageCircle
} from "lucide-react";
import { STORE_PRODUCTS as FALLBACK_PRODUCTS, StoreProduct } from "@/config/store-products";
import { StoreContact } from "@/lib/admin-store-service";

interface Props {
  onGoToRedeem: (cdkOrPrefix?: string) => void;
}

type OrderStage = "PAYING" | "EXPIRED" | "SUCCESS";

interface CheckoutOrder {
  orderId: string;
  product: StoreProduct;
  basePrice: number;
  handlingFee: number;
  totalAmount: number;
  expiresAt: number;
  deliveredCdk?: string;
}

export const StorePricingCabin: React.FC<Props> = ({ onGoToRedeem }) => {
  const [products, setProducts] = useState<StoreProduct[]>(FALLBACK_PRODUCTS);
  const [contactInfo, setContactInfo] = useState<StoreContact>({
    wechat: "AI-ASSIST-VIP",
    qrNote: "扫码添加客服 / 付款",
    noticeText: "支持充值至您现有的个人自用账号，正规海外实体卡结算，保留历史对话与全部数据，一人一卡安全稳定。",
    handlingFeePercent: 2.0,
    handlingFeeMin: 1.0
  });

  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [activeOrder, setActiveOrder] = useState<CheckoutOrder | null>(null);
  const [orderStage, setOrderStage] = useState<OrderStage>("PAYING");
  const [secondsLeft, setSecondsLeft] = useState<number>(300);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetch("/api/store/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
          }
          if (data.contact) {
            setContactInfo((prev) => ({ ...prev, ...data.contact }));
          }
        }
      })
      .catch((e) => console.error("Fetch products failed:", e));
  }, []);

  const handleOpenCheckout = (product: StoreProduct) => {
    const base = parseFloat(product.price) || 0;
    const rate = contactInfo.handlingFeePercent ?? 2.0;
    const fee = Math.max(contactInfo.handlingFeeMin ?? 1.0, +(base * (rate / 100)).toFixed(2));
    const total = +(base + fee).toFixed(2);
    const dateStr = new Date().toISOString().replace(/[-:T]/g, "").slice(2, 10);
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newOrderId = `QL-${dateStr}-${randomHex}`;

    const order: CheckoutOrder = {
      orderId: newOrderId,
      product,
      basePrice: base,
      handlingFee: fee,
      totalAmount: total,
      expiresAt: Date.now() + 300 * 1000,
    };

    setSelectedProduct(product);
    setActiveOrder(order);
    setOrderStage("PAYING");
    setSecondsLeft(300);
  };

  useEffect(() => {
    if (!activeOrder || orderStage !== "PAYING") return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setOrderStage("EXPIRED");
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOrder, orderStage]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRefreshOrder = () => {
    if (selectedProduct) {
      handleOpenCheckout(selectedProduct);
    }
  };

  const handleSimulatePayment = () => {
    if (!activeOrder) return;
    setIsVerifying(true);
    setTimeout(() => {
      const prefix = activeOrder.product.prefix || "PH-";
      const randomKey1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomKey2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedCdk = `${prefix}${randomKey1}-${randomKey2}-NOMINAL`;

      setActiveOrder({
        ...activeOrder,
        deliveredCdk: generatedCdk
      });
      setOrderStage("SUCCESS");
      setIsVerifying(false);
    }, 700);
  };

  return (
    <div className="space-y-10 sm:space-y-14 animate-in fade-in duration-300">
      {/* 现代移动端优先收银台 (Mobile Bottom-Sheet / Desktop Modal) */}
      {selectedProduct && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto bg-[#0b1019] border-t sm:border border-white/10 p-5 sm:p-7 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            
            {/* 手机端顶部滑动拖拽条 */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

            {/* 头部导航 */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    确认订单与支付
                  </h3>
                  <span className="text-[10px] text-neutral-400 font-mono block">
                    NO: {activeOrder.orderId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setActiveOrder(null);
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 阶段 1：待支付 */}
            {orderStage === "PAYING" && (
              <div className="space-y-4 text-xs">
                {/* 倒计时状态条 */}
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${secondsLeft < 60 ? "text-red-400 animate-pulse" : "text-cyan-400"}`} />
                      <span>付款码有效倒计时</span>
                    </span>
                    <span className={`font-mono font-bold ${secondsLeft < 60 ? "text-red-400 text-sm" : "text-cyan-300 text-sm"}`}>
                      {formatTime(secondsLeft)}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        secondsLeft < 60 
                          ? "bg-red-500" 
                          : secondsLeft < 120 
                          ? "bg-amber-400" 
                          : "bg-cyan-400"
                      }`}
                      style={{ width: `${(secondsLeft / 300) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 费用明细卡片（极简现代） */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white block">{selectedProduct.title}</span>
                      <span className="text-[10px] text-cyan-200/70">{selectedProduct.sub}</span>
                    </div>
                    <span className="text-xs font-mono text-neutral-300">¥{activeOrder.basePrice.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-neutral-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span>渠道手续费 ({contactInfo.handlingFeePercent ?? 2.0}%)</span>
                    </span>
                    <span className="font-mono">+¥{activeOrder.handlingFee.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-baseline justify-between">
                    <span className="text-xs font-bold text-white">应付总额</span>
                    <div className="flex items-baseline gap-1 text-[var(--warm)] font-mono">
                      <span className="text-xs font-bold">¥</span>
                      <span className="text-2xl font-extrabold tracking-tight">
                        {activeOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 私信免手续费提示胶囊 */}
                <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-amber-200/90">
                  <div className="leading-snug">
                    💡 <strong>不想付手续费？</strong>
                    私信客服微信转账底价 <strong>¥{activeOrder.basePrice.toFixed(2)}</strong> 免手续费
                  </div>
                  <button
                    onClick={() => handleCopy(contactInfo.wechat, "checkoutWechat")}
                    className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] whitespace-nowrap cursor-pointer transition-colors inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === "checkoutWechat" ? "已复制" : `复制: ${contactInfo.wechat}`}</span>
                  </button>
                </div>

                {/* 二维码展示卡片（纯白高光圆角，极简去除虚线） */}
                <div className="py-2 text-center space-y-3">
                  <div className="w-48 h-48 mx-auto p-2.5 bg-white rounded-2xl shadow-xl relative flex flex-col items-center justify-center">
                    {contactInfo.qrCodeImage ? (
                      <div className="w-full h-full flex flex-col items-center justify-center relative">
                        <img 
                          src={contactInfo.qrCodeImage} 
                          alt="付款二维码" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-800">
                        <QrCode className="w-20 h-20 text-neutral-900 mb-1" />
                        <span className="text-xs font-bold text-neutral-900">{contactInfo.qrNote}</span>
                        <span className="text-[10px] text-neutral-500 font-mono mt-0.5">{activeOrder.orderId}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-400">
                    {contactInfo.qrNote} · 付款后自动出码
                  </p>

                  {/* 模拟支付 / 快速核验按钮 */}
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isVerifying}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-bold text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(0,229,216,0.3)] active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isVerifying ? "正在同步网关交易记录..." : "我已完成支付 (点击快速核验)"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 阶段 2：超时失效 */}
            {orderStage === "EXPIRED" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-lg">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">订单已超时失效</h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    已超过 5 分钟有效付款时间，临时收款码已关闭。请勿继续付款，避免掉单。
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleRefreshOrder}
                    className="py-3 px-5 rounded-xl bg-cyan-500 text-black font-bold inline-flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>重新下单获取新付款码</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setActiveOrder(null);
                    }}
                    className="py-3 px-4 rounded-xl border border-white/10 text-neutral-400 hover:text-white"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 阶段 3：支付成功与 CDK 交付 */}
            {orderStage === "SUCCESS" && activeOrder && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-emerald-300">支付成功 · 卡密已发放</h4>
                  <p className="text-xs text-neutral-400">
                    订单已完成 · 质保协议已实时上链
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-left space-y-1.5">
                  <span className="text-[10px] text-neutral-400 block font-mono">
                    YOUR ACTIVATION CDK:
                  </span>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-emerald-500/20">
                    <span className="text-sm sm:text-base font-extrabold text-[var(--holo)] font-mono tracking-wider break-all">
                      {activeOrder.deliveredCdk}
                    </span>
                    <button
                      onClick={() => handleCopy(activeOrder.deliveredCdk || "", "deliveredCdk")}
                      className="px-2.5 py-1 text-xs text-emerald-300 hover:text-white border border-emerald-500/30 rounded inline-flex items-center gap-1 flex-shrink-0 ml-2"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === "deliveredCdk" ? "已复制" : "复制"}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const cdk = activeOrder.deliveredCdk;
                    setSelectedProduct(null);
                    setActiveOrder(null);
                    onGoToRedeem(cdk);
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs tracking-wider inline-flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98]"
                >
                  <span>带入卡密 · 前往自助激活</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 顶部标语：移动端精简优雅 */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5 px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 border border-amber-500/30 bg-amber-950/20 text-[var(--warm)] text-[11px] rounded-full font-medium">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>官方正规独享充值通道</span>
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
          主流 AI 生产力订阅中心
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-xl mx-auto">
          {contactInfo.noticeText}
        </p>
      </div>

      {/* 三列商品卡片：Linear / Apple 质感大圆角与柔和微光 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 relative bg-gradient-to-b from-[#0c121d] via-[#080d16] to-[#05080e] border ${
              p.isPopular
                ? "border-cyan-500/40 shadow-[0_0_30px_rgba(0,229,216,0.12)]"
                : "border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div>
              {/* 卡片头部 */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {p.title}
                  </h3>
                  <span className="text-xs text-neutral-400 mt-0.5 block">{p.sub}</span>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                    p.isPopular 
                      ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                      : "bg-amber-950/30 border border-amber-500/30 text-amber-300"
                  }`}>
                    {p.badge}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-medium whitespace-nowrap">
                    ● {p.stockStatus}
                  </span>
                </div>
              </div>

              {/* 价格区 */}
              <div className="my-4 pb-4 border-b border-white/[0.06]">
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-sm font-semibold text-neutral-400">¥</span>
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {p.price}
                  </span>
                  {p.originalPrice && (
                    <span className="line-through text-xs text-neutral-500 ml-1">
                      {p.originalPrice}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400 ml-auto font-normal">/ {p.period}</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                  {p.description}
                </p>
              </div>

              {/* 特性清单 */}
              <ul className="space-y-2 text-xs text-neutral-300 mb-6">
                {p.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-white/[0.02]">
                    <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug text-[11px] text-neutral-300">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 购买按钮 */}
            <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => handleOpenCheckout(p)}
                className={`w-full py-3 sm:py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-[0.98] ${
                  p.isPopular
                    ? "bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black shadow-[0_0_20px_rgba(0,229,216,0.25)]"
                    : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                }`}
              >
                <span>立即选购 · 获取卡密</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-[10px] text-neutral-500 px-1 font-mono">
                <span>前缀: <strong className="text-cyan-400">{p.prefix}</strong></span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Clock className="w-3 h-3" /> 自动出码
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部三大保障 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/[0.06] text-xs text-neutral-400 text-center">
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
          <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
          <span className="text-white block font-bold text-xs">正规海外商务卡代充</span>
          <span className="text-[10px] text-neutral-500">绝不索取密码，一人一卡开票结算</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
          <Zap className="w-4 h-4 mx-auto mb-1 text-amber-400" />
          <span className="text-white block font-bold text-xs">极速自动化秒开</span>
          <span className="text-[10px] text-neutral-500">凭安全会话凭证 10 秒到账</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
          <MessageCircle className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
          <span className="text-white block font-bold text-xs">30 天全程质保</span>
          <span className="text-[10px] text-neutral-500">官方 API 状态追踪，翻车秒补</span>
        </div>
      </div>
    </div>
  );
};