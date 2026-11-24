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
  GraduationCap,
  Smartphone,
  Send,
  Bot,
  Rocket,
  Mail,
} from "lucide-react";
import { STORE_PRODUCTS as FALLBACK_PRODUCTS } from "@/config/store-products";
import { DeliveredItem, StoreContact, StoreProduct } from "@/lib/types";
import { SpotlightCard } from "./SpotlightCard";
import { soundFX } from "@/lib/tactile-feedback";

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

function getBrandVisual(p: StoreProduct) {
  const id = p.id.toLowerCase();
  if (id.startsWith("gpt_")) {
    return {
      tileBg: "linear-gradient(135deg, rgba(61, 145, 108, 0.22), rgba(61, 145, 108, 0.08))",
      tileColor: "#52B788",
      spotlight: "rgba(82, 183, 136, 0.16)",
      Icon: Bot,
    };
  }
  if (id.includes("sheerid") || id.includes("gemini")) {
    return {
      tileBg: "linear-gradient(135deg, rgba(115, 134, 232, 0.24), rgba(168, 130, 255, 0.08))",
      tileColor: "#8EA0F8",
      spotlight: "rgba(130, 148, 248, 0.17)",
      Icon: id.includes("sheerid") ? GraduationCap : Sparkles,
    };
  }
  if (id.includes("card_virtual")) {
    return {
      tileBg: "linear-gradient(135deg, rgba(230, 190, 138, 0.26), rgba(217, 119, 87, 0.08))",
      tileColor: "#E6BE8A",
      spotlight: "rgba(230, 190, 138, 0.18)",
      Icon: CreditCard,
    };
  }
  if (id.includes("sms")) {
    return {
      tileBg: "linear-gradient(135deg, rgba(226, 123, 88, 0.24), rgba(226, 123, 88, 0.08))",
      tileColor: "#EB8A6A",
      spotlight: "rgba(226, 123, 88, 0.17)",
      Icon: Smartphone,
    };
  }
  if (id.includes("tg_") || id.includes("telegram")) {
    return {
      tileBg: "linear-gradient(135deg, rgba(74, 150, 217, 0.24), rgba(74, 150, 217, 0.08))",
      tileColor: "#63B3ED",
      spotlight: "rgba(99, 179, 237, 0.16)",
      Icon: Send,
    };
  }
  if (id.includes("muse") || id.includes("grok")) {
    return {
      tileBg: "linear-gradient(135deg, rgba(217, 119, 87, 0.22), rgba(230, 190, 138, 0.08))",
      tileColor: "#E5A97C",
      spotlight: "rgba(229, 169, 124, 0.16)",
      Icon: Rocket,
    };
  }
  return {
    tileBg: "linear-gradient(135deg, rgba(160, 174, 192, 0.2), rgba(160, 174, 192, 0.06))",
    tileColor: "#CBD5E1",
    spotlight: "rgba(203, 213, 225, 0.14)",
    Icon: Mail,
  };
}

