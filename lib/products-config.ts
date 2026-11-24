import { ActivationLine, ProductInfo } from "./types";

export const PRODUCTS_CATALOG: ProductInfo[] = [
  {
    id: "gpt_plus_self",
    line: "chatgpt",
    name: "ChatGPT Plus 官方独享",
    badge: "热销主力",
    codePrefix: "PLS-",
    codeSample: "PLS-XXXXXXXXXXXXXXXX",
    credentialType: "session",
    priceDesc: "仅限当前无生效订阅账号",
    description: "凭 ChatGPT Session JSON 自动开通 Plus 官方订阅，保留全部历史记录。",
    tierLevel: 1,
  },
  {
    id: "gpt_pro_5x_self",
    line: "chatgpt",
    name: "ChatGPT Pro 10x (原5x免费升配)",
    badge: "算力升配",
    codePrefix: "P10X-",
    codeSample: "P10X-XXXXXXXXXXXXXXXX",
    credentialType: "session",
    priceDesc: "支持免费号或菲区Plus无损直升",
    description: "10 倍推理与编程配额；已有生效菲区(PHP) Plus 账号可直接自动升级，无需先取消。",
    tierLevel: 2,
  },
  {
    id: "gpt_pro_20x_self",
    line: "chatgpt",
    name: "ChatGPT Pro 20x 满血旗舰",
    badge: "算力怪兽",
    codePrefix: "P20X-",
    codeSample: "P20X-XXXXXXXXXXXXXXXX",
    credentialType: "session",
    priceDesc: "支持免费号或菲区Plus/10x直升",
    description: "解锁满血顶格推理算力，支持无订阅新开及菲区 Plus / Pro 10x 自动升级。",
    tierLevel: 3,
  },
  {
    id: "gpt_pro_20x_renew",
    line: "chatgpt",
    name: "ChatGPT Pro 20x 续费通道",
    badge: "到期续费",
    codePrefix: "PH20-",
    codeSample: "PH20-XXXX-XXXX-XXXX",
    credentialType: "session",
    priceDesc: "已到期老号续订",
    description: "针对原订阅已过期的账号重新激活 Pro 20x，无缝延续历史对话记忆。",
    tierLevel: 3,
  },
  {
    id: "gpt_pro_500_self",
    line: "chatgpt",
    name: "ChatGPT Pro 50x 巅峰版",
    badge: "顶配专线",
    codePrefix: "P50X-",
    codeSample: "P50X-XXXXXXXXXXXXXXXX",
    credentialType: "session",
    priceDesc: "仅限无任何订阅的纯免费账号",
    description: "全系统单车道精工开通，不支持从已有订阅升级，排队耗时较长请耐心等待。",
    tierLevel: 3,
  },
  {
    id: "grok_cdk",
    line: "grok",
    name: "Grok 订阅 (Plus / Premium / Super / Ultra)",
    badge: "Grok四档",
    codePrefix: "GROK-",
    codeSample: "GROK-XXXXX-XXXXX-XXXXX-XXXXX",
    credentialType: "grok_cookie",
    priceDesc: "自动识别档位 · 支持免费资格预检",
    description: "提交 grok.com 导出的 sso 与 sso-rw Cookie，先免费核验首月优惠资格再安全开通。",
    tierLevel: 2,
  },
  {
    id: "sheerid_student_verify_15",
    line: "sheerid",
    name: "Gemini 学生身份认证 (SheerID)",
    badge: "今日上新",
    codePrefix: "GSTU-",
    codeSample: "GSTU-XXXX-XXXX-XXXX",
    credentialType: "sheerid_url",
    priceDesc: "零密码免登 · 仅需验证链接",
    description: "从 gemini.google/students 复制 SheerID 验证链接提交，通过后直接返回官方优惠领取地址。",
    tierLevel: 1,
  },
  {
    id: "gemini_pixel_6m_9",
    line: "gemini_pro",
    name: "Gemini Pro 3个月个人订阅",
    badge: "谷歌官方",
    codePrefix: "G-3MON-",
    codeSample: "G-3MON-XXXXXXXXXXXX",
    credentialType: "google_2fa",
    priceDesc: "3个月独享订阅直充",
    description: "提供 Google 账号、密码与 Base32 两步验证密钥（或8位备用码）全自动开通。",
    tierLevel: 1,
  },
  {
    id: "codex_sms_4",
    line: "codex_sms",
    name: "Codex / OpenAI 实时短信接码",
    badge: "在线收码",
    codePrefix: "SMS-",
    codeSample: "SMS-XXXXXXXXXXXXXXXX",
    credentialType: "sms_console",
    priceDesc: "收到验证码才扣卡 · 最多试8号",
    description: "实时分配海外实体号码，5秒同步回显验证码原文；2分钟未收码支持无损取消换号。",
    tierLevel: 1,
  },
  {
    id: "tg_premium",
    line: "tg_premium",
    name: "Telegram Premium 官方会员直充",
    badge: "免登空投",
    codePrefix: "TGPREM-",
    codeSample: "TGPREM-XXXXXXXXXXXXXXXX",
    credentialType: "tg_username",
    priceDesc: "3 / 6 / 12 个月 · 仅需 @用户名",
    description: "无需手机号验证码，输入 @username 自动核验资格并空投官方大会员权益。",
    tierLevel: 1,
  },
  {
    id: "muse_invite_boost",
    line: "muse_boost",
    name: "Muse 邀请助力 (10亿 Token / 次)",
    badge: "算力扩容",
    codePrefix: "MB-",
    codeSample: "MB-XXXXXXXXXXXXXXXX",
    credentialType: "muse_invite",
    priceDesc: "仅填6位邀请码 · 单卡可拆分使用",
    description: "每次助力增加 10 亿 Token 额度，每个邀请码最高累计接受 30 次助力。",
    tierLevel: 1,
  },
];

