"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  ArrowRight,
  Clock,
  X,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Layers,
  LayoutGrid,
  ShieldCheck,
  MessageSquare,
  Send,
  Globe,
} from "lucide-react";
import { STORE_PRODUCTS as FALLBACK_PRODUCTS } from "@/config/store-products";
import { DeliveredItem, StoreContact, StoreProduct } from "@/lib/types";
import { SpotlightCard } from "./SpotlightCard";
import { BrandEmblem, BrandHouseKey } from "./BrandEmblems";
import { soundFX } from "@/lib/tactile-feedback";
import {
  DEFAULT_USD_RATE,
  formatPriceByLocale,
  Locale,
  localizeProduct,
} from "@/lib/i18n";

interface Props {
  onGoToRedeem: (cdkOrPrefix?: string) => void;
  onHoverAccent?: (hex: string | null) => void;
  entranceBaseDelayMs?: number;
  locale?: Locale;
}

type OrderStage = "CONFIG" | "PAYING" | "AWAITING_CONFIRM" | "EXPIRED" | "SUCCESS";

interface ActiveCheckoutOrder {
  orderId: string;
  product: StoreProduct;
  variant: string;
  quantity: number;
  totalAmount: number; // CNY amount returned by backend
  expiresIn: number;
  qrImageUrl?: string | null;
  alipayQrUrl?: string | null;
  sandboxDemoEnabled?: boolean;
  requiresActivation?: boolean;
  deliveredItems: DeliveredItem[];
}

interface BrandGalleryGroup {
  key: BrandHouseKey;
  name: string;
  nameEn: string;
  eyebrow: string;
  tagline: string;
  taglineEn: string;
  accentHex: string;
  spotlightRgba: string;
  featured?: boolean;
  items: StoreProduct[];
}

function classifyBrandHouse(p: StoreProduct): BrandHouseKey {
  const id = p.id.toLowerCase();
  if (id.startsWith("gpt_")) return "openai";
  if (id.includes("sheerid") || id.includes("gemini") || id.includes("gmail")) return "gemini";
  if (id.includes("grok")) return "grok";
  if (id.includes("card_virtual") || id.includes("sms")) return "card_sms";
  if (id.startsWith("tg_") || id.includes("telegram")) return "telegram";
  return "creative";
}

const HOUSE_META: Record<BrandHouseKey, Omit<BrandGalleryGroup, "items">> = {
  openai: {
    key: "openai",
    name: "ChatGPT 官方旗舰订阅",
    nameEn: "OpenAI ChatGPT Flagship",
    eyebrow: "OPENAI OFFICIAL",
    tagline: "Plus 零密码代充 · Pro 10x / 20x 满血算力无损直升",
    taglineEn: "Zero-Password Plus Upgrade · Lossless Pro 10x / 20x Compute Tiers",
    accentHex: "#10B981",
    spotlightRgba: "rgba(16, 185, 129, 0.19)",
    featured: true,
  },
  gemini: {
    key: "gemini",
    name: "Gemini Pro & 学生认证",
    nameEn: "Google Gemini & SheerID",
    eyebrow: "GOOGLE AI ECOSYSTEM",
    tagline: "SheerID 免密链接过审 · Gemini Pro 季卡 · 美区 2FA 谷歌号",
    taglineEn: "Zero-Password SheerID Student Verify · Gemini Pro · Clean US Gmail",
    accentHex: "#818CF8",
    spotlightRgba: "rgba(129, 140, 248, 0.2)",
    featured: true,
  },
  grok: {
    key: "grok",
    name: "xAI SuperGrok 订阅",
    nameEn: "xAI SuperGrok Official",
    eyebrow: "XAI SUPERGROK",
    tagline: "深度联网实时搜索与无限制推理 · 免密卡密秒级直充",
    taglineEn: "Real-Time X DeepSearch & Think Mode · Instant Activation Key",
    accentHex: "#E2E8F0",
    spotlightRgba: "rgba(226, 232, 240, 0.16)",
  },
  card_sms: {
    key: "card_sms",
    name: "海外绑卡虚拟卡 & 接码",
    nameEn: "Global Virtual Cards & OTP",
    eyebrow: "VIRTUAL CARD & SMS",
    tagline: "5 大纯净 BIN 卡头 · 谷歌/OpenAI 试用绑卡与实时短信验证",
    taglineEn: "5 Clean US/Global BINs for AI Trials · Live Overseas SMS Console",
    accentHex: "#38BDF8",
    spotlightRgba: "rgba(56, 189, 248, 0.2)",
    featured: true,
  },
  telegram: {
    key: "telegram",
    name: "Telegram 会员与美区号",
    nameEn: "Telegram Premium & US +1",
    eyebrow: "TELEGRAM PREMIUM",
    tagline: "3 / 6 / 12 个月官方会员 @用户名免登直充 · +1 纯净成品号",
    taglineEn: "3 / 6 / 12M Official @Username Direct Gift · Clean US (+1) Accounts",
    accentHex: "#0EA5E9",
    spotlightRgba: "rgba(14, 165, 233, 0.19)",
  },
  creative: {
    key: "creative",
    name: "AI 创作与算力加速包",
    nameEn: "Creator AI & Token Boost",
    eyebrow: "CREATOR & TOKEN BOOST",
    tagline: "Muse 单次 +10亿 Token · ElevenLabs 语音 · Figma 教育版",
    taglineEn: "Muse +1B Tokens · ElevenLabs Multilingual Voice · Figma Pro 2Y",
    accentHex: "#A855F7",
    spotlightRgba: "rgba(168, 85, 247, 0.19)",
  },
};

