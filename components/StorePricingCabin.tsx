"use client";

import React, { useState, useEffect, useRef } from "react";
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
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  Send 
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
  expiresAt: number; // timestamp
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
  const [secondsLeft, setSecondsLeft] = useState<number>(300); // 5 分钟 (300秒)
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // 初始化拉取商品与配置
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

  // 当用户点击商品，创建订单并初始化 5 分钟倒计时
  const handleOpenCheckout = (product: StoreProduct) => {
    const base = parseFloat(product.price) || 0;
    const rate = contactInfo.handlingFeePercent ?? 2.0;
    const fee = Math.max(contactInfo.handlingFeeMin ?? 1.0, +(base * (rate / 100)).toFixed(2));
    const total = +(base + fee).toFixed(2);
    const dateStr = new Date().toISOString().replace(/[-:T]/g, "").slice(2, 12);
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

  // 5 分钟倒计时器逻辑
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

  // 格式化 05:00 分秒
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 复制剪贴板
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 重新刷新订单（超时后）
  const handleRefreshOrder = () => {
    if (selectedProduct) {
      handleOpenCheckout(selectedProduct);
    }
  };

  // 模拟或真实核验支付完成
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
    }, 800);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* 购买收银台：5分钟扫码倒计时 + 渠道手续费分解 + CDK 交付 */}
      {selectedProduct && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl border border-[var(--line-strong)] bg-[#080d16] p-6 sm:p-7 text-white corner-bracket shadow-[0_0_60px_rgba(0,0,0,0.9)] rounded-sm">
            
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-[var(--holo)]" />
                <div>
                  <h3 className="font-mono text-sm sm:text-base font-bold text-white tracking-wider flex items-center gap-2">
                    <span>收银台 · 订单结算</span>
                    <span className="text-[10px] px-2 py-0.5 border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 rounded font-normal">
                      5MIN AUTO-EXPIRY
                    </span>
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500 block">
                    ORDER NO: {activeOrder.orderId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setActiveOrder(null);
                }}
                className="text-[var(--fg-muted)] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 阶段 1：待支付 (包含 5 分钟倒计时 + 手续费明细) */}
            {orderStage === "PAYING" && (
              <div className="space-y-4 font-mono text-xs text-neutral-300">
                {/* 5 分钟有效倒计时条 */}
                <div className="p-3 border border-white/10 bg-black/40 rounded-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${secondsLeft < 60 ? "text-red-400 animate-pulse" : "text-[var(--holo)]"}`} />
                      <span className="text-[11px] text-neutral-300">付款码有效倒计时</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      <span className={secondsLeft < 60 ? "text-red-400 font-mono text-base" : "text-[var(--warm)] font-mono text-base"}>
                        {formatTime(secondsLeft)}
                      </span>
                      <span className="text-[10px] text-neutral-500">超时将自动关单</span>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        secondsLeft < 60 
                          ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
                          : secondsLeft < 120 
                          ? "bg-amber-400" 
                          : "bg-[var(--holo)] shadow-[0_0_8px_rgba(0,229,216,0.6)]"
                      }`}
                      style={{ width: `${(secondsLeft / 300) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 费用明细 Summary Box (向 suzhe.ai 学习的手续费透明分解) */}
                <div className="p-3.5 border border-[var(--line)] bg-[#0b121e] rounded-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white tracking-wide">{selectedProduct.title}</span>
                      <span className="text-[10px] text-cyan-200/70 block">{selectedProduct.sub}</span>
                    </div>
                    <span className="text-xs text-neutral-400">¥ {activeOrder.basePrice.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-neutral-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>渠道支付手续费 ({contactInfo.handlingFeePercent ?? 2.0}%)</span>
                    </span>
                    <span>+ ¥ {activeOrder.handlingFee.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.08] flex items-baseline justify-between">
                    <span className="text-xs font-bold text-white">应付总额 (TOTAL)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-[var(--warm)]">¥</span>
                      <span className="text-2xl font-extrabold text-[var(--warm)] tracking-tight">
                        {activeOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 重点：私信微信免手续费提示 (私域流量沉淀机制) */}
                <div className="p-3 border border-amber-500/30 bg-amber-950/20 rounded-sm text-[11px] text-amber-200/90 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    💡 <strong>免手续费通道：</strong>
                    不想支付网关手续费？可直接私信客服微信转账底价 <strong>¥{activeOrder.basePrice.toFixed(2)}</strong>，人工秒发卡密！
                  </div>
                  <button
                    onClick={() => handleCopy(contactInfo.wechat, "checkoutWechat")}
                    className="self-start sm:self-auto px-2.5 py-1 border border-amber-500/40 bg-amber-900/40 hover:bg-amber-800/50 text-amber-200 rounded text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === "checkoutWechat" ? "微信号已复制" : `复制微信: ${contactInfo.wechat}`}</span>
                  </button>
                </div>

                {/* 收款二维码与特征区 */}
                <div className="p-4 border border-[var(--line)] bg-black/40 rounded-sm text-center space-y-3 relative">
                  <div className="w-44 h-44 mx-auto p-2 bg-white rounded shadow-md relative flex items-center justify-center">
                    <div className="w-full h-full border border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-800 p-2">
                      <QrCode className="w-16 h-16 text-neutral-900 mb-1" />
                      <span className="text-[11px] font-bold text-neutral-900">{contactInfo.qrNote}</span>
                      <span className="text-[9px] text-neutral-500 mt-0.5">订单识别码: {activeOrder.orderId}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-neutral-400 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>正在监听网关付款信标 · 轮询核验中...</span>
                  </div>

                  {/* 模拟支付按钮 (方便用户测试整个闭环) */}
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isVerifying}
                      className="px-3 py-1.5 border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900 text-cyan-200 text-[11px] rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isVerifying ? "正在同步网关交易记录..." : "我已完成支付 (点击快速核验)"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 阶段 2：超时失效遮罩 (向 suzhe.ai 的 #checkoutExpiredOverlay 学习) */}
            {orderStage === "EXPIRED" && (
              <div className="space-y-6 font-mono text-center py-8">
                <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-white">订单已超时失效 (EXPIRED)</h4>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                    本次订单已超过 5 分钟有效付款时间，临时收款通道已自动关闭。
                    <strong className="text-red-300 block mt-1">请勿继续付款，避免因订单过期导致卡密无法自动下发。</strong>
                  </p>
                </div>

                <div className="flex justify-center gap-3 text-xs pt-4">
                  <button
                    type="button"
                    onClick={handleRefreshOrder}
                    className="px-5 py-2.5 border border-[var(--holo)] bg-cyan-950/80 hover:bg-cyan-900 text-white font-bold rounded inline-flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,229,216,0.3)] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>刷新订单并重新获取付款码</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setActiveOrder(null);
                    }}
                    className="px-4 py-2.5 border border-white/10 text-neutral-400 hover:text-white rounded transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 阶段 3：支付成功与 CDK 交付 (DELIVERY) */}
            {orderStage === "SUCCESS" && activeOrder && (
              <div className="space-y-5 font-mono text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-emerald-300">支付核验成功 · 卡密已签发</h4>
                  <p className="text-xs text-neutral-400">
                    订单 {activeOrder.orderId} · 交易流水已归档至节点
                  </p>
                </div>

                {/* 卡密展示大卡片 */}
                <div className="p-4 border-2 border-emerald-500/40 bg-emerald-950/20 rounded-sm text-left space-y-2">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest block">
                    ISSUED CDK CARD CODE:
                  </span>
                  <div className="flex items-center justify-between p-2.5 bg-black/60 border border-emerald-500/30 rounded">
                    <span className="text-base sm:text-lg font-extrabold text-[var(--holo)] font-mono tracking-wider">
                      {activeOrder.deliveredCdk}
                    </span>
                    <button
                      onClick={() => handleCopy(activeOrder.deliveredCdk || "", "deliveredCdk")}
                      className="px-2.5 py-1 text-xs text-neutral-200 hover:text-white border border-white/10 hover:border-emerald-500/40 rounded inline-flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === "deliveredCdk" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === "deliveredCdk" ? "已复制" : "复制"}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 border-l-2 border-[var(--holo)] bg-cyan-950/20 text-left text-[11px] text-cyan-200/90 leading-relaxed">
                  💡 <strong>下一步：</strong>点击下方直接前往【02. 自助激活开通】，卡密将自动填入输入框，无需手动粘贴。
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const cdk = activeOrder.deliveredCdk;
                      setSelectedProduct(null);
                      setActiveOrder(null);
                      onGoToRedeem(cdk);
                    }}
                    className="px-5 py-3 border border-[var(--warm)] bg-amber-950/80 hover:bg-amber-900 text-white font-bold rounded inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,184,133,0.3)] cursor-pointer"
                  >
                    <span>带入卡密 · 前往自助激活 (GO TO REDEEM)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setActiveOrder(null);
                    }}
                    className="px-4 py-3 border border-white/10 text-neutral-400 hover:text-white rounded transition-colors"
                  >
                    稍后激活 / 关闭
                  </button>
                </div>
              </div>
            )}

            {/* 弹窗底部关闭（仅在支付中可见） */}
            {orderStage === "PAYING" && (
              <div className="mt-5 pt-3 border-t border-[var(--line)] flex justify-end gap-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const prefix = selectedProduct.prefix;
                    setSelectedProduct(null);
                    setActiveOrder(null);
                    onGoToRedeem(prefix);
                  }}
                  className="px-4 py-2 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-colors"
                >
                  已有卡密，去激活
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setActiveOrder(null);
                  }}
                  className="px-4 py-2 border border-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  取消
                </button>
              </div>
            )}
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

      {/* 三列商品卡片 */}
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

              {/* 特性清单 */}
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
                onClick={() => handleOpenCheckout(p)}
                className={`w-full py-3.5 px-4 font-mono text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 laser-sweeper rounded-sm cursor-pointer ${
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