export const StorePricingCabin: React.FC<Props> = ({ onGoToRedeem }) => {
  const [products, setProducts] = useState<StoreProduct[]>(FALLBACK_PRODUCTS);
  const [contactInfo, setContactInfo] = useState<StoreContact>({
    wechat: "18300425760",
    qrNote: "微信 / 支付宝扫码付款（备注单号秒发卡）",
    noticeText: "",
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
      .catch(() => {});
  }, []);

  const filteredProducts = products.filter((p) => {
    if (categoryFilter === "POPULAR") return p.isPopular;
    if (categoryFilter === "FLAGSHIP") return p.category === "flagship";
    if (categoryFilter === "VERIFY") return p.category === "verify";
    if (categoryFilter === "ACCOUNT") return p.category === "account";
    return true;
  });

  const openProductSheet = (product: StoreProduct) => {
    soundFX.play("tap");
    setSelectedProduct(product);
    const firstAvailableVar =
      product.variants?.find((v) => v.stock > 0)?.value ||
      product.variants?.[0]?.value ||
      "";
    setChosenVariant(firstAvailableVar);
    setQuantity(1);
    setOrderError(null);
    setActiveOrder(null);
    setOrderStage("CONFIG");
  };

  const handleCreateOrder = async () => {
    if (!selectedProduct) return;
    soundFX.play("tap");
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

  useEffect(() => {
    if (!activeOrder || (orderStage !== "PAYING" && orderStage !== "AWAITING_CONFIRM")) return;
    const poll = setInterval(async () => {
      try {
        const resp = await fetch(`/api/checkout/orders/${encodeURIComponent(activeOrder.orderId)}`);
        if (!resp.ok) return;
        const data = await resp.json();
        const items: DeliveredItem[] = Array.isArray(data.delivered_items)
          ? data.delivered_items
          : [];
        if (data.status === "paid" && items.length > 0) {
          soundFX.play("success");
          setActiveOrder((prev) => (prev ? { ...prev, deliveredItems: items } : null));
          setOrderStage("SUCCESS");
          clearInterval(poll);
        } else if (data.status === "expired" && orderStage === "PAYING") {
          setOrderStage("EXPIRED");
          clearInterval(poll);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [activeOrder, orderStage]);

  const handleNotifyPaid = async () => {
    if (!activeOrder) return;
    soundFX.play("tap");
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
        soundFX.play("success");
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
    soundFX.play("tap");
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentQrImage =
    qrTab === "alipay"
      ? activeOrder?.alipayQrUrl ||
        contactInfo.alipayQrImage ||
        activeOrder?.qrImageUrl ||
        contactInfo.qrCodeImage
      : activeOrder?.qrImageUrl ||
        contactInfo.qrCodeImage ||
        activeOrder?.alipayQrUrl ||
        contactInfo.alipayQrImage;

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Apple Pay 级高定结算模态弹窗 */}
      {selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="ql-pop relative w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] overflow-y-auto bg-[var(--bg)] border-t sm:border border-[var(--rule-strong)] p-6 sm:p-8 text-[var(--ink)] shadow-2xl">
            <div className="w-10 h-1 bg-[var(--rule-strong)] rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-4 mb-5">
              <div>
                <h3 className="font-serif-editorial text-lg sm:text-xl font-semibold text-[var(--ink)]">
                  {orderStage === "CONFIG" ? "确认选购规格" : "扫码支付与自动发卡"}
                </h3>
                <span className="text-xs text-[var(--ink-3)] block mt-0.5 font-mono">
                  {activeOrder ? `NO. ${activeOrder.orderId}` : selectedProduct.title}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setActiveOrder(null);
                }}
                className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--rule)] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderStage === "CONFIG" ? (
              <div className="space-y-5 text-sm">
                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[var(--ink)] block">{selectedProduct.title}</span>
                    <span className="text-xs text-[var(--ink-3)] mt-0.5 block">{selectedProduct.sub}</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-xs text-[var(--clay)] font-semibold">¥</span>
                    <span className="text-2xl font-bold text-[var(--ink)] ml-0.5">
                      {(parseFloat(selectedProduct.price) * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--ink-2)] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[var(--clay)]" />
                      <span>选择卡头规格（实时库存）</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedProduct.variants.map((v) => (
                        <button
                          key={v.value}
                          type="button"
                          disabled={v.stock <= 0}
                          onClick={() => {
                            soundFX.play("tap");
                            setChosenVariant(v.value);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer disabled:opacity-40 ${
                            chosenVariant === v.value
                              ? "border-[var(--ink)] bg-[var(--bg-card-hover)] shadow-sm"
                              : "border-[var(--rule)] bg-[var(--bg-subtle)] hover:border-[var(--rule-strong)]"
                          }`}
                        >
                          <span className="font-mono font-semibold text-xs block text-[var(--ink)]">
                            BIN {v.label}
                          </span>
                          <span className="text-[11px] text-emerald-500">余 {v.stock} 张</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[var(--ink-2)] block mb-1.5">购买数量</label>
                    <div className="flex items-center border border-[var(--rule-strong)] rounded-xl bg-[var(--bg-field)] overflow-hidden h-11">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3.5 h-full text-[var(--ink-2)] hover:bg-[var(--bg-subtle)] font-semibold"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center tabular-nums font-semibold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) => Math.min(selectedProduct.stock || 20, 20, q + 1))
                        }
                        className="px-3.5 h-full text-[var(--ink-2)] hover:bg-[var(--bg-subtle)] font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-[var(--ink-2)] block mb-1.5">
                      预留微信号或邮箱 <span className="text-[var(--clay)]">(选填·防关页丢单)</span>
                    </label>
                    <input
                      type="text"
                      value={buyerContact}
                      onChange={(e) => setBuyerContact(e.target.value)}
                      placeholder="随时可凭此号码在查单页取回卡密"
                      className="ql-input w-full h-11 px-3.5 text-xs"
                    />
                  </div>
                </div>

                {orderError ? (
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
                    {orderError}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
                  className="ql-shimmer-btn w-full h-12 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform cursor-pointer disabled:opacity-50"
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在锁定库存...</span>
                    </>
                  ) : (
                    <>
                      <span>锁定库存并前往付款</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : null}

            {orderStage === "PAYING" && activeOrder ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-between">
                  <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--clay)]" />
                    <span>订单有效锁单倒计时</span>
                  </span>
                  <span className="font-mono font-bold text-sm tabular-nums text-[var(--ink)]">
                    {formatTime(secondsLeft)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule-strong)] flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-[var(--ink)] block">
                      {activeOrder.product.title} {activeOrder.quantity > 1 ? `× ${activeOrder.quantity}` : ""}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono text-[var(--ink-3)]">
                        {activeOrder.orderId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeOrder.orderId, "orderId")}
                        className="text-[11px] text-[var(--clay)] font-medium hover:underline"
                      >
                        {copiedKey === "orderId" ? "已复制" : "复制单号"}
                      </button>
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-xs font-semibold text-[var(--clay)]">¥</span>
                    <span className="text-2xl font-bold text-[var(--ink)] ml-0.5">
                      {activeOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {activeOrder.qrImageUrl && activeOrder.alipayQrUrl ? (
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)]">
                    <button
                      type="button"
                      onClick={() => setQrTab("wechat")}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                        qrTab === "wechat" ? "bg-emerald-600 text-white" : "text-[var(--ink-2)]"
                      }`}
                    >
                      微信扫码支付
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTab("alipay")}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                        qrTab === "alipay" ? "bg-[#1677ff] text-white" : "text-[var(--ink-2)]"
                      }`}
                    >
                      支付宝扫码支付
                    </button>
                  </div>
                ) : null}

                {currentQrImage ? (
                  <div className="text-center space-y-2 py-1">
                    <div className="w-52 h-52 mx-auto p-3 bg-white rounded-3xl shadow-lg border border-black/5 flex items-center justify-center">
                      <img
                        src={currentQrImage}
                        alt="收款二维码"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <p className="text-xs text-[var(--ink-2)]">
                      请扫码支付 <strong className="text-[var(--clay)]">¥{activeOrder.totalAmount.toFixed(2)}</strong>，备注单号后四位更佳
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule-strong)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--ink)]">添加站长微信转账秒发 (0手续费)</span>
                      <span className="text-[11px] text-emerald-500 font-medium">在线自动出卡</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)]">
                      <span className="font-mono text-sm font-bold text-[var(--ink)]">
                        {contactInfo.wechat}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(contactInfo.wechat, "wechatId")}
                        className="px-3 py-1.5 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === "wechatId" ? "已复制" : "复制微信号"}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 pt-1">
                  <input
                    type="text"
                    value={payerNote}
                    onChange={(e) => setPayerNote(e.target.value)}
                    placeholder="选填：付款人昵称或转账单号后四位"
                    className="ql-input w-full h-10 px-3.5 text-xs"
                  />

                  {orderError ? <div className="text-rose-400 text-xs">{orderError}</div> : null}

                  <button
                    type="button"
                    onClick={handleNotifyPaid}
                    disabled={isNotifyingPaid}
                    className="ql-shimmer-btn w-full h-12 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    {isNotifyingPaid ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>我已完成扫码付款 · 通知系统发卡</span>
                  </button>

                  {activeOrder.sandboxDemoEnabled ? (
                    <button
                      type="button"
                      onClick={handleSandboxSimulate}
                      disabled={isNotifyingPaid}
                      className="w-full py-2 rounded-xl border border-[var(--rule-strong)] text-[var(--ink-2)] text-xs cursor-pointer"
                    >
                      [演示模式] 一键模拟支付成功
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {orderStage === "AWAITING_CONFIRM" && activeOrder ? (
              <div className="py-6 text-center space-y-4 text-xs">
                <div className="w-14 h-14 rounded-full bg-[var(--bg-subtle)] border border-[var(--rule-strong)] flex items-center justify-center mx-auto">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--clay)]" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-serif-editorial text-lg font-semibold text-[var(--ink)]">
                    正在为您核销并自动提取卡密
                  </h4>
                  <p className="text-[var(--ink-2)] leading-relaxed max-w-sm mx-auto">
                    站长手机确认收款后，系统将自动从官方仓调配卡密并<strong>直接在此页面弹出</strong>（每 3 秒自动同步）。
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] text-left space-y-2">
                  <div className="flex items-center justify-between text-[var(--ink-2)]">
                    <span>您的取卡单号（可复制保存）：</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeOrder.orderId, "awaitOrderId")}
                      className="text-[var(--clay)] font-semibold hover:underline"
                    >
                      {copiedKey === "awaitOrderId" ? "已复制" : "复制"}
                    </button>
                  </div>
                  <div className="font-mono text-base font-bold text-[var(--ink)]">
                    {activeOrder.orderId}
                  </div>
                </div>
              </div>
            ) : null}

            {orderStage === "EXPIRED" ? (
              <div className="text-center py-6 space-y-4 text-xs">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className="text-base font-semibold text-[var(--ink)]">锁单时间已到</h4>
                <p className="text-[var(--ink-2)] max-w-xs mx-auto">
                  若尚未付款请重新锁单；若刚完成转账，请联系客服微信 {contactInfo.wechat} 核销发卡。
                </p>
                <button
                  type="button"
                  onClick={() => setOrderStage("CONFIG")}
                  className="px-5 py-2.5 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>重新锁单</span>
                </button>
              </div>
            ) : null}

            {orderStage === "SUCCESS" && activeOrder ? (
              <div className="py-4 space-y-5 text-xs">
                <div className="text-center space-y-1.5">
                  <div className="ql-pop w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif-editorial text-xl font-semibold text-[var(--ink)]">
                    交付完成，请查收您的专属凭证
                  </h4>
                  <p className="text-[var(--ink-3)]">
                    已同步加密存入云端保险柜，随时凭单号 {activeOrder.orderId} 调取
                  </p>
                </div>

                <div className="space-y-3">
                  {activeOrder.deliveredItems.map((item, idx) => {
                    const copyVal = item.copy_text || item.value;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule-strong)] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[var(--ink)]">
                            {item.title || `交付凭证 #${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(copyVal, `deliv_${idx}`)}
                            className="px-3 py-1 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedKey === `deliv_${idx}` ? "已复制" : "一键复制"}</span>
                          </button>
                        </div>
                        <pre className="p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)] font-mono text-xs sm:text-sm font-semibold text-[var(--ink)] whitespace-pre-wrap break-all">
                          {copyVal}
                        </pre>
                        {item.href ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--clay)] font-medium hover:underline"
                          >
                            <span>打开专属链接</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
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
                    className="ql-shimmer-btn w-full h-12 rounded-2xl bg-[var(--clay)] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>带入卡密 · 一键前往自助开通台</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 高定胶囊筛选坞 */}
      <div
        style={{ animationDelay: "380ms" }}
        className="ql-rise flex items-center justify-center gap-2 flex-wrap"
      >
        {[
          { id: "ALL", label: "全部严选", count: products.length },
          { id: "POPULAR", label: "主推爆款", count: products.filter((p) => p.isPopular).length },
          {
            id: "FLAGSHIP",
            label: "AI 旗舰订阅",
            count: products.filter((p) => p.category === "flagship").length,
          },
          {
            id: "VERIFY",
            label: "学生认证 · 接码 · 绑卡",
            count: products.filter((p) => p.category === "verify").length,
          },
          {
            id: "ACCOUNT",
            label: "独享账号与工具",
            count: products.filter((p) => p.category === "account").length,
          },
        ].map((cat) => {
          const active = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                soundFX.play("tap");
                setCategoryFilter(cat.id);
              }}
              className={`px-4 py-2 rounded-full text-xs sm:text-[13px] font-medium transition-all duration-300 cursor-pointer flex items-center gap-2 border ${
                active
                  ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] border-transparent shadow-sm font-semibold"
                  : "bg-[var(--bg-elevated)] text-[var(--ink-2)] hover:text-[var(--ink)] border-[var(--rule)] hover:border-[var(--rule-strong)]"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  active ? "bg-black/15 text-current" : "bg-[var(--bg-subtle)] text-[var(--ink-3)]"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 买手馆级聚光灯商品矩阵 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredProducts.map((p, idx) => {
          const originalNum = parseFloat(p.originalPrice?.replace(/[^\d.]/g, "") || "0");
          const priceNum = parseFloat(p.price);
          const savings = originalNum > priceNum ? Math.round(originalNum - priceNum) : 0;
          const isSoldOut = p.available === false || p.stockStatus === "暂时缺货";
          const visual = getBrandVisual(p);
          const BrandIcon = visual.Icon;

          return (
            <SpotlightCard
              key={p.id}
              delayMs={Math.min(idx * 45, 360)}
              spotlightColor={visual.spotlight}
              featured={Boolean(p.isPopular && !isSoldOut)}
              className={`group p-6 sm:p-7 ${isSoldOut ? "opacity-60" : ""}`}
            >
              <div>
                {/* 卡片顶部：苏哲 v4 风格品牌色彩图标块 + 状态徽章 */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-[16px] flex items-center justify-center border border-[var(--rule)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105"
                    style={{
                      background: visual.tileBg,
                      color: visual.tileColor,
                    }}
                  >
                    <BrandIcon className="w-5 h-5" />
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${
                        p.isPopular
                          ? "border-[var(--clay)]/35 bg-[var(--clay)]/10 text-[var(--clay)] font-semibold"
                          : "border-[var(--rule)] bg-[var(--bg-subtle)] text-[var(--ink-2)]"
                      }`}
                    >
                      {p.badge}
                    </span>
                    <span
                      className={`text-[11px] tabular-nums font-medium ${
                        isSoldOut
                          ? "text-rose-400"
                          : p.stockStatus === "库存紧张"
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      ● {p.stockStatus}
                      {typeof p.stock === "number" && p.stock > 0 ? ` · 余 ${p.stock}` : ""}
                    </span>
                  </div>
                </div>

                {/* 标题与副标题 */}
                <div>
                  <h3 className="text-[17px] sm:text-[18.5px] font-semibold text-[var(--ink)] tracking-tight leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[var(--ink-3)] mt-1">{p.sub}</p>
                </div>

                {/* 价格排版 */}
                <div className="my-5 pb-5 border-b border-[var(--rule)]">
                  <div className="flex items-baseline gap-1.5 tabular-nums">
                    <span className="text-sm font-medium text-[var(--ink-2)]">¥</span>
                    <span className="text-[34px] sm:text-[38px] font-bold text-[var(--ink)] tracking-tight leading-none">
                      {p.price}
                    </span>
                    {p.originalPrice ? (
                      <span className="line-through text-xs text-[var(--ink-3)] ml-1">
                        ¥{p.originalPrice.replace(/[^\d.]/g, "")}
                      </span>
                    ) : null}
                    {savings > 0 ? (
                      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[var(--clay)]/12 text-[var(--clay)] font-semibold ml-1">
                        立省 ¥{savings}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[12.5px] text-[var(--ink-2)] mt-3 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* 精简优雅的亮点列表 */}
                <ul className="space-y-2.5 mb-7">
                  {p.features.slice(0, 4).map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-[12.5px] text-[var(--ink-2)]">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/12 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[2.6]" />
                      </span>
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 底部购买按钮 */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => openProductSheet(p)}
                  className={`w-full h-11 sm:h-12 px-4 rounded-2xl text-[13.5px] font-semibold transition-all flex items-center justify-center gap-2 ${
                    isSoldOut
                      ? "bg-[var(--bg-subtle)] text-[var(--ink-3)] cursor-not-allowed"
                      : p.isPopular
                      ? "ql-shimmer-btn bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] shadow-md hover:opacity-95 active:scale-[0.98] cursor-pointer"
                      : "bg-[var(--bg-subtle)] hover:bg-[var(--btn-primary-bg)] text-[var(--ink)] hover:text-[var(--btn-primary-fg)] border border-[var(--rule-strong)] hover:border-transparent active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  <span>{isSoldOut ? "上游正在补货" : "立即选购"}</span>
                  {!isSoldOut ? <ArrowRight className="w-4 h-4" /> : null}
                </button>

                <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)] px-1">
                  <span>{p.period}</span>
                  <span>{p.requiresActivation ? "站内一键自助开通" : "付款核销即刻提取"}</span>
                </div>
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* 底部买手馆三大承诺条 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
        {[
          {
            icon: ShieldCheck,
            title: "官方正版渠道直连",
            desc: "实时同步上游库存，一人一卡正规结算，绝不混用劣质黑卡",
          },
          {
            icon: Zap,
            title: "7 合 1 零密码优雅开通",
            desc: "粘贴卡密自动匹配专属向导，前置免费体检不扣次数",
          },
          {
            icon: MessageCircle,
            title: "云端加密保险柜存证",
            desc: "所有订单与卡密持久留档，即使关闭网页也可随时一键找回",
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-3xl border border-[var(--rule)] bg-[var(--bg-elevated)] flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-center text-[var(--clay)] flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-[var(--ink)] block">{item.title}</span>
                <span className="text-xs text-[var(--ink-3)] leading-relaxed mt-0.5 block">
                  {item.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