const HOUSE_ORDER: BrandHouseKey[] = [
  "openai",
  "gemini",
  "card_sms",
  "grok",
  "telegram",
  "creative",
];

function shortTierLabelZh(p: StoreProduct): string {
  const id = p.id.toLowerCase();
  if (id === "gpt_plus_ch2") return "Plus 月卡直充";
  if (id === "gpt_pro_5x_660") return "Pro 10x 推理版";
  if (id === "gpt_pro_20x_1350") return "Pro 20x 满血版";
  if (id.includes("sheerid")) return "SheerID 学生认证";
  if (id.includes("gemini_pixel")) return "Gemini Pro 季卡";
  if (id.includes("gmail")) return "美区 Gmail 成品号";
  if (id.includes("card_virtual")) return "海外绑卡虚拟卡";
  if (id.includes("codex_sms")) return "Codex 海外接码";
  if (id.includes("tg_premium_3m")) return "Premium 3个月";
  if (id.includes("tg_premium_6m")) return "Premium 6个月";
  if (id.includes("tg_premium_12m")) return "Premium 12个月";
  if (id.includes("telegram_us")) return "+1 美区成品号";
  if (id.includes("grok")) return "SuperGrok 激活码";
  if (id.includes("muse")) return "Muse +10亿 Token";
  if (id.includes("elevenlabs")) return "ElevenLabs 季卡";
  if (id.includes("figma")) return "Figma Pro 2年";
  return p.title.slice(0, 12);
}

