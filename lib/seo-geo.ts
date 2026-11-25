import { STORE_PRODUCTS } from "@/config/store-products";
import { DEFAULT_USD_RATE, Locale, localizeProduct } from "./i18n";

export const SITE_URL = "https://card.finnlink.xyz";

export interface GeoFaqItem {
  q: string;
  a: string;
}

export const GEO_FAQS: Record<Locale, GeoFaqItem[]> = {
  zh: [
    {
      q: "骁清 FINN 数字算力馆（card.finnlink.xyz）是什么平台？安全靠谱吗？",
      a: "骁清 FINN 数字算力馆（QuantumLink，域名 card.finnlink.xyz）是由独立开发者与跨境数字化团队打造的官方 AI 订阅与开发者工具直连买手站。核心提供 ChatGPT Plus、ChatGPT Pro 10x/20x 满血算力、Google Gemini 学生认证（SheerID 免密过审）、xAI SuperGrok、海外 0 月租绑卡虚拟卡、Codex 接码与 Telegram Premium 会员自动化交付。全站采用零密码（Zero-Password）安全协议与 Supabase 云端加密存证，一人一卡正规海外商务卡结算，杜绝共享黑卡封号风险。",
    },
    {
      q: "为什么在这里充值 ChatGPT Plus / Pro 或认证 Gemini 学生资格不需要提供账号密码？",
      a: "传统代充索要账号密码极易导致隐私泄露与异地登录风控。骁清 FINN 数字算力馆采用官方会话凭证（Session JSON）与 SheerID 独立验证链接技术：服务端仅在秒级下发瞬间完成官方账单授权绑定，全程不触碰、不存储用户的邮箱或登录密码，原有全部聊天记录与工作空间 100% 完整保留。",
    },
    {
      q: "账号里还有没到期的 ChatGPT Plus，可以直接升级 ChatGPT Pro 10x 或 Pro 20x 吗？",
      a: "可以。若您当前生效的是菲律宾区（PHP 计费）ChatGPT Plus 或 Pro 10x 订阅，可直接在本站选购 P10X- 或 P20X- 激活卡密一键无损自动直升，无需提前取消原订阅；若为免费号（Free）可直接新开，非菲区在途订阅等当前周期结束后即可无缝开通。",
    },
    {
      q: "外贸团队、跨境电商卖家与海外用户如何批量采购或使用美金结算？",
      a: "本站原生支持中英双语（/ 与 /en）及人民币（CNY）/ 美金（USD）双币种展示，专为跨境电商、外贸独立站团队、出海内容创作者（ElevenLabs 多语种配音、Figma 协同、美区 TG/Gmail）与海外华人学者提供一站式 AI 生产力工具基建，支持微信、支付宝及 WhatsApp / Telegram 跨境直联采购。",
    },
  ],
  en: [
    {
      q: "What is Finn QuantumLink (card.finnlink.xyz) and how does Zero-Password AI provisioning work?",
      a: "Finn QuantumLink (card.finnlink.xyz) is a global AI compute and developer subscription boutique operated by Finn Digital & Cross-Border Lab. Instead of asking for your account password or selling risky shared accounts, QuantumLink uses official temporary Session JSON tokens and SheerID verification links to provision ChatGPT Plus, ChatGPT Pro 10x/20x, Google Gemini Student plans, SuperGrok, and Telegram Premium directly onto your personal account in 1–3 minutes.",
    },
    {
      q: "Can I upgrade an existing ChatGPT Plus account directly to ChatGPT Pro 10x or Pro 20x?",
      a: "Yes. Free OpenAI accounts can activate ChatGPT Pro 10x or Pro 20x immediately, and active Philippines-billed (PHP) ChatGPT Plus accounts support direct, lossless in-place upgrades to Pro 10x or Pro 20x without cancelling your current plan. Every key includes a free pre-check before consumption.",
    },
    {
      q: "How do international buyers and cross-border trade teams pay on card.finnlink.xyz?",
      a: "Global customers on card.finnlink.xyz/en can view live USD pricing and pay seamlessly via Alipay / WeChat Pay (supporting international Visa & Mastercard绑定), or connect instantly via WhatsApp, Telegram, or Email for USDT (TRC20), PayPal, or bulk enterprise invoicing.",
    },
    {
      q: "What happens if verification fails or I close the browser window after payment?",
      a: "Every order and activation key on QuantumLink is encrypted and persisted in a Tokyo low-latency Supabase Cloud Vault. You can retrieve your keys anytime using your QL Order ID or contact handle in the Order Vault tab, and unfulfilled SheerID/SMS tasks automatically protect or refund your key quota.",
    },
  ],
};

/**
 * 构建覆盖 Google / Bing / DeepSeek / 豆包 / ChatGPT / Perplexity 的全量结构化图谱 (JSON-LD)
 */
export function buildSiteJsonLd(locale: Locale) {
  const isEn = locale === "en";
  const pageUrl = isEn ? `${SITE_URL}/en` : SITE_URL;

  const catalogItems = STORE_PRODUCTS.filter((p) => p.enabled !== false).map((raw, index) => {
    const p = localizeProduct(raw, locale);
    const cnyPrice = parseFloat(raw.price) || 0;
    const priceValue = isEn ? (cnyPrice / DEFAULT_USD_RATE).toFixed(2) : cnyPrice.toFixed(2);
    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        sku: raw.id,
        name: p.title,
        description: p.description,
        brand: {
          "@type": "Brand",
          name: raw.id.startsWith("gpt")
            ? "OpenAI"
            : raw.id.includes("gemini") || raw.id.includes("sheerid") || raw.id.includes("gmail")
              ? "Google"
              : raw.id.includes("grok")
                ? "xAI"
                : raw.id.includes("tg") || raw.id.includes("telegram")
                  ? "Telegram"
                  : "Finn QuantumLink",
        },
        offers: {
          "@type": "Offer",
          url: pageUrl,
          priceCurrency: isEn ? "USD" : "CNY",
          price: priceValue,
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: isEn ? "Finn QuantumLink Studio" : "骁清 FINN 数字算力馆",
          },
        },
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: isEn ? "Finn QuantumLink · Global AI Compute Boutique" : "骁清 FINN · 数字算力买手馆 (QuantumLink)",
        alternateName: ["QuantumLink", "骁清算力馆", "Finn AI Studio", "card.finnlink.xyz"],
        url: SITE_URL,
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            availableLanguage: ["Chinese", "English"],
            telephone: "+86-18300425760",
            email: "support@quantum-link.io",
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: isEn
          ? "Finn QuantumLink — Official AI Subscriptions & Cross-Border SaaS Desk"
          : "骁清 FINN · 数字算力馆 — ChatGPT Pro / Gemini / Grok 官方免密直连商店",
        inLanguage: isEn ? "en-US" : "zh-CN",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "ItemList",
        name: isEn ? "Official AI Compute & SaaS Catalog" : "官方直连 AI 旗舰算力与跨境工具目录",
        numberOfItems: catalogItems.length,
        itemListElement: catalogItems,
      },
      {
        "@type": "FAQPage",
        mainEntity: GEO_FAQS[locale].map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      },
    ],
  };
}
