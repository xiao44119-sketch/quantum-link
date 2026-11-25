import { StoreProduct } from "./types";

export type Locale = "zh" | "en";

export const DEFAULT_USD_RATE = 7.12;

export function formatPriceByLocale(
  cnyStrOrNum: string | number,
  locale: Locale,
  usdRate = DEFAULT_USD_RATE
): { symbol: string; amount: string; code: "CNY" | "USD"; cnyRef: string } {
  const cny = typeof cnyStrOrNum === "number" ? cnyStrOrNum : parseFloat(cnyStrOrNum) || 0;
  if (locale === "en") {
    const usd = cny / (usdRate > 0 ? usdRate : DEFAULT_USD_RATE);
    return {
      symbol: "$",
      amount: usd.toFixed(2),
      code: "USD",
      cnyRef: cny.toFixed(2),
    };
  }
  return {
    symbol: "¥",
    amount: cny % 1 === 0 ? cny.toFixed(0) : cny.toFixed(2),
    code: "CNY",
    cnyRef: cny.toFixed(2),
  };
}

const PRODUCT_EN_MAP: Record<
  string,
  {
    title: string;
    sub: string;
    badge: string;
    description: string;
    features: string[];
    shortTier: string;
  }
> = {
  gpt_plus_ch2: {
    title: "ChatGPT Plus Official Direct Upgrade",
    sub: "Your Own Account · Zero-Password Session Token · Keep All Chats",
    badge: "Best Seller",
    shortTier: "Plus Monthly",
    description:
      "Settled 1-on-1 via legitimate overseas corporate cards. Receive an official PLS- activation key and upgrade your personal ChatGPT account in 1–2 minutes without sharing your password.",
    features: [
      "Upgrades your existing OpenAI account with 100% chat history preserved",
      "Zero-password security protocol — only requires temporary Session JSON",
      "Built-in 24h duplicate guard & free pre-check before consuming your key",
      "Dedicated 1-card-1-account billing with full subscription warranty",
    ],
  },
  sheerid_student_verify_15: {
    title: "Google Gemini Student Verification (SheerID)",
    sub: "Zero Password Required · Submit SheerID Link Only",
    badge: "Trending",
    shortTier: "SheerID Verify",
    description:
      "Official SheerID academic verification for your Google account. Receive your verified Google One AI Premium student claim link within minutes — zero Google password required.",
    features: [
      "Never asks for your Google password — submit only the SheerID verification URL",
      "Automated approval queue returning your official Google claim redirect URL",
      "Auto-refunds key quota if verification times out so you can retry freely",
      "Pair with our Global Virtual Card for seamless 1-stop Google trial binding",
    ],
  },
  gpt_pro_5x_660: {
    title: "ChatGPT Pro 10x Deep Reasoning Tier",
    sub: "Upgraded 10x Quota · Lossless Direct Upgrade from PHP Plus",
    badge: "10x Compute",
    shortTier: "Pro 10x Tier",
    description:
      "10x deep reasoning & coding throughput! Supports fresh activation on free accounts or seamless lossless upgrade on active Philippines (PHP) Plus accounts without cancelling.",
    features: [
      "10x higher o3 / Pro reasoning & coding rate limits during peak hours",
      "Supports direct lossless upgrade from active PHP ChatGPT Plus accounts",
      "Delivers official P10X- activation key with real-time progress telemetry",
      "Ideal price-to-performance tier for full-stack engineers & researchers",
    ],
  },
  gpt_pro_20x_1350: {
    title: "ChatGPT Pro 20x Max Compute Flagship",
    sub: "Unthrottled Flagship Compute · Free or PHP Plus/10x Upgrade",
    badge: "Max Flagship",
    shortTier: "Pro 20x Max",
    description:
      "Built for AI architects, research labs, and heavy agentic workflows. Supports instant activation on free accounts or automatic upgrade from PHP Plus / Pro 10x.",
    features: [
      "20x maximum concurrent compute unlocking full ChatGPT Pro models",
      "Seamless direct upgrade from free accounts or PHP Plus / Pro 10x",
      "Checkpoint resume protection ensuring zero key loss on network hiccups",
      "Official corporate billing with priority SLA warranty",
    ],
  },
  card_virtual_3: {
    title: "Global Virtual Card for AI Subscriptions (Multi-BIN)",
    sub: "5 Clean US/Global BINs · Zero Monthly Fee · Trial Binding Ready",
    badge: "Card Binding",
    shortTier: "Virtual Card",
    description:
      "Clean overseas virtual Visa/Mastercard across 5 selectable BIN ranges. Perfect for binding Google Gemini Student offers, OpenAI API, Cursor, and global SaaS trials.",
    features: [
      "5 clean overseas BIN ranges with real-time per-BIN inventory display",
      "Instant delivery of card number, expiry date, CVV, and billing address",
      "Tested for Google Gemini Student perks, ChatGPT, and developer SaaS",
      "Zero monthly maintenance fee — ready to use out of the box",
    ],
  },
  codex_sms_4: {
    title: "Codex / OpenAI Overseas SMS Verification",
    sub: "Live Web OTP Console · Free Number Switch on Timeout",
    badge: "Instant OTP",
    shortTier: "Overseas SMS",
    description:
      "Dedicated overseas mobile numbers for OpenAI, Codex, Claude, and global AI platform SMS verification. Receive OTP codes live in our browser console.",
    features: [
      "Real-time OTP code reception right inside our 7-in-1 web console",
      "Free number replacement & automatic quota protection if no SMS arrives",
      "High-reputation non-VoIP carrier routes for maximum pass rates",
      "Zero mobile hardware or overseas SIM card required",
    ],
  },
  tg_premium_3m_105: {
    title: "Telegram Premium Official Gift · 3 Months",
    sub: "Direct @Username Provisioning · No Login Needed",
    badge: "3 Months",
    shortTier: "Premium 3M",
    description:
      "Official Telegram Premium 3-month subscription gifted directly to your @username — zero login code or password required.",
    features: [
      "Enter only your public @username for automated official gifting",
      "Unlocks 4GB uploads, voice-to-text, faster downloads & premium badges",
      "100% official Telegram channel with zero ban risk",
      "Instant automated dispatch 24/7",
    ],
  },
  tg_premium_6m_150: {
    title: "Telegram Premium Official Gift · 6 Months",
    sub: "Direct @Username Provisioning · Best Value Half-Year",
    badge: "6 Months",
    shortTier: "Premium 6M",
    description:
      "Official Telegram Premium 6-month subscription delivered straight to your @username without sharing login codes.",
    features: [
      "Zero-login @username direct activation in minutes",
      "Significant savings compared to monthly in-app renewal",
      "Essential for cross-border trade & global community operators",
      "Official gift receipt stored in encrypted cloud vault",
    ],
  },
  tg_premium_12m_240: {
    title: "Telegram Premium Official Gift · 12 Months",
    sub: "Direct @Username Provisioning · Full Annual Pass",
    badge: "Annual Best",
    shortTier: "Premium 12M",
    description:
      "Full 12-month official Telegram Premium membership gifted directly to your @username at wholesale-grade pricing.",
    features: [
      "Lowest monthly cost for global traders & heavy Telegram users",
      "Zero password or SMS login code required — 100% privacy safe",
      "Full annual official Telegram Premium privileges",
      "Instant automated fulfillment",
    ],
  },
  grok_account_50: {
    title: "xAI SuperGrok Official Activation Key",
    sub: "Real-Time X Search & DeepSearch · Zero-Password Cookie Redeem",
    badge: "xAI Flagship",
    shortTier: "SuperGrok Key",
    description:
      "Unlock Elon Musk's xAI SuperGrok tier with DeepSearch, Think mode, and generous image/reasoning quotas via our automated activation studio.",
    features: [
      "Full access to Grok latest flagship reasoning & real-time X intelligence",
      "Free pre-check verifies account eligibility before consuming your key",
      "Automated provisioning in 1–2 minutes via our 7-in-1 studio",
      "Encrypted cloud order vault backup",
    ],
  },
  muse_invite_boost: {
    title: "Muse Compute Boost · +1 Billion Tokens",
    sub: "Instant Invite Code Quota Injection · High-Concurrency Ready",
    badge: "+1B Tokens",
    shortTier: "Muse +1B Tokens",
    description:
      "Inject +1,000,000,000 tokens directly via your Muse invite code in seconds — built for heavy AI coding and content pipelines.",
    features: [
      "Single boost adds +1 Billion token quota immediately",
      "Requires only your invite code — zero account credentials needed",
      "Supports batch multiplier boosts",
      "Instant automated API execution",
    ],
  },
  gemini_pixel_6m_9: {
    title: "Google Gemini Pro · 3-Month Private Plan",
    sub: "2TB Google One Cloud + Gemini Advanced Models",
    badge: "Quarterly",
    shortTier: "Gemini Pro 3M",
    description:
      "3-month private Google Gemini Advanced subscription including 2TB Google One storage and NotebookLM Plus.",
    features: [
      "Private dedicated subscription — never a crowded shared pool",
      "Includes Gemini Pro long-context reasoning & NotebookLM Plus",
      "Automated provisioning via our 7-in-1 activation studio",
      "Full warranty & support ticket coverage",
    ],
  },
  elevenlabs_creator_3m_45: {
    title: "ElevenLabs Creator AI Voice · 3 Months",
    sub: "Multilingual Voice Cloning & Studio Dubbing for Global Video",
    badge: "Creator",
    shortTier: "ElevenLabs 3M",
    description:
      "3-month ElevenLabs Creator subscription — industry-leading multilingual TTS and voice cloning for TikTok, YouTube, and cross-border e-commerce videos.",
    features: [
      "Ultra-realistic 29+ language voice synthesis & voice cloning",
      "Commercial usage rights for global marketing & YouTube creators",
      "Instant credential delivery stored permanently in Cloud Vault",
      "Massive savings vs. official $66 quarterly billing",
    ],
  },
  figma_pro_edu_2y: {
    title: "Figma Professional Plan · 2-Year Pass",
    sub: "Unlimited Files, Dev Mode & Team Libraries",
    badge: "2-Year Pro",
    shortTier: "Figma Pro 2Y",
    description:
      "2-year Figma Professional access unlocking Dev Mode, unlimited projects, and shared design systems for product & independent site teams.",
    features: [
      "Full Figma Professional & Dev Mode capabilities for 24 months",
      "Upgrade on your own account or ready-to-use setup",
      "Ideal for independent brand & UI/UX engineering teams",
      "Instant automated delivery",
    ],
  },
  telegram_us_9900: {
    title: "Clean US (+1) Telegram Ready Account",
    sub: "Aged Clean +1 Number · Instant Session / TData Delivery",
    badge: "US +1 Account",
    shortTier: "US +1 Account",
    description:
      "Clean aged US (+1) Telegram account for cross-border business outreach and global community management.",
    features: [
      "Clean US (+1) registration with high trust score",
      "Instant automated credential delivery upon payment",
      "Ideal for international trade customer communication",
      "Cloud Vault order retrieval anytime",
    ],
  },
  gmail_us_2026_2fa_15: {
    title: "Clean US Google / Gmail Account (2FA Enabled)",
    sub: "Pure US IP Registered · Includes 2FA Secret Key",
    badge: "Clean Gmail",
    shortTier: "US 2FA Gmail",
    description:
      "Freshly maintained US Gmail account with 2FA TOTP secret included — ready for ChatGPT, Gemini, Claude, and overseas SaaS sign-ups.",
    features: [
      "Full ownership — change password and recovery email freely",
      "Includes 2FA authenticator secret for smooth login anywhere",
      "Works seamlessly with Gemini Student Verification & OpenAI",
      "Instant 24/7 automated delivery",
    ],
  },
};

