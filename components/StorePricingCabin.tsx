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
  ShieldCheck,
  MessageSquare,
  Send,
  Globe,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { STORE_PRODUCTS as FALLBACK_PRODUCTS } from "@/config/store-products";
import { DeliveredItem, StoreContact, StoreProduct } from "@/lib/types";
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
  totalAmount: number;
  expiresIn: number;
  qrImageUrl?: string | null;
  alipayQrUrl?: string | null;
  sandboxDemoEnabled?: boolean;
  requiresActivation?: boolean;
  deliveredItems: DeliveredItem[];
}

interface BrandGalleryGroup {
  key: BrandHouseKey;
  indexLabel: string;
  shortNav: string;
  shortNavEn: string;
  name: string;
  nameEn: string;
  eyebrow: string;
  tagline: string;
  taglineEn: string;
  accentHex: string;
  stageGrad: string;
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

const HOUSE_META: Record<BrandHouseKey, Omit<BrandGalleryGroup, "items" | "indexLabel">> = {
  openai: {
    key: "openai",
    shortNav: "ChatGPT 旗舰",
    shortNavEn: "ChatGPT Pro",
    name: "ChatGPT 官方旗舰订阅",
    nameEn: "OpenAI ChatGPT Flagship",
    eyebrow: "OPENAI OFFICIAL",
    tagline: "Plus 零密码代充 · Pro 10x / 20x 满血算力无损直升 · 保留全部历史对话",
    taglineEn: "Zero-Password Plus Direct Upgrade · Lossless Pro 10x / 20x Compute",
    accentHex: "#10B981",
    stageGrad:
      "radial-gradient(ellipse 85% 75% at 80% 15%, rgba(16, 185, 129, 0.28) 0%, rgba(15, 17, 19, 0) 62%), radial-gradient(ellipse 65% 65% at 12% 85%, rgba(251, 81, 35, 0.14) 0%, rgba(15, 17, 19, 0) 60%)",
  },
  gemini: {
    key: "gemini",
    shortNav: "Gemini 学生认证",
    shortNavEn: "Gemini & SheerID",
    name: "Gemini Pro & 学生身份认证",
    nameEn: "Google Gemini & SheerID",
    eyebrow: "GOOGLE AI ECOSYSTEM",
    tagline: "SheerID 免密链接过审 · Gemini Pro 季卡独享 · 美区 2FA 纯净谷歌号",
    taglineEn: "Zero-Password SheerID Verification · Gemini Pro 3M · Clean US Gmail",
    accentHex: "#6366F1",
    stageGrad:
      "radial-gradient(ellipse 85% 75% at 82% 18%, rgba(99, 102, 241, 0.3) 0%, rgba(15, 17, 19, 0) 62%), radial-gradient(ellipse 60% 60% at 15% 85%, rgba(56, 189, 248, 0.16) 0%, rgba(15, 17, 19, 0) 60%)",
  },
  card_sms: {
    key: "card_sms",
    shortNav: "虚拟卡 · 接码",
    shortNavEn: "Virtual Card & OTP",
    name: "海外绑卡虚拟卡 & Codex 接码",
    nameEn: "Global Virtual Cards & OTP",
    eyebrow: "VIRTUAL CARD & SMS",
    tagline: "5 大纯净 BIN 0月租虚拟卡 · 谷歌/OpenAI 绑卡神器与实时在线接码",
    taglineEn: "5 Clean US/Global BINs for AI Trials · Live Web Overseas SMS OTP",
    accentHex: "#FB5123",
    stageGrad:
      "radial-gradient(ellipse 85% 75% at 78% 18%, rgba(251, 81, 35, 0.28) 0%, rgba(15, 17, 19, 0) 62%), radial-gradient(ellipse 60% 60% at 18% 85%, rgba(228, 178, 116, 0.18) 0%, rgba(15, 17, 19, 0) 60%)",
  },
  grok: {
    key: "grok",
    shortNav: "xAI SuperGrok",
    shortNavEn: "xAI SuperGrok",
    name: "xAI SuperGrok 官方订阅",
    nameEn: "xAI SuperGrok Official",
    eyebrow: "XAI SUPERGROK",
    tagline: "实时全网 DeepSearch 与深度逻辑推理 · 四档免费预检免密激活",
    taglineEn: "Real-Time X DeepSearch & Think Mode · Free Eligibility Pre-Check",
    accentHex: "#E4B274",
    stageGrad:
      "radial-gradient(ellipse 85% 75% at 80% 18%, rgba(228, 178, 116, 0.24) 0%, rgba(15, 17, 19, 0) 62%), radial-gradient(ellipse 60% 60% at 15% 85%, rgba(148, 163, 184, 0.16) 0%, rgba(15, 17, 19, 0) 60%)",
  },
  telegram: {
    key: "telegram",
    shortNav: "Telegram 会员",
    shortNavEn: "TG Premium",
    name: "Telegram 官方会员 & 美区号",
    nameEn: "Telegram Premium & US +1",
    eyebrow: "TELEGRAM PREMIUM",
    tagline: "3 / 6 / 12 个月官方会员 @用户名免登空投 · +1 美区纯净成品号",
    taglineEn: "3 / 6 / 12M Official @Username Direct Gift · Aged Clean US (+1)",
    accentHex: "#0EA5E9",
    stageGrad:
      "radial-gradient(ellipse 85% 75% at 80% 18%, rgba(14, 165, 233, 0.28) 0%, rgba(15, 17, 19, 0) 62%), radial-gradient(ellipse 60% 60% at 15% 85%, rgba(56, 189, 248, 0.14) 0%, rgba(15, 17, 19, 0) 60%)",
  },
  creative: {
    key: "creative",
    shortNav: "创作与算力包",
    shortNavEn: "Creator AI Pack",
    name: "AI 创作与算力加速工具馆",
    nameEn: "Creator AI & Token Boost",
    eyebrow: "CREATOR & TOKEN BOOST",
    tagline: "Muse 单次 +10亿 Token · ElevenLabs 多语种配音 · Figma Pro 2年",
    taglineEn: "Muse +1B Tokens · ElevenLabs Multilingual Voice · Figma Pro 2Y",
    accentHex: "#A855F7",
    stageGrad:
      "radial-gradient(ellipse 85% 75% at 80% 18%, rgba(168, 85, 247, 0.28) 0%, rgba(15, 17, 19, 0) 62%), radial-gradient(ellipse 60% 60% at 15% 85%, rgba(251, 81, 35, 0.15) 0%, rgba(15, 17, 19, 0) 60%)",
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
  if (id === "gpt_pro_5x_660") return "Pro 10x 深度版";
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

  // VidMuse 导演台当前选中场景索引 (0..5) 与场景内选中的具体规格 ID
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [stageSkuId, setStageSkuId] = useState<string>("gpt_plus_ch2");
  const [elapsedSec, setElapsedSec] = useState<number>(12);

  // 收银台模态弹窗状态
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

  // 左下角 VidMuse 风格极克制影棚时间码跳动
  useEffect(() => {
    const t = setInterval(() => setElapsedSec((s) => (s + 1) % 3600), 1000);
    return () => clearInterval(t);
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
    return HOUSE_ORDER.map((k, idx) => ({
      ...HOUSE_META[k],
      indexLabel: String(idx + 1).padStart(2, "0"),
      items: bucket[k],
    })).filter((g) => g.items.length > 0);
  }, [products]);

  const safeStageIdx = Math.min(stageIndex, Math.max(0, galleryGroups.length - 1));
  const currentStageGroup = galleryGroups[safeStageIdx] || galleryGroups[0];

  // 当前舞台视窗内选中的具体 SKU
  const stageSku = useMemo(() => {
    if (!currentStageGroup) return null;
    return (
      currentStageGroup.items.find((i) => i.id === stageSkuId) ||
      currentStageGroup.items[0] ||
      null
    );
  }, [currentStageGroup, stageSkuId]);

  // 切换品牌馆时同步通知底层 3D 粒子场变换边缘氛围泛光
  const handleSelectStage = (idx: number) => {
    const nextIdx = (idx + galleryGroups.length) % galleryGroups.length;
    soundFX.play("switch");
    setStageIndex(nextIdx);
    const grp = galleryGroups[nextIdx];
    if (grp) {
      const firstAvail = grp.items.find((i) => (i.stock ?? 1) > 0) || grp.items[0];
      if (firstAvail) setStageSkuId(firstAvail.id);
      onHoverAccent?.(grp.accentHex);
    }
  };

  // 支持键盘上下方向键切景（致敬 VidMuse 导演台手感）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedProduct) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleSelectStage(safeStageIdx + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleSelectStage(safeStageIdx - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [safeStageIdx, galleryGroups.length, selectedProduct]);

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

  const localizedStageSku = stageSku ? localizeProduct(stageSku, locale) : null;
  const stagePriceDisp = stageSku
    ? formatPriceByLocale(stageSku.price, locale, usdRate)
    : null;

  const whatsappDigits = (
    contactInfo.whatsapp || `86${contactInfo.wechat || "18300425760"}`
  ).replace(/[^\d]/g, "");

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* ========================================================================
          VidMuse × Sand.ai 旗舰级「大画幅电影选景交互台」
          左侧 70% 弧角黑胶视窗（含实时档位直切 + 底部磨砂控制胶囊）
          右侧 30% [ 01 / 06 ] 摄影机直角取景框场景轨道
         ======================================================================== */}
      {currentStageGroup && stageSku && localizedStageSku && stagePriceDisp ? (
        <section
          style={{ animationDelay: `${entranceBaseDelayMs + 280}ms` }}
          className="ql-rise space-y-5"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-stretch">
            {/* 左侧 8 列：大画幅电影级展示视窗（深色影棚底，浅色纸面下更具 Sand.ai 画册反差高级感） */}
            <div
              key={currentStageGroup.key}
              className="lg:col-span-8 relative rounded-[26px] sm:rounded-[30px] overflow-hidden border border-white/10 bg-[#121418] text-white shadow-[0_32px_80px_-28px_rgba(0,0,0,0.65)] min-h-[390px] sm:min-h-[420px] flex flex-col justify-between p-5 sm:p-7"
            >
              {/* 动态品牌电影棚氛围光晕 + 精密光学同心圆装饰 */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-opacity duration-700"
                style={{ background: currentStageGroup.stageGrad }}
              />
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 w-[420px] h-[420px] opacity-[0.07] text-white"
                viewBox="0 0 400 400"
                fill="none"
              >
                <circle cx="200" cy="200" r="185" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
                <circle cx="200" cy="200" r="130" stroke="currentColor" strokeWidth="1" />
                <circle cx="200" cy="200" r="76" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
                <line x1="200" y1="0" x2="200" y2="400" stroke="currentColor" strokeWidth="0.6" />
                <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeWidth="0.6" />
              </svg>

              {/* 视窗顶部：品牌高精度徽标 + 实时源头仓状态 */}
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <BrandEmblem brand={currentStageGroup.key} size="lg" />
                  <div>
                    <span
                      className="text-[10.5px] font-mono tracking-[0.2em] uppercase block"
                      style={{ color: currentStageGroup.accentHex }}
                    >
                      {currentStageGroup.eyebrow}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          typeof stageSku.stock === "number" && stageSku.stock <= 0
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                      />
                      <span className="text-xs text-white/70 font-mono">
                        {typeof stageSku.stock === "number" && stageSku.stock <= 0
                          ? isEn
                            ? "RESTOCKING · TRY ANOTHER TIER BELOW"
                            : "当前规格补货中 · 可切换下方现货档位"
                          : isEn
                            ? `LIVE STOCK · ${typeof stageSku.stock === "number" ? stageSku.stock : "99+"} AVAILABLE`
                            : `官方实时现货 · 余 ${typeof stageSku.stock === "number" ? stageSku.stock : "99+"}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 右上角切景快捷箭头 */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectStage(safeStageIdx - 1)}
                    className="w-8 h-8 rounded-full border border-white/15 bg-white/[0.05] hover:bg-white/[0.12] flex items-center justify-center text-white/80 transition-colors cursor-pointer"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectStage(safeStageIdx + 1)}
                    className="w-8 h-8 rounded-full border border-white/15 bg-white/[0.05] hover:bg-white/[0.12] flex items-center justify-center text-white/80 transition-colors cursor-pointer"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 视窗中段：大标题 + 精炼利益点 + 视窗内直切规格档位 */}
              <div className="relative z-10 my-6 space-y-5">
                <div className="space-y-2 max-w-xl">
                  <h2 className="text-2xl sm:text-[32px] font-bold tracking-[-0.03em] text-white leading-tight">
                    {isEn ? currentStageGroup.nameEn : currentStageGroup.name}
                  </h2>
                  <p className="text-xs sm:text-[14px] text-white/70 leading-relaxed">
                    {isEn ? currentStageGroup.taglineEn : currentStageGroup.tagline}
                  </p>
                </div>

                {/* 直接在主视窗内优雅切换该品牌下的具体面值规格 */}
                <div className="flex flex-wrap gap-2">
                  {currentStageGroup.items.map((sku) => {
                    const active = sku.id === stageSku.id;
                    const loc = localizeProduct(sku, locale);
                    const sp = formatPriceByLocale(sku.price, locale, usdRate);
                    return (
                      <button
                        key={sku.id}
                        type="button"
                        onClick={() => {
                          soundFX.play("tap");
                          setStageSkuId(sku.id);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 border ${
                          active
                            ? "bg-white text-[#0f1113] border-white shadow-lg font-semibold"
                            : "bg-white/[0.06] text-white/80 border-white/10 hover:bg-white/[0.12] hover:border-white/20"
                        }`}
                      >
                        <span>{isEn ? loc.shortTier : shortTierLabelZh(sku)}</span>
                        <span
                          className={`font-mono text-[11px] tabular-nums ${
                            active ? "text-[#fb5123] font-bold" : "text-white/55"
                          }`}
                        >
                          {sp.symbol}
                          {sp.amount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 视窗底部：VidMuse 招牌磨砂玻璃悬浮控制胶囊（一句话权益 + 单价 + 亮朱红行动钮） */}
              <div className="relative z-10 rounded-2xl border border-white/15 bg-black/45 backdrop-blur-2xl p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">
                      {localizedStageSku.title}
                    </span>
                    {localizedStageSku.badge ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/85">
                        {localizedStageSku.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-white/65 line-clamp-1">
                    {localizedStageSku.features?.[0] || localizedStageSku.sub}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                  <div className="tabular-nums text-left sm:text-right">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xs text-[#e4b274] font-semibold">
                        {stagePriceDisp.symbol}
                      </span>
                      <span className="text-2xl font-bold tracking-tight text-white">
                        {stagePriceDisp.amount}
                      </span>
                      {isEn ? (
                        <span className="text-[10px] font-mono text-white/55 ml-1">USD</span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openHouseDrawer(currentStageGroup, stageSku)}
                    className="ql-shimmer-btn h-11 px-6 rounded-xl bg-[#fb5123] hover:bg-[#ff6236] text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-[0_12px_28px_-8px_rgba(251,81,35,0.6)] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>{isEn ? "Order Now" : "立即选购"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧 4 列：VidMuse 招牌 [ 01 / 06 ] 摄影机直角取景框垂直选景轨道 */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-3">
              {/* 顶部数字指示器 */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span className="text-2xl font-bold text-[var(--ink)]">
                    {currentStageGroup.indexLabel}
                  </span>
                  <span className="text-xs text-[var(--ink-3)]">
                    / {String(galleryGroups.length).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-[var(--ink-3)]">
                  {isEn ? "SELECT SUITE · ↑↓" : "点选或 ↑↓ 切景"}
                </span>
              </div>

              {/* 6 大品牌垂直极简选景条 */}
              <div className="flex-1 flex flex-col justify-between gap-2">
                {galleryGroups.map((group, idx) => {
                  const isActive = idx === safeStageIdx;
                  const minCny = Math.min(...group.items.map((p) => parseFloat(p.price) || 9999));
                  const minDisp = formatPriceByLocale(minCny, locale, usdRate);

                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => handleSelectStage(idx)}
                      className={`group w-full text-left px-3 py-2 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                        isActive
                          ? "vm-viewfinder bg-[var(--bg-card-hover)] border-[var(--rule-strong)] shadow-sm"
                          : "bg-[var(--bg-card)] border-[var(--rule)] opacity-85 hover:opacity-100 hover:border-[var(--rule-strong)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`font-mono text-[11px] tabular-nums ${
                            isActive ? "text-[var(--vermilion)] font-bold" : "text-[var(--ink-3)]"
                          }`}
                        >
                          {group.indexLabel}
                        </span>
                        <BrandEmblem brand={group.key} size="md" />
                        <div className="min-w-0">
                          <span className="text-[13.5px] font-semibold text-[var(--ink)] block truncate">
                            {isEn ? group.shortNavEn : group.shortNav}
                          </span>
                          <span className="text-[11px] text-[var(--ink-3)] block truncate">
                            {isEn ? `${group.items.length} plans` : `${group.items.length} 款实时规格`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono tabular-nums flex-shrink-0">
                        <span
                          className={`text-xs font-semibold ${
                            isActive ? "text-[var(--ink)]" : "text-[var(--ink-2)]"
                          }`}
                        >
                          {minDisp.symbol}
                          {minDisp.amount}
                        </span>
                        {group.items.length > 1 && !isEn ? (
                          <span className="text-[10px] text-[var(--ink-3)] ml-0.5">起</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* VidMuse 招牌底部极简摄影机时间码 + 水平刻度标尺 */}
          <div className="pt-1 flex items-center justify-between gap-4 text-[11px] font-mono text-[var(--ink-3)] select-none">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--vermilion)] ql-halo-dot" />
              <span>LIVE</span>
              <span className="tabular-nums opacity-75">{formatTime(elapsedSec)}</span>
            </div>

            {/* 水平精确分度标尺（点击刻度亦可切景） */}
            <div className="hidden sm:flex items-end gap-3.5">
              {galleryGroups.map((g, idx) => {
                const active = idx === safeStageIdx;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => handleSelectStage(idx)}
                    className="group flex flex-col items-center gap-1 cursor-pointer"
                    title={isEn ? g.shortNavEn : g.shortNav}
                  >
                    <span
                      className={`text-[10px] tabular-nums transition-colors ${
                        active
                          ? "text-[var(--ink)] font-bold"
                          : "text-[var(--ink-3)] group-hover:text-[var(--ink-2)]"
                      }`}
                    >
                      {g.indexLabel}
                    </span>
                    <span
                      className={`w-[1.5px] rounded-full transition-all duration-300 ${
                        active ? "h-4 bg-[var(--vermilion)]" : "h-2 bg-[var(--rule-strong)]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onGoToRedeem()}
              className="inline-flex items-center gap-1 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[var(--vermilion)]" />
              <span>{isEn ? "7-in-1 Activation Studio →" : "已有卡密？进开通台 →"}</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* ========================================================================
          Sand.ai 画册级精简全品直览区（信息极度克制，单卡仅 4 要素，方便老客速览全目录）
         ======================================================================== */}
      <section className="space-y-6 pt-4 border-t border-[var(--rule)]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-[var(--vermilion)] block">
              {isEn ? "COMPLETE CATALOG" : "ALL DIRECT INVENTORY"}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] mt-1">
              {isEn
                ? `All ${products.length} Official SKUs · Live Upstream Sync`
                : `全部 ${products.length} 款官方直连规格 · 实时库存一览`}
            </h2>
          </div>
          <span className="text-xs text-[var(--ink-3)]">
            {isEn
              ? "Zero-password token provisioning · Click any item for instant checkout"
              : "零密码安全交付 · 点击任意单品直接扫码锁单"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {products.map((raw) => {
            const p = localizeProduct(raw, locale);
            const house = classifyBrandHouse(raw);
            const outOfStock = typeof raw.stock === "number" && raw.stock <= 0;
            const pDisp = formatPriceByLocale(raw.price, locale, usdRate);

            return (
              <button
                key={raw.id}
                type="button"
                onClick={() => openSingleSkuDirectly(raw)}
                className="ql-card group p-4 sm:p-5 rounded-2xl text-left flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <BrandEmblem brand={house} size="md" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[var(--ink)] leading-snug group-hover:text-[var(--vermilion)] transition-colors truncate">
                      {p.title}
                    </h3>
                    <p className="text-xs text-[var(--ink-3)] line-clamp-1 mt-1">
                      {p.sub}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--rule)] flex items-center justify-between tabular-nums">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-[var(--ink-2)]">
                      {pDisp.symbol}
                    </span>
                    <span className="text-lg font-bold text-[var(--ink)]">{pDisp.amount}</span>
                    {isEn ? (
                      <span className="text-[10px] text-[var(--ink-3)] font-mono">USD</span>
                    ) : raw.originalPrice ? (
                      <span className="text-[11px] text-[var(--ink-3)] line-through ml-1">
                        ¥{raw.originalPrice}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`text-[11.5px] font-medium inline-flex items-center gap-1 ${
                      outOfStock ? "text-rose-400" : "text-[var(--ink-2)] group-hover:text-[var(--ink)]"
                    }`}
                  >
                    <span>
                      {outOfStock
                        ? isEn
                          ? "Sold Out"
                          : "补货中"
                        : typeof raw.stock === "number"
                          ? isEn
                            ? `${raw.stock} left`
                            : `余 ${raw.stock}`
                          : isEn
                            ? "Instant"
                            : "现货"}
                    </span>
                    {!outOfStock ? (
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--vermilion)] group-hover:translate-x-0.5 transition-transform" />
                    ) : null}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================== Sand.ai / Apple Store 级规格抽屉与跨境收银台 ==================== */}
      {selectedProduct && localizedSelected ? (
        <div
          onClick={closeModal}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="ql-pop relative w-full max-w-xl rounded-t-[26px] sm:rounded-[26px] max-h-[92vh] overflow-y-auto bg-[var(--bg)] border-t sm:border border-[var(--rule-strong)] p-5 sm:p-6 text-[var(--ink)] shadow-2xl"
          >
            <div className="w-10 h-1 bg-[var(--rule-strong)] rounded-full mx-auto mb-3 sm:hidden" />

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
                {activeGroup && activeGroup.items.length > 1 ? (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--ink-2)] flex items-center justify-between">
                      <span>{isEn ? "Select Plan / Tier" : "选择具体套餐规格"}</span>
                      <span className="text-[11px] text-[var(--ink-3)]">
                        {isEn
                          ? `${activeGroup.items.length} options`
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
                                ? "border-[var(--vermilion)] bg-[var(--bg-card-hover)] shadow-[0_0_0_1px_var(--vermilion)]"
                                : "border-[var(--rule)] bg-[var(--bg-subtle)] hover:border-[var(--rule-strong)]"
                            } ${skuOut ? "opacity-55" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-xs sm:text-[13px] text-[var(--ink)] leading-snug pr-4">
                                {sku.title}
                              </span>
                              {isSelected ? (
                                <span className="ql-pop w-4 h-4 rounded-full bg-[var(--vermilion)] text-white flex items-center justify-center flex-shrink-0">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-2.5 flex items-baseline justify-between tabular-nums">
                              <div>
                                <span className="text-[11px] text-[var(--vermilion)] font-semibold">
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
                                  skuOut ? "text-rose-400" : "text-emerald-500"
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

                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--ink)]">
                      {localizedSelected.title}
                    </span>
                    {localizedSelected.badge ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--vermilion)]/15 text-[var(--vermilion)] border border-[var(--vermilion)]/25">
                        {localizedSelected.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                    {localizedSelected.description}
                  </p>

                  {localizedSelected.features && localizedSelected.features.length > 0 ? (
                    <div className="pt-2 border-t border-[var(--rule)] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {localizedSelected.features.slice(0, 4).map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-1.5 text-[11.5px] text-[var(--ink-2)]"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--ink-2)] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[var(--vermilion)]" />
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
                              ? "border-[var(--vermilion)] bg-[var(--bg-card-hover)]"
                              : "border-[var(--rule)] bg-[var(--bg-subtle)] hover:border-[var(--rule-strong)]"
                          }`}
                        >
                          <span className="font-mono font-semibold text-xs block text-[var(--ink)]">
                            BIN {v.label}
                          </span>
                          <span className="text-[10.5px] text-emerald-500">
                            {isEn ? `${v.stock} left` : `余 ${v.stock} 张`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

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
                      {isEn ? "Email / WhatsApp / WeChat " : "预留微信号或邮箱 "}
                      <span className="text-[var(--vermilion)]">
                        {isEn ? "(For Vault Lookup)" : "(选填·防关页丢单)"}
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
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs">
                    {orderError}
                  </div>
                ) : null}

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
                          <span className="text-xs font-semibold text-[var(--vermilion)]">
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
                        className="ql-shimmer-btn flex-1 h-12 rounded-2xl bg-[#fb5123] hover:bg-[#ff6236] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
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
                    <Clock className="w-3.5 h-3.5 text-[var(--vermilion)]" />
                    <span>{isEn ? "Inventory Lock Countdown" : "订单有效锁单倒计时"}</span>
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
                              className="text-[11px] text-[var(--vermilion)] font-medium hover:underline cursor-pointer"
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
                            <span className="text-xs font-semibold text-[var(--vermilion)]">
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

                      {isEn ? (
                        <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule-strong)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-[var(--vermilion)]" />
                              <span>Global Payment Options (USD / USDT / Card)</span>
                            </span>
                            <span className="text-[10.5px] text-emerald-500 font-medium">
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
                                <strong className="text-[var(--vermilion)]">
                                  ¥{activeOrder.totalAmount.toFixed(2)} CNY (≈ ${ordDisp.amount} USD)
                                </strong>
                              </>
                            ) : (
                              <>
                                请扫码支付{" "}
                                <strong className="text-[var(--vermilion)]">
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
                            <span className="text-[11px] text-emerald-500 font-medium">
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

                  {orderError ? <div className="text-rose-500 text-xs">{orderError}</div> : null}

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
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--vermilion)]" />
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
                      : "站长手机已收到微信实时提醒！确认到账后卡密将直接在此页面自动弹出（每 3 秒自动刷新）。"}
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
                      className="text-[var(--vermilion)] font-semibold hover:underline cursor-pointer"
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
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
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
                  <div className="ql-pop w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
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
                            className="inline-flex items-center gap-1 text-[var(--vermilion)] font-medium hover:underline"
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
                    className="ql-shimmer-btn w-full h-12 rounded-2xl bg-[#fb5123] hover:bg-[#ff6236] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-lg cursor-pointer"
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