export const StorePricingCabin: React.FC<Props> = ({
  onGoToRedeem,
  onHoverAccent,
  entranceBaseDelayMs = 0,
  locale = "zh",
}) => {
  const isEn = locale === "en";
  const [products, setProducts] = useState<StoreProduct[]>(FALLBACK_PRODUCTS);
  const [contactInfo, setContactInfo] = useState<StoreContact>({
    wechat: "18300425760",
    whatsapp: "8618300425760",
    telegramChannel: "https://t.me/finn_vibe_link",
    email: "support@quantum-link.io",
    usdExchangeRate: DEFAULT_USD_RATE,
    qrNote: "微信 / 支付宝扫码付款（备注单号秒发卡）",
    noticeText: "",
  });
  const [sandboxDemoEnabled, setSandboxDemoEnabled] = useState(false);

  const [viewMode, setViewMode] = useState<"gallery" | "all">("gallery");
  const [activeHouseKey, setActiveHouseKey] = useState<BrandHouseKey | null>(null);
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

  const usdRate = contactInfo.usdExchangeRate || DEFAULT_USD_RATE;

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

  const galleryGroups: BrandGalleryGroup[] = useMemo(() => {
    const bucket: Record<BrandHouseKey, StoreProduct[]> = {
      openai: [],
      gemini: [],
      grok: [],
      card_sms: [],
      telegram: [],
      creative: [],
    };
    for (const p of products) {
      bucket[classifyBrandHouse(p)].push(p);
    }
    return HOUSE_ORDER.map((k) => ({
      ...HOUSE_META[k],
      items: bucket[k],
    })).filter((g) => g.items.length > 0);
  }, [products]);

  const activeGroup = useMemo(
    () => galleryGroups.find((g) => g.key === activeHouseKey) || null,
    [galleryGroups, activeHouseKey]
  );

  const selectSkuInsideModal = (product: StoreProduct) => {
    soundFX.play("tap");
    setSelectedProduct(product);
    const firstAvailableVar =
      product.variants?.find((v) => v.stock > 0)?.value ||
      product.variants?.[0]?.value ||
      "";
    setChosenVariant(firstAvailableVar);
    setQuantity(1);
    setOrderError(null);
  };

  const openHouseDrawer = (group: BrandGalleryGroup, initialSku?: StoreProduct) => {
    soundFX.play("switch");
    setActiveHouseKey(group.key);
    const target =
      initialSku ||
      group.items.find((i) => (i.stock ?? 1) > 0) ||
      group.items[0];
    if (target) {
      selectSkuInsideModal(target);
    }
    setActiveOrder(null);
    setOrderStage("CONFIG");
  };

  const openSingleSkuDirectly = (product: StoreProduct) => {
    const houseKey = classifyBrandHouse(product);
    const group = galleryGroups.find((g) => g.key === houseKey);
    if (group) {
      openHouseDrawer(group, product);
    } else {
      selectSkuInsideModal(product);
      setActiveOrder(null);
      setOrderStage("CONFIG");
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setActiveHouseKey(null);
    setActiveOrder(null);
    setOrderError(null);
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
        setOrderError(
          isEn
            ? "Failed to lock inventory. Please try another tier."
            : data.detail || data.error || "创建订单失败"
        );
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
      if (isEn && nextOrder.alipayQrUrl) {
        setQrTab("alipay");
      } else if (!nextOrder.qrImageUrl && nextOrder.alipayQrUrl) {
        setQrTab("alipay");
      } else {
        setQrTab("wechat");
      }
    } catch {
      setOrderError(isEn ? "Network error, please retry." : "网络请求异常，请稍后重试");
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
          payer_note:
            payerNote.trim() ||
            (isEn ? "Global buyer completed payment" : "买家已扫码转账"),
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setOrderStage("AWAITING_CONFIRM");
      } else {
        setOrderError(data.detail || (isEn ? "Submission failed" : "提交失败，请重试"));
      }
    } catch {
      setOrderError(isEn ? "Network error" : "提交异常，请检查网络");
    } finally {
      setIsNotifyingPaid(false);
    }
  };

  const handleSandboxSimulate = async () => {
    if (!activeOrder) return;
    setIsNotifyingPaid(true);
    try {
      const resp = await fetch(
        `/api/checkout/orders?orderId=${encodeURIComponent(activeOrder.orderId)}`,
        { method: "PUT" }
      );
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

  const localizedSelected = selectedProduct
    ? localizeProduct(selectedProduct, locale)
    : null;

  const whatsappDigits = (
    contactInfo.whatsapp || `86${contactInfo.wechat || "18300425760"}`
  ).replace(/[^\d]/g, "");

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* 顶部极简视图控制栏 */}
      <div
        style={{ animationDelay: `${entranceBaseDelayMs + 280}ms` }}
        className="ql-rise flex items-center justify-between gap-3 px-1"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 ql-halo-dot" />
          <span className="text-xs sm:text-[13px] font-medium text-[var(--ink-2)]">
            {isEn
              ? "6 Official AI Suites · Select a Brand House to Choose Your Tier"
              : "六大官方直连数字馆 · 点选品牌进入面值规格仓"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFX.play("switch");
            setViewMode((v) => (v === "gallery" ? "all" : "gallery"));
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--rule)] hover:border-[var(--rule-strong)] bg-[var(--bg-subtle)] text-[11.5px] text-[var(--ink-2)] hover:text-[var(--ink)] transition-all cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[var(--clay)]" />
          <span>
            {viewMode === "gallery"
              ? isEn
                ? `View All ${products.length} SKUs`
                : `展开全部 ${products.length} 款单品`
              : isEn
                ? "Back to Brand Gallery"
                : "返回极简品牌画廊"}
          </span>
        </button>
      </div>

      {/* ==================== 模式 A：极简 6 大核心品牌画廊大卡 ==================== */}
      {viewMode === "gallery" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {galleryGroups.map((group, idx) => {
            const minPriceCny = Math.min(
              ...group.items.map((p) => parseFloat(p.price) || 9999)
            );
            const minDisplay = formatPriceByLocale(minPriceCny, locale, usdRate);
            const totalStock = group.items.reduce(
              (acc, item) => acc + (typeof item.stock === "number" ? item.stock : 50),
              0
            );
            const soldOut = totalStock <= 0;

            return (
              <SpotlightCard
                key={group.key}
                enableTilt={true}
                featured={group.featured}
                spotlightColor={group.spotlightRgba}
                delayMs={entranceBaseDelayMs + 340 + idx * 65}
                onClick={() => openHouseDrawer(group)}
                onMouseEnterCard={() => onHoverAccent?.(group.accentHex)}
                onMouseLeaveCard={() => onHoverAccent?.(null)}
                className="group p-6 sm:p-7 cursor-pointer select-none min-h-[278px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <BrandEmblem brand={group.key} size="lg" />

                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border border-[var(--rule-strong)] bg-[var(--bg-subtle)] text-[var(--ink-2)]">
                        {isEn ? `${group.items.length} Tiers` : `${group.items.length} 款规格可选`}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ink-3)]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            soldOut ? "bg-rose-400" : "bg-emerald-400"
                          }`}
                        />
                        <span>
                          {soldOut
                            ? isEn
                              ? "Restocking"
                              : "补货中"
                            : isEn
                              ? `${totalStock}+ In Stock`
                              : `实时余量 ${totalStock}+`}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <span
                      className="text-[10.5px] font-mono tracking-[0.18em] uppercase block mb-1.5"
                      style={{ color: group.accentHex }}
                    >
                      {group.eyebrow}
                    </span>
                    <h2 className="text-xl sm:text-[22px] font-semibold tracking-tight text-[var(--ink)] group-hover:translate-x-0.5 transition-transform">
                      {isEn ? group.nameEn : group.name}
                    </h2>
                    <p className="text-xs sm:text-[13px] leading-relaxed text-[var(--ink-2)] mt-2 line-clamp-2">
                      {isEn ? group.taglineEn : group.tagline}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {group.items.slice(0, 3).map((sku) => {
                      const locSku = localizeProduct(sku, locale);
                      return (
                        <button
                          key={sku.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openHouseDrawer(group, sku);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[var(--rule)] hover:border-[var(--rule-strong)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] text-[11px] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                        >
                          {isEn ? locSku.shortTier : shortTierLabelZh(sku)}
                        </button>
                      );
                    })}
                    {group.items.length > 3 ? (
                      <span className="px-2 py-1 text-[11px] text-[var(--ink-3)]">
                        +{group.items.length - 3}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--rule)] flex items-end justify-between gap-3">
                  <div className="tabular-nums">
                    <span className="text-[11px] text-[var(--ink-3)] block mb-0.5">
                      {isEn ? "Official Direct From" : "官方直连严选价"}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-semibold text-[var(--ink-2)]">
                        {minDisplay.symbol}
                      </span>
                      <span className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                        {minDisplay.amount}
                      </span>
                      {isEn ? (
                        <span className="text-[11px] text-[var(--ink-3)] font-mono">USD</span>
                      ) : group.items.length > 1 ? (
                        <span className="text-xs text-[var(--ink-3)] ml-0.5">起</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--bg-subtle)] group-hover:bg-[var(--btn-primary-bg)] text-[var(--ink)] group-hover:text-[var(--btn-primary-fg)] border border-[var(--rule-strong)] group-hover:border-transparent text-xs font-semibold transition-all duration-300">
                    <span>{isEn ? "Select Tier" : "选择规格"}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      ) : (
        /* ==================== 模式 B：紧凑全量单品矩阵 ==================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((raw, idx) => {
            const p = localizeProduct(raw, locale);
            const house = classifyBrandHouse(raw);
            const meta = HOUSE_META[house];
            const outOfStock = typeof raw.stock === "number" && raw.stock <= 0;
            const pDisp = formatPriceByLocale(raw.price, locale, usdRate);
            return (
              <SpotlightCard
                key={raw.id}
                spotlightColor={meta.spotlightRgba}
                delayMs={idx * 25}
                onClick={() => openSingleSkuDirectly(raw)}
                className="p-5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BrandEmblem brand={house} size="md" />
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--ink)] leading-snug">
                        {p.title}
                      </h3>
                      <span className="text-[11px] text-[var(--ink-3)] line-clamp-1 mt-0.5 block">
                        {p.sub}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--rule)] flex items-center justify-between">
                  <div className="tabular-nums flex items-baseline gap-1">
                    <span className="text-xs text-[var(--clay)] font-semibold">{pDisp.symbol}</span>
                    <span className="text-lg font-bold text-[var(--ink)]">{pDisp.amount}</span>
                    {isEn ? (
                      <span className="text-[10.5px] text-[var(--ink-3)] font-mono">USD</span>
                    ) : null}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      outOfStock ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {outOfStock
                      ? isEn
                        ? "Out of Stock"
                        : "暂时缺货"
                      : typeof raw.stock === "number"
                        ? isEn
                          ? `${raw.stock} Left →`
                          : `余 ${raw.stock} · 选购 →`
                        : isEn
                          ? "Instant →"
                          : "极速秒发 →"}
                  </span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}

      {/* ==================== Linear / Apple Store 级规格抽屉与跨境收银台 ==================== */}
      {selectedProduct && localizedSelected ? (
        <div
          onClick={closeModal}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/72 backdrop-blur-xl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="ql-pop relative w-full max-w-xl rounded-t-[26px] sm:rounded-[26px] max-h-[92vh] overflow-y-auto bg-[var(--bg)] border-t sm:border border-[var(--rule-strong)] p-5 sm:p-6 text-[var(--ink)] shadow-2xl"
          >
            <div className="w-10 h-1 bg-[var(--rule-strong)] rounded-full mx-auto mb-3 sm:hidden" />

            {/* 模态框头部 */}
            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3.5 mb-4">
              <div className="flex items-center gap-3">
                <BrandEmblem
                  brand={activeGroup?.key || classifyBrandHouse(selectedProduct)}
                  size="md"
                />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--ink)]">
                    {orderStage === "CONFIG"
                      ? isEn
                        ? activeGroup?.nameEn || localizedSelected.title
                        : activeGroup?.name || localizedSelected.title
                      : isEn
                        ? "Global Checkout & Instant Delivery"
                        : "扫码收银与自动发卡"}
                  </h3>
                  <span className="text-[11.5px] text-[var(--ink-3)] block font-mono">
                    {activeOrder
                      ? `ORDER · ${activeOrder.orderId}`
                      : isEn
                        ? "Zero-Password Provisioning · Cloud Vault Protected"
                        : "官方正版源头仓实时锁单 · 零密码安全交付"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--rule)] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderStage === "CONFIG" ? (
              <div className="space-y-4 text-sm">
                {/* 1. 大类下具体面值规格切换矩阵 */}
                {activeGroup && activeGroup.items.length > 1 ? (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--ink-2)] flex items-center justify-between">
                      <span>{isEn ? "Select Plan / Tier" : "选择具体套餐规格"}</span>
                      <span className="text-[11px] text-[var(--ink-3)]">
                        {isEn
                          ? `${activeGroup.items.length} options available`
                          : `共 ${activeGroup.items.length} 款细分档位`}
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeGroup.items.map((rawSku) => {
                        const sku = localizeProduct(rawSku, locale);
                        const isSelected = rawSku.id === selectedProduct.id;
                        const skuOut = typeof rawSku.stock === "number" && rawSku.stock <= 0;
                        const skuPrice = formatPriceByLocale(rawSku.price, locale, usdRate);
                        return (
                          <button
                            key={rawSku.id}
                            type="button"
                            onClick={() => selectSkuInsideModal(rawSku)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                              isSelected
                                ? "border-[var(--clay)] bg-[var(--bg-card-hover)] shadow-[0_0_0_1px_var(--clay)]"
                                : "border-[var(--rule)] bg-[var(--bg-subtle)] hover:border-[var(--rule-strong)]"
                            } ${skuOut ? "opacity-55" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-xs sm:text-[13px] text-[var(--ink)] leading-snug pr-4">
                                {sku.title}
                              </span>
                              {isSelected ? (
                                <span className="ql-pop w-4 h-4 rounded-full bg-[var(--clay)] text-slate-950 flex items-center justify-center flex-shrink-0">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-2.5 flex items-baseline justify-between tabular-nums">
                              <div>
                                <span className="text-[11px] text-[var(--clay)] font-semibold">
                                  {skuPrice.symbol}
                                </span>
                                <span className="text-base font-bold text-[var(--ink)] ml-0.5">
                                  {skuPrice.amount}
                                </span>
                                {isEn ? (
                                  <span className="text-[10px] text-[var(--ink-3)] ml-1 font-mono">
                                    USD
                                  </span>
                                ) : rawSku.originalPrice ? (
                                  <span className="text-[10.5px] text-[var(--ink-3)] line-through ml-1.5">
                                    ¥{rawSku.originalPrice}
                                  </span>
                                ) : null}
                              </div>
                              <span
                                className={`text-[10.5px] ${
                                  skuOut ? "text-rose-400" : "text-emerald-400"
                                }`}
                              >
                                {skuOut
                                  ? isEn
                                    ? "Sold out"
                                    : "缺货"
                                  : typeof rawSku.stock === "number"
                                    ? isEn
                                      ? `${rawSku.stock} left`
                                      : `余 ${rawSku.stock}`
                                    : isEn
                                      ? "In stock"
                                      : "现货"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* 2. 当前选中规格详情 */}
                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[var(--ink)]">
                          {localizedSelected.title}
                        </span>
                        {localizedSelected.badge ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-400/25">
                            {localizedSelected.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-[var(--ink-2)] mt-1 leading-relaxed">
                        {localizedSelected.description}
                      </p>
                    </div>
                  </div>

                  {localizedSelected.features && localizedSelected.features.length > 0 ? (
                    <div className="pt-2 border-t border-[var(--rule)] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {localizedSelected.features.slice(0, 4).map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-1.5 text-[11.5px] text-[var(--ink-2)]"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* 3. 多卡头子规格 */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--ink-2)] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[var(--clay)]" />
                      <span>
                        {isEn ? "Select Card BIN Range (Live Stock)" : "选择卡头 BIN 段（实时库存）"}
                      </span>
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
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-40 ${
                            chosenVariant === v.value
                              ? "border-[var(--clay)] bg-[var(--bg-card-hover)]"
                              : "border-[var(--rule)] bg-[var(--bg-subtle)] hover:border-[var(--rule-strong)]"
                          }`}
                        >
                          <span className="font-mono font-semibold text-xs block text-[var(--ink)]">
                            BIN {v.label}
                          </span>
                          <span className="text-[10.5px] text-emerald-400">
                            {isEn ? `${v.stock} left` : `余 ${v.stock} 张`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 4. 购买数量与预留查询凭证 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[var(--ink-2)] block mb-1.5">
                      {isEn ? "Quantity" : "购买数量"}
                    </label>
                    <div className="flex items-center border border-[var(--rule-strong)] rounded-xl bg-[var(--bg-field)] overflow-hidden h-11">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3.5 h-full text-[var(--ink-2)] hover:bg-[var(--bg-subtle)] font-semibold cursor-pointer"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center tabular-nums font-semibold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) =>
                            Math.min(selectedProduct.stock || 20, 20, q + 1)
                          )
                        }
                        className="px-3.5 h-full text-[var(--ink-2)] hover:bg-[var(--bg-subtle)] font-semibold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-[var(--ink-2)] block mb-1.5">
                      {isEn ? "Email / WhatsApp / Telegram " : "预留微信号或邮箱 "}
                      <span className="text-[var(--clay)]">
                        {isEn ? "(For Order Vault Lookup)" : "(选填·防关页丢单)"}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={buyerContact}
                      onChange={(e) => setBuyerContact(e.target.value)}
                      placeholder={
                        isEn
                          ? "Retrieve your key anytime with this handle"
                          : "凭此号码可随时在「查单取卡」找回卡密"
                      }
                      className="ql-input w-full h-11 px-3.5 text-xs"
                    />
                  </div>
                </div>

                {orderError ? (
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
                    {orderError}
                  </div>
                ) : null}

                {/* 5. 结算提交栏 */}
                {(() => {
                  const totalCny = parseFloat(selectedProduct.price) * quantity;
                  const totalDisp = formatPriceByLocale(totalCny, locale, usdRate);
                  return (
                    <div className="pt-1 flex items-center justify-between gap-4">
                      <div className="tabular-nums">
                        <span className="text-[11px] text-[var(--ink-3)] block">
                          {isEn ? "Total Due" : "应付总额"}
                        </span>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-xs font-semibold text-[var(--clay)]">
                            {totalDisp.symbol}
                          </span>
                          <span className="text-2xl font-bold text-[var(--ink)]">
                            {totalDisp.amount}
                          </span>
                          {isEn ? (
                            <span className="text-[11px] text-[var(--ink-3)] ml-1 font-mono">
                              USD
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateOrder}
                        disabled={
                          isCreatingOrder ||
                          (typeof selectedProduct.stock === "number" &&
                            selectedProduct.stock <= 0)
                        }
                        className="ql-shimmer-btn flex-1 h-12 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform cursor-pointer disabled:opacity-50"
                      >
                        {isCreatingOrder ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{isEn ? "Locking Stock..." : "正在锁定库存..."}</span>
                          </>
                        ) : typeof selectedProduct.stock === "number" &&
                          selectedProduct.stock <= 0 ? (
                          <span>{isEn ? "Out of Stock" : "当前规格暂时缺货"}</span>
                        ) : (
                          <>
                            <span>
                              {isEn ? "Lock Stock & Proceed to Pay" : "锁定库存并扫码支付"}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            ) : null}

            {orderStage === "PAYING" && activeOrder ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-between">
                  <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--clay)]" />
                    <span>
                      {isEn ? "Inventory Lock Countdown" : "订单有效锁单倒计时"}
                    </span>
                  </span>
                  <span className="font-mono font-bold text-sm tabular-nums text-[var(--ink)]">
                    {formatTime(secondsLeft)}
                  </span>
                </div>

                {(() => {
                  const ordDisp = formatPriceByLocale(activeOrder.totalAmount, locale, usdRate);
                  const locOrdProd = localizeProduct(activeOrder.product, locale);
                  const waPrefill = encodeURIComponent(
                    `Hi Finn! I locked Order ${activeOrder.orderId} for ${locOrdProd.title} ($${ordDisp.amount} USD / ¥${activeOrder.totalAmount.toFixed(2)} CNY). Please share PayPal / USDT / Wise payment details.`
                  );

                  return (
                    <>
                      <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule-strong)] flex items-center justify-between">
                        <div>
                          <span className="text-sm font-semibold text-[var(--ink)] block">
                            {locOrdProd.title}{" "}
                            {activeOrder.quantity > 1 ? `× ${activeOrder.quantity}` : ""}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-mono text-[var(--ink-3)]">
                              {activeOrder.orderId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(activeOrder.orderId, "orderId")}
                              className="text-[11px] text-[var(--clay)] font-medium hover:underline cursor-pointer"
                            >
                              {copiedKey === "orderId"
                                ? isEn
                                  ? "Copied"
                                  : "已复制"
                                : isEn
                                  ? "Copy ID"
                                  : "复制单号"}
                            </button>
                          </div>
                        </div>
                        <div className="text-right tabular-nums">
                          <div>
                            <span className="text-xs font-semibold text-[var(--clay)]">
                              {ordDisp.symbol}
                            </span>
                            <span className="text-2xl font-bold text-[var(--ink)] ml-0.5">
                              {ordDisp.amount}
                            </span>
                          </div>
                          {isEn ? (
                            <span className="text-[10.5px] text-[var(--ink-3)] font-mono">
                              ≈ ¥{activeOrder.totalAmount.toFixed(2)} CNY
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* 英文态专属：海外外贸客户一键 WhatsApp / Telegram / USDT 通道 */}
                      {isEn ? (
                        <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-400/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-sky-400" />
                              <span>Global Payment Options (USD / USDT / Card)</span>
                            </span>
                            <span className="text-[10.5px] text-emerald-400 font-medium">
                              Instant Desk
                            </span>
                          </div>
                          <p className="text-[11.5px] text-[var(--ink-2)] leading-relaxed">
                            Scan below with <strong>Alipay / WeChat Pay (supports foreign Visa & Mastercard)</strong>, or tap below to pay in <strong>USD / USDT / PayPal</strong>:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={`https://wa.me/${whatsappDigits}?text=${waPrefill}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp Pay</span>
                            </a>
                            <a
                              href={contactInfo.telegramChannel || "https://t.me/finn_vibe_link"}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-3 rounded-xl bg-[#0EA5E9] hover:bg-sky-400 text-white font-semibold inline-flex items-center justify-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Telegram Desk</span>
                            </a>
                          </div>
                          {contactInfo.usdtTrc20 ? (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)] font-mono text-[11px]">
                              <span className="truncate pr-2">
                                USDT (TRC20): {contactInfo.usdtTrc20}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(contactInfo.usdtTrc20 || "", "usdtAddr")
                                }
                                className="px-2 py-1 rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-sans font-semibold flex-shrink-0 cursor-pointer"
                              >
                                {copiedKey === "usdtAddr" ? "Copied" : "Copy"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {activeOrder.qrImageUrl && activeOrder.alipayQrUrl ? (
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)]">
                          <button
                            type="button"
                            onClick={() => setQrTab("wechat")}
                            className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              qrTab === "wechat"
                                ? "bg-emerald-600 text-white"
                                : "text-[var(--ink-2)]"
                            }`}
                          >
                            {isEn ? "WeChat Pay QR" : "微信扫码支付"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setQrTab("alipay")}
                            className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              qrTab === "alipay"
                                ? "bg-[#1677ff] text-white"
                                : "text-[var(--ink-2)]"
                            }`}
                          >
                            {isEn ? "Alipay (Intl Card OK)" : "支付宝扫码支付"}
                          </button>
                        </div>
                      ) : null}

                      {currentQrImage ? (
                        <div className="text-center space-y-2 py-1">
                          <div className="w-48 h-48 mx-auto p-3 bg-white rounded-3xl shadow-lg border border-black/5 flex items-center justify-center">
                            <img
                              src={currentQrImage}
                              alt="Payment QR"
                              className="w-full h-full object-contain rounded-xl"
                            />
                          </div>
                          <p className="text-xs text-[var(--ink-2)]">
                            {isEn ? (
                              <>
                                Scan QR to pay{" "}
                                <strong className="text-[var(--clay)]">
                                  ¥{activeOrder.totalAmount.toFixed(2)} CNY (≈ ${ordDisp.amount} USD)
                                </strong>
                              </>
                            ) : (
                              <>
                                请扫码支付{" "}
                                <strong className="text-[var(--clay)]">
                                  ¥{activeOrder.totalAmount.toFixed(2)}
                                </strong>
                                ，备注单号后四位核销更快
                              </>
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule-strong)] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--ink)]">
                              {isEn
                                ? "Connect Direct to Complete Payment"
                                : "添加站长微信转账秒发 (0手续费)"}
                            </span>
                            <span className="text-[11px] text-emerald-400 font-medium">
                              {isEn ? "Online" : "在线自动出卡"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)]">
                            <span className="font-mono text-sm font-bold text-[var(--ink)]">
                              {contactInfo.wechat}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(contactInfo.wechat, "wechatId")}
                              className="px-3 py-1.5 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>
                                {copiedKey === "wechatId"
                                  ? isEn
                                    ? "Copied"
                                    : "已复制"
                                  : isEn
                                    ? "Copy ID"
                                    : "复制微信号"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="space-y-2.5 pt-1">
                  <input
                    type="text"
                    value={payerNote}
                    onChange={(e) => setPayerNote(e.target.value)}
                    placeholder={
                      isEn
                        ? "Optional: Payer name / TxID / Last 4 digits"
                        : "选填：付款人昵称或转账单号后四位"
                    }
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
                    <span>
                      {isEn
                        ? "I Have Completed Payment · Dispatch Key"
                        : "我已完成扫码付款 · 通知系统发卡"}
                    </span>
                  </button>

                  {activeOrder.sandboxDemoEnabled ? (
                    <button
                      type="button"
                      onClick={handleSandboxSimulate}
                      disabled={isNotifyingPaid}
                      className="w-full py-2 rounded-xl border border-[var(--rule-strong)] text-[var(--ink-2)] text-xs cursor-pointer"
                    >
                      {isEn ? "[Sandbox] Simulate Instant Payment" : "[演示模式] 一键模拟支付成功"}
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
                  <h4 className="text-lg font-semibold text-[var(--ink)]">
                    {isEn
                      ? "Verifying Payment & Dispatching Official Key"
                      : "正在核销并从官方仓实时提卡"}
                  </h4>
                  <p className="text-[var(--ink-2)] leading-relaxed max-w-sm mx-auto">
                    {isEn
                      ? "Operator has received an instant mobile alert! Your activation key will pop up right on this screen automatically (syncs every 3s)."
                      : "站长手机已收到实时强弹窗提醒！确认到账后卡密将直接在此页面自动弹出（每 3 秒自动刷新）。"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] text-left space-y-2">
                  <div className="flex items-center justify-between text-[var(--ink-2)]">
                    <span>
                      {isEn ? "Save your Order ID for Vault lookup:" : "您的取卡单号（可复制留存）："}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeOrder.orderId, "awaitOrderId")}
                      className="text-[var(--clay)] font-semibold hover:underline cursor-pointer"
                    >
                      {copiedKey === "awaitOrderId"
                        ? isEn
                          ? "Copied"
                          : "已复制"
                        : isEn
                          ? "Copy"
                          : "复制"}
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
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-base font-semibold text-[var(--ink)]">
                  {isEn ? "Order Lock Expired" : "锁单时间已到"}
                </h4>
                <p className="text-[var(--ink-2)] max-w-xs mx-auto">
                  {isEn
                    ? "Please lock stock again if you haven't paid, or contact support if you already transferred."
                    : `若尚未付款请重新锁单；若刚完成转账，请联系客服微信 ${contactInfo.wechat} 核销发卡。`}
                </p>
                <button
                  type="button"
                  onClick={() => setOrderStage("CONFIG")}
                  className="px-5 py-2.5 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isEn ? "Lock Again" : "重新锁单"}</span>
                </button>
              </div>
            ) : null}

            {orderStage === "SUCCESS" && activeOrder ? (
              <div className="py-4 space-y-5 text-xs">
                <div className="text-center space-y-1.5">
                  <div className="ql-pop w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-semibold text-[var(--ink)]">
                    {isEn ? "Delivered! Here Is Your Official Key" : "交付完成，请查收专属凭证"}
                  </h4>
                  <p className="text-[var(--ink-3)]">
                    {isEn
                      ? `Encrypted in Cloud Vault under Order ${activeOrder.orderId}`
                      : `已加密存入 Supabase 云端保险柜，随时凭单号 ${activeOrder.orderId} 调取`}
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
                            {isEn
                              ? `Credential #${idx + 1}`
                              : item.title || `交付凭证 #${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(copyVal, `deliv_${idx}`)}
                            className="px-3 py-1 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>
                              {copiedKey === `deliv_${idx}`
                                ? isEn
                                  ? "Copied"
                                  : "已复制"
                                : isEn
                                  ? "Copy"
                                  : "一键复制"}
                            </span>
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
                            <span>{isEn ? "Open Claim Link" : "打开专属链接"}</span>
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
                      closeModal();
                      onGoToRedeem(firstCdk);
                    }}
                    className="ql-shimmer-btn w-full h-12 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <span>
                      {isEn
                        ? "Auto-Fill Key & Open 7-in-1 Activation Studio"
                        : "带入卡密 · 一键前往 7 合 1 自助开通台"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