export function localizeProduct(p: StoreProduct, locale: Locale): StoreProduct & { shortTier: string } {
  if (locale === "zh") {
    return {
      ...p,
      shortTier: p.title.slice(0, 11),
    };
  }
  const mapped = PRODUCT_EN_MAP[p.id];
  if (mapped) {
    return {
      ...p,
      title: mapped.title,
      sub: mapped.sub,
      badge: mapped.badge,
      description: mapped.description,
      features: mapped.features,
      shortTier: mapped.shortTier,
    };
  }
  return {
    ...p,
    shortTier: p.id.replace(/_/g, " ").slice(0, 14),
  };
}

export const UI_DICT = {
  zh: {
    brandName: "骁清 FINN",
    brandSub: "Official AI Compute Boutique",
    nav: {
      store: "严选商店",
      storeMobile: "商店",
      redeem: "自助开通",
      redeemMobile: "开通",
      query: "查单取卡",
      queryMobile: "查单",
      syncLive: "SYNC · LIVE",
      lightMode: "雾白",
      darkMode: "黑钛",
      switchToLight: "切换至「冰川雾白」浅色模式",
      switchToDark: "切换至「深空黑钛」暗色模式",
      adminTitle: "站长运营后台",
      langToggleLabel: "EN",
      langToggleTitle: "Switch to English & USD Global Storefront",
    },
    hero: {
      store: {
        eyebrow: "OFFICIAL AI SUPPLY CHAIN · ZERO-PASSWORD PROTOCOL",
        lead: "前沿 AI 旗舰算力，",
        highlight: "秒级直连交付。",
        sub: "直通 OpenAI、Google Gemini、xAI SuperGrok 官方源头仓。零密码安全履约，全单加密存入云端保险柜。",
        ctaRedeem: "已购卡密？一键进入 7 合 1 全自动开通台",
      },
      redeem: {
        eyebrow: "7-IN-1 AUTONOMOUS ACTIVATION ENGINE",
        lead: "粘贴专属卡密，",
        highlight: "全自动无感开通。",
        sub: "无需提供聊天账号密码，智能识别 7 大产品线档位，前置体检零损耗、实时追踪履约进度。",
        ctaRedeem: "",
      },
      query: {
        eyebrow: "SUPABASE ENCRYPTED ORDER VAULT",
        lead: "订单与激活凭证，",
        highlight: "随时一键溯源。",
        sub: "输入本站 QL 订单号、预留微信号或任意卡密，即时调取云端加密存档与上游核验记录。",
        ctaRedeem: "",
      },
    },
  },
  en: {
    brandName: "FINN QUANTUM",
    brandSub: "Global AI Compute & SaaS Desk",
    nav: {
      store: "Storefront",
      storeMobile: "Store",
      redeem: "Activate",
      redeemMobile: "Redeem",
      query: "Order Vault",
      queryMobile: "Vault",
      syncLive: "GLOBAL · LIVE",
      lightMode: "Light",
      darkMode: "Dark",
      switchToLight: "Switch to Glacier Mist Light Mode",
      switchToDark: "Switch to Cold Titanium Dark Mode",
      adminTitle: "Admin Console",
      langToggleLabel: "中文",
      langToggleTitle: "切换回中文人民币主站",
    },
    hero: {
      store: {
        eyebrow: "GLOBAL AI INFRASTRUCTURE · ZERO-PASSWORD PROVISIONING",
        lead: "Flagship AI Compute, ",
        highlight: "Delivered in Seconds.",
        sub: "Direct official fulfillment for ChatGPT Pro 10x/20x, Google Gemini Student Verification, SuperGrok & Virtual Cards. Zero-password security backed by encrypted Cloud Vault.",
        ctaRedeem: "Already have an activation key? Open 7-in-1 Studio",
      },
      redeem: {
        eyebrow: "7-IN-1 AUTONOMOUS PROVISIONING STUDIO",
        lead: "Paste Your Key, ",
        highlight: "Activate Instantly.",
        sub: "Zero account password required. Auto-detects all 7 AI product lines with free eligibility pre-check and live telemetry.",
        ctaRedeem: "",
      },
      query: {
        eyebrow: "ENCRYPTED CLOUD ORDER VAULT",
        lead: "Orders & Keys, ",
        highlight: "Instant Retrieval.",
        sub: "Enter your QL Order ID, contact handle, or activation key to retrieve credentials and live upstream status anytime.",
        ctaRedeem: "",
      },
    },
  },
} as const;
