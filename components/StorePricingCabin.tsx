"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  X,
  Copy,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Loader2,
  ExternalLink,
  Layers,
} from "lucide-react";
import { STORE_PRODUCTS as FALLBACK_PRODUCTS } from "@/config/store-products";
import { DeliveredItem, StoreContact, StoreProduct } from "@/lib/types";

interface Props {
  onGoToRedeem: (cdkOrPrefix?: string) => void;
}

type OrderStage = "CONFIG" | "PAYING" | "AWAITING_CONFIRM" | "EXPIRED" | "SUCCESS";

interface ActiveCheckoutOrder {
  orderId: string;
  product: StoreProduct;
  variant: string;
  quantity: number;
  totalAmount: number;
  expiresIn: number;
  qrImageUrl?: string | null;
  alipayQrUrl?: string | null;
  sandboxDemoEnabled?: boolean;
  requiresActivation?: boolean;
  deliveredItems: DeliveredItem[];
}

export const StorePricingCabin: React.FC<Props> = ({ onGoToRedeem }) => {
  const [products, setProducts] = useState<StoreProduct[]>(FALLBACK_PRODUCTS);
  const [contactInfo, setContactInfo] = useState<StoreContact>({
    wechat: "18300425760",
    qrNote: "微信 / 支付宝扫码付款（备注单号秒发卡）",
    noticeText:
      "苏哲 AI 官方授权直连履约节点 · 支持 ChatGPT Plus/Pro 10x/20x/50x、Grok、Gemini 学生认证、Codex 接码与 TG 会员秒级开通。",
  });
  const [sandboxDemoEnabled, setSandboxDemoEnabled] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [chosenVariant, setChosenVariant] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerContact, setBuyerContact] = useState<string>("");
  const [payerNote, setPayerNote] = useState<string>("");
  const [qrTab, setQrTab] = useState<"wechat" | "alipay">("wechat");

  const [activeOrder, setActiveOrder] = useState<ActiveCheckoutOrder | null>(null);
  const [orderStage, setOrderStage] = useState<OrderStage>("CONFIG");
  const [secondsLeft, setSecondsLeft] = useState<number>(900);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isNotifyingPaid, setIsNotifyingPaid] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/store/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          }
          if (data.contact) {
            setContactInfo((prev) => ({ ...prev, ...data.contact }));
          }
          setSandboxDemoEnabled(Boolean(data.sandboxDemoEnabled));
        }
      })
      .catch((e) => console.error("Fetch store products failed:", e));
  }, []);

  const filteredProducts = products.filter((p) => {
    if (categoryFilter === "POPULAR") return p.isPopular;
    if (categoryFilter === "FLAGSHIP") return p.category === "flagship";
    if (categoryFilter === "VERIFY") return p.category === "verify";
    if (categoryFilter === "ACCOUNT") return p.category === "account";
    return true;
  });

  const openProductSheet = (product: StoreProduct) => {
    setSelectedProduct(product);
    const firstAvailableVar = product.variants?.find((v) => v.stock > 0)?.value || product.variants?.[0]?.value || "";
    setChosenVariant(firstAvailableVar);
    setQuantity(1);
    setOrderError(null);
    setActiveOrder(null);
    setOrderStage("CONFIG");
  };

  const handleCreateOrder = async () => {
    if (!selectedProduct) return;
    setIsCreatingOrder(true);
    setOrderError(null);

    try {
      const resp = await fetch("/api/checkout/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: selectedProduct.id,
          quantity,
          variant: chosenVariant,
          buyer_contact: buyerContact.trim(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setOrderError(data.detail || data.error || "创建订单失败");
        return;
      }

      const nextOrder: ActiveCheckoutOrder = {
        orderId: data.order_id,
        product: selectedProduct,
        variant: chosenVariant,
        quantity,
        totalAmount: parseFloat(data.amount),
        expiresIn: data.expires_in || 900,
        qrImageUrl: data.qr_image_url || contactInfo.qrCodeImage,
        alipayQrUrl: data.alipay_qr_url || contactInfo.alipayQrImage,
        sandboxDemoEnabled: Boolean(data.sandbox_demo_enabled ?? sandboxDemoEnabled),
        requiresActivation: Boolean(selectedProduct.requiresActivation),
        deliveredItems: [],
      };

      setActiveOrder(nextOrder);
      setSecondsLeft(nextOrder.expiresIn);
      setOrderStage("PAYING");
      if (!nextOrder.qrImageUrl && nextOrder.alipayQrUrl) {
        setQrTab("alipay");
      } else {
        setQrTab("wechat");
      }
    } catch {
      setOrderError("网络请求异常，请稍后重试");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // 订单倒计时
  useEffect(() => {
    if (!activeOrder || (orderStage !== "PAYING" && orderStage !== "AWAITING_CONFIRM")) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (orderStage === "PAYING") setOrderStage("EXPIRED");
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeOrder, orderStage]);

  // 轮询云端保险柜订单状态：一旦站长后台点击确认（或自动回调），买家端瞬间弹出真实卡密！
  useEffect(() => {
    if (!activeOrder || (orderStage !== "PAYING" && orderStage !== "AWAITING_CONFIRM")) return;

    const poll = setInterval(async () => {
      try {
        const resp = await fetch(`/api/checkout/orders/${encodeURIComponent(activeOrder.orderId)}`);
        if (!resp.ok) return;
        const data = await resp.json();
        const items: DeliveredItem[] = Array.isArray(data.delivered_items) ? data.delivered_items : [];
        if (data.status === "paid" && items.length > 0) {
          setActiveOrder((prev) => (prev ? { ...prev, deliveredItems: items } : null));
          setOrderStage("SUCCESS");
          clearInterval(poll);
        } else if (data.status === "expired" && orderStage === "PAYING") {
          setOrderStage("EXPIRED");
          clearInterval(poll);
        }
      } catch {
        // Ignore transient network hiccups
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [activeOrder, orderStage]);

  const handleNotifyPaid = async () => {
    if (!activeOrder) return;
    setIsNotifyingPaid(true);
    setOrderError(null);
    try {
      const resp = await fetch(`/api/checkout/orders/${encodeURIComponent(activeOrder.orderId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_contact: buyerContact.trim(),
          payer_note: payerNote.trim() || "买家已扫码转账",
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setOrderStage("AWAITING_CONFIRM");
      } else {
        setOrderError(data.detail || "提交失败，请重试");
      }
    } catch {
      setOrderError("提交异常，请检查网络");
    } finally {
      setIsNotifyingPaid(false);
    }
  };

  const handleSandboxSimulate = async () => {
    if (!activeOrder) return;
    setIsNotifyingPaid(true);
    try {
      const resp = await fetch(`/api/checkout/orders?orderId=${encodeURIComponent(activeOrder.orderId)}`, {
        method: "PUT",
      });
      const data = await resp.json();
      if (data.success && data.order?.delivered_items?.length > 0) {
        setActiveOrder({
          ...activeOrder,
          deliveredItems: data.order.delivered_items,
        });
        setOrderStage("SUCCESS");
      }
    } finally {
      setIsNotifyingPaid(false);
    }
  };

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

  const currentQrImage =
    qrTab === "alipay"
      ? activeOrder?.alipayQrUrl || contactInfo.alipayQrImage || activeOrder?.qrImageUrl || contactInfo.qrCodeImage
      : activeOrder?.qrImageUrl || contactInfo.qrCodeImage || activeOrder?.alipayQrUrl || contactInfo.alipayQrImage;

  return (
    <div className="space-y-10 sm:space-y-14 animate-in fade-in duration-300">
      {/* 收银与自动发卡弹窗 */}
      {selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto bg-[#0b1019] border-t sm:border border-white/10 p-5 sm:p-7 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

            {/* 弹窗顶栏 */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {orderStage === "CONFIG" ? "确认商品规格与联系方式" : "扫码付款与极速自动出卡"}
                  </h3>
                  <span className="text-[10px] text-neutral-400 font-mono block">
                    {activeOrder ? `订单号: ${activeOrder.orderId}` : `商品代码: ${selectedProduct.id}`}
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

            {/* 阶段 0：下单规格选择与找回凭证填写 */}
            {orderStage === "CONFIG" ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-white block">{selectedProduct.title}</span>
                    <span className="text-[11px] text-neutral-400 mt-0.5 block">{selectedProduct.sub}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-[var(--warm)] font-bold">¥</span>
                    <span className="text-2xl font-extrabold text-[var(--warm)]">
                      {(parseFloat(selectedProduct.price) * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 多规格选择器 (例如海外虚拟卡 5 大卡段) */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-mono font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>选择卡头规格 (实时库存):</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedProduct.variants.map((v) => (
                        <button
                          key={v.value}
                          type="button"
                          disabled={v.stock <= 0}
                          onClick={() => setChosenVariant(v.value)}
                          className={`p-2.5 rounded-xl border font-mono text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            chosenVariant === v.value
                              ? "border-cyan-400 bg-cyan-950/50 text-white"
                              : "border-white/10 bg-black/40 text-neutral-300 hover:border-white/25"
                          }`}
                        >
                          <span className="font-bold block text-xs">BIN {v.label}</span>
                          <span className="text-[10px] text-emerald-400">余 {v.stock} 张</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 购买数量与预留联系方式 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-neutral-400 block mb-1 font-mono text-[11px]">购买数量</label>
                    <div className="flex items-center border border-white/10 rounded-xl bg-black/50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-2 text-neutral-300 hover:bg-white/10 font-bold"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-mono font-bold text-sm">{quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) => Math.min(selectedProduct.stock || 20, 20, q + 1))
                        }
                        className="px-3 py-2 text-neutral-300 hover:bg-white/10 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-neutral-300 block mb-1 font-mono text-[11px]">
                      接收/查询微信号或邮箱 <span className="text-cyan-400">(选填·防关网页丢单)</span>
                    </label>
                    <input
                      type="text"
                      value={buyerContact}
                      onChange={(e) => setBuyerContact(e.target.value)}
                      placeholder="填入您的微信号或邮箱，可随时查单取卡"
                      className="w-full bg-black/50 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {orderError ? (
                  <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs">
                    {orderError}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-extrabold text-xs sm:text-sm tracking-wider inline-flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,229,216,0.25)] cursor-pointer disabled:opacity-50"
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在锁定库存并创建云端订单...</span>
                    </>
                  ) : (
                    <>
                      <span>生成订单并获取付款二维码</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : null}

            {/* 阶段 1：待扫码支付 */}
            {orderStage === "PAYING" && activeOrder ? (
              <div className="space-y-4 text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>库存锁定倒计时</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {formatTime(secondsLeft)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-cyan-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-white block">
                      {activeOrder.product.title} {activeOrder.quantity > 1 ? `× ${activeOrder.quantity}` : ""}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-cyan-300">
                        单号: {activeOrder.orderId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeOrder.orderId, "orderId")}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30"
                      >
                        {copiedKey === "orderId" ? "已复制单号" : "复制单号"}
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[var(--warm)]">
                    <span className="text-xs font-bold">¥</span>
                    <span className="text-2xl font-extrabold">{activeOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* 微信 / 支付宝收款码切换 */}
                {activeOrder.qrImageUrl && activeOrder.alipayQrUrl ? (
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/50 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setQrTab("wechat")}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        qrTab === "wechat" ? "bg-emerald-600 text-white" : "text-neutral-400"
                      }`}
                    >
                      微信扫码支付
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTab("alipay")}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        qrTab === "alipay" ? "bg-[#1677ff] text-white" : "text-neutral-400"
                      }`}
                    >
                      支付宝扫码支付
                    </button>
                  </div>
                ) : null}

                {currentQrImage ? (
                  <div className="text-center space-y-2">
                    <div className="w-52 h-52 mx-auto p-2.5 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                      <img
                        src={currentQrImage}
                        alt="收款二维码"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <p className="text-[11px] text-cyan-300 font-medium">
                      请扫码支付 <strong className="text-amber-300">¥{activeOrder.totalAmount.toFixed(2)}</strong>，转账备注单号后四位更佳
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#111c2d] to-[#0c1422] border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">添加站长微信转账秒发 (0手续费)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">在线自动出卡</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-white/10">
                      <div>
                        <span className="text-[10px] text-neutral-400 block font-mono">WECHAT ID:</span>
                        <span className="text-sm font-extrabold text-cyan-300 font-mono tracking-wider">
                          {contactInfo.wechat}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(contactInfo.wechat, "wechatId")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === "wechatId" ? "已复制" : "复制微信号"}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={payerNote}
                    onChange={(e) => setPayerNote(e.target.value)}
                    placeholder="选填：付款人昵称或转账单号后四位（方便秒级核对）"
                    className="w-full bg-black/50 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />

                  {orderError ? (
                    <div className="text-rose-300 text-[11px]">{orderError}</div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleNotifyPaid}
                    disabled={isNotifyingPaid}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-black font-extrabold text-xs sm:text-sm tracking-wider inline-flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    {isNotifyingPaid ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>我已完成扫码付款 · 通知系统极速发卡</span>
                  </button>

                  {activeOrder.sandboxDemoEnabled ? (
                    <button
                      type="button"
                      onClick={handleSandboxSimulate}
                      disabled={isNotifyingPaid}
                      className="w-full py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono cursor-pointer"
                    >
                      [沙盒演示开关已开启] 一键模拟支付出演示码
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* 阶段 2：已通知站长，实时等待后台点确认自动发真卡 */}
            {orderStage === "AWAITING_CONFIRM" && activeOrder ? (
              <div className="py-5 text-center space-y-4 text-xs">
                <div className="w-14 h-14 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 flex items-center justify-center mx-auto">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-white">已提交核销提醒 · 正在自动调配卡密</h4>
                  <p className="text-neutral-400 leading-relaxed max-w-sm mx-auto">
                    站长手机端确认到账后，系统将自动从苏哲官方仓提取真卡并**直接在此弹窗跳出**（每 3 秒自动同步，无需刷新）。
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-left space-y-2 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-[11px]">您的取卡单号 (请截图或复制保存):</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeOrder.orderId, "awaitOrderId")}
                      className="text-[11px] text-cyan-300 hover:underline inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === "awaitOrderId" ? "已复制" : "复制"}</span>
                    </button>
                  </div>
                  <div className="text-base font-extrabold text-[var(--holo)] tracking-wider">
                    {activeOrder.orderId}
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    即使关闭本窗口，您也可随时在【03. 凭据查询】输入该单号或预留微信号提取卡密。催单微信：{contactInfo.wechat}
                  </p>
                </div>
              </div>
            ) : null}

            {/* 阶段 3：超时 */}
            {orderStage === "EXPIRED" ? (
              <div className="text-center py-6 space-y-4 text-xs">
                <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">锁单时间已过</h4>
                  <p className="text-neutral-400 max-w-xs mx-auto">
                    若尚未付款，请重新创建订单；若刚刚已完成扫码转账，请复制单号联系微信 {contactInfo.wechat} 秒补发。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderStage("CONFIG")}
                  className="py-3 px-5 rounded-xl bg-cyan-500 text-black font-bold inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>重新锁单</span>
                </button>
              </div>
            ) : null}

            {/* 阶段 4：出卡成功！展示全部交付凭证 */}
            {orderStage === "SUCCESS" && activeOrder ? (
              <div className="py-4 space-y-4 text-xs">
                <div className="text-center space-y-1.5">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-300">核销完成 · 您的专属凭证已发放</h4>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    已永久存入云端保险柜，随时凭单号 {activeOrder.orderId} 找回
                  </p>
                </div>

                <div className="space-y-2.5">
                  {activeOrder.deliveredItems.map((item, idx) => {
                    const copyVal = item.copy_text || item.value;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-200 font-bold font-mono">
                            {item.title || `交付凭证 #${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(copyVal, `deliv_${idx}`)}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 inline-flex items-center gap-1 font-mono"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedKey === `deliv_${idx}` ? "已复制" : "一键复制"}</span>
                          </button>
                        </div>
                        <pre className="p-2.5 rounded-lg bg-black/70 border border-white/10 text-[var(--holo)] font-mono text-xs sm:text-sm font-bold whitespace-pre-wrap break-all">
                          {copyVal}
                        </pre>
                        {item.href ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-300 hover:underline text-[11px]"
                          >
                            <span>打开专属交付链接</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                        {item.guide ? (
                          <p className="text-[11px] text-neutral-300 leading-relaxed">{item.guide}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {activeOrder.requiresActivation ? (
                  <button
                    type="button"
                    onClick={() => {
                      const firstCdk =
                        activeOrder.deliveredItems[0]?.copy_text ||
                        activeOrder.deliveredItems[0]?.value ||
                        "";
                      setSelectedProduct(null);
                      setActiveOrder(null);
                      onGoToRedeem(firstCdk);
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs sm:text-sm tracking-wider inline-flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <span>带入卡密 · 前往 7 合 1 全能激活台开通</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 顶部标语 */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5 px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 border border-amber-500/30 bg-amber-950/20 text-[var(--warm)] text-[11px] rounded-full font-medium">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>苏哲官方供应链实时库存直连 · 云端保险柜永不丢单</span>
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
          全自动 AI 生产力订阅与认证中枢
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-xl mx-auto">
          {contactInfo.noticeText}
        </p>
      </div>

      {/* 分类筛选胶囊 */}
      <div className="flex items-center justify-center gap-2 flex-wrap px-2">
        {[
          { id: "ALL", label: "全部严选", count: products.length },
          { id: "POPULAR", label: "🔥 必入爆款", count: products.filter((p) => p.isPopular).length },
          {
            id: "FLAGSHIP",
            label: "🤖 旗舰模型代充",
            count: products.filter((p) => p.category === "flagship").length,
          },
          {
            id: "VERIFY",
            label: "🛡️ 学生认证·接码·绑卡·TG",
            count: products.filter((p) => p.category === "verify").length,
          },
          {
            id: "ACCOUNT",
            label: "📦 独享成品与工具",
            count: products.filter((p) => p.category === "account").length,
          },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === cat.id
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,229,216,0.2)] font-bold"
                : "bg-white/[0.03] text-neutral-400 hover:text-white border border-white/5 hover:border-white/10"
            }`}
          >
            <span>{cat.label}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-neutral-300 font-mono">
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* 商品卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredProducts.map((p) => {
          const originalNum = parseFloat(p.originalPrice?.replace(/[^\d.]/g, "") || "0");
          const priceNum = parseFloat(p.price);
          const savings = originalNum > priceNum ? Math.round(originalNum - priceNum) : 0;
          const isSoldOut = p.available === false || p.stockStatus === "暂时缺货";

          return (
            <div
              key={p.id}
              className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 relative bg-gradient-to-b from-[#0c121d] via-[#080d16] to-[#05080e] border ${
                isSoldOut
                  ? "border-white/[0.05] opacity-70"
                  : p.isPopular
                  ? "border-cyan-500/40 shadow-[0_0_30px_rgba(0,229,216,0.12)]"
                  : "border-white/[0.08] hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {p.title}
                    </h3>
                    <span className="text-xs text-neutral-400 mt-0.5 block">{p.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                        p.isPopular
                          ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                          : "bg-amber-950/30 border border-amber-500/30 text-amber-300"
                      }`}
                    >
                      {p.badge}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-medium whitespace-nowrap ${
                        isSoldOut
                          ? "text-rose-400"
                          : p.stockStatus === "库存紧张"
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      ● {p.stockStatus}
                      {typeof p.stock === "number" && p.stock > 0 ? ` (${p.stock})` : ""}
                    </span>
                  </div>
                </div>

                <div className="my-4 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-sm font-semibold text-neutral-400">¥</span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {p.price}
                    </span>
                    {p.originalPrice ? (
                      <span className="line-through text-xs text-neutral-500 ml-1">
                        ¥{p.originalPrice.replace(/[^\d.]/g, "")}
                      </span>
                    ) : null}
                    {savings > 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold font-mono ml-2">
                        省 ¥{savings}
                      </span>
                    ) : null}
                    <span className="text-xs text-neutral-400 ml-auto font-normal">/ {p.period}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">{p.description}</p>
                </div>

                <ul className="space-y-2 text-xs text-neutral-300 mb-6">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-white/[0.02]">
                      <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-snug text-[11px] text-neutral-300">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => openProductSheet(p)}
                  className={`w-full py-3 sm:py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shadow-lg ${
                    isSoldOut
                      ? "bg-white/5 text-neutral-500 border border-white/5 cursor-not-allowed"
                      : p.isPopular
                      ? "bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black shadow-[0_0_20px_rgba(0,229,216,0.25)] cursor-pointer active:scale-[0.98]"
                      : "bg-white/10 hover:bg-white/15 text-white border border-white/10 cursor-pointer active:scale-[0.98]"
                  }`}
                >
                  <span>{isSoldOut ? "上游暂时补货中" : "立即选购 · 锁定卡密"}</span>
                  {!isSoldOut ? <ArrowRight className="w-4 h-4" /> : null}
                </button>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 px-1 font-mono">
                  <span>
                    标识: <strong className="text-cyan-400">{p.prefix}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Clock className="w-3 h-3" />{" "}
                    {p.requiresActivation ? "出卡后站内一键激活" : "免激活直接提取"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部三大保障 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/[0.06] text-xs text-neutral-400 text-center">
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
          <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
          <span className="text-white block font-bold text-xs">苏哲官方直连供应链</span>
          <span className="text-[10px] text-neutral-500">实时同步上游库存，绝不超卖或掺杂劣质卡</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
          <Zap className="w-4 h-4 mx-auto mb-1 text-amber-400" />
          <span className="text-white block font-bold text-xs">7 合 1 站内全自动开通</span>
          <span className="text-[10px] text-neutral-500">支持 ChatGPT / Grok / 学生认证 / 接码 / TG 一站式办结</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
          <MessageCircle className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
          <span className="text-white block font-bold text-xs">Supabase 云端保险柜存证</span>
          <span className="text-[10px] text-neutral-500">订单与卡密持久加密留存，随时凭单号一键找回</span>
        </div>
      </div>
    </div>
  );
};