/**
 * 智能识别卡密所属激活产品线。
 * 遵循苏哲 API 规范：本地识别仅用于自动切换前端交互面板，未知前缀默认归入 chatgpt 交由上游权威判定，绝不在本地硬拦截拒收。
 */
export function detectActivationLine(rawCode: string): ActivationLine {
  const upper = rawCode.trim().toUpperCase();
  if (!upper) return "chatgpt";

  if (upper.startsWith("GSTU-")) return "sheerid";
  if (upper.startsWith("GROK-")) return "grok";
  if (upper.startsWith("SMS-")) return "codex_sms";
  if (upper.startsWith("TGPREM-")) return "tg_premium";
  if (upper.startsWith("MB-") || upper.startsWith("MBT-")) return "muse_boost";
  if (
    upper.startsWith("G-3MON-") ||
    upper.startsWith("G-PRO-3MON-") ||
    upper.startsWith("GEMINI")
  ) {
    return "gemini_pro";
  }
  return "chatgpt";
}

export function detectProductByCode(code: string): ProductInfo | null {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;

  // Exact prefix match first
  for (const product of PRODUCTS_CATALOG) {
    if (trimmed.startsWith(product.codePrefix.toUpperCase())) {
      return product;
    }
  }

  // Legacy compatible prefixes still valid on SuZhe upstream
  if (trimmed.startsWith("P5X-") || trimmed.startsWith("PRO5-") || trimmed.startsWith("PH5-")) {
    return PRODUCTS_CATALOG.find((p) => p.id === "gpt_pro_5x_self") || null;
  }
  if (trimmed.startsWith("P500-")) {
    return PRODUCTS_CATALOG.find((p) => p.id === "gpt_pro_500_self") || null;
  }
  if (trimmed.startsWith("PRO20")) {
    return PRODUCTS_CATALOG.find((p) => p.id === "gpt_pro_20x_self") || null;
  }
  if (trimmed.startsWith("PH-")) {
    return PRODUCTS_CATALOG.find((p) => p.id === "gpt_plus_self") || null;
  }
  if (trimmed.startsWith("G-PRO-3MON-")) {
    return PRODUCTS_CATALOG.find((p) => p.id === "gemini_pixel_6m_9") || null;
  }

  return null;
}

export function maskCardCode(code: string): string {
  const c = code.trim();
  if (c.length <= 8) return c.slice(0, 3) + "••••";
  return `${c.slice(0, 5)}••••-••••-${c.slice(-4)}`;
}
