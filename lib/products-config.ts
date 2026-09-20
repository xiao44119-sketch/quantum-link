import { ProductInfo } from "./types";

export const PRODUCTS_CATALOG: ProductInfo[] = [
  {
    id: "gpt_plus",
    name: "ChatGPT Plus (标准版)",
    badge: "热销主力",
    codePrefix: "PH-",
    codeSample: "PH-XXXX-XXXX-XXXX",
    credentialType: "session",
    priceDesc: "官方原价 $20/mo",
    description: "解锁 GPT-4o、o1-preview 思考深度推理与 DALL-E 3 高清作图能力，专属极速响应通道。",
    tierLevel: 1,
  },
  {
    id: "gpt_pro_5x_ios",
    name: "ChatGPT Pro 5x",
    badge: "算力增强",
    codePrefix: "PRO5-",
    codeSample: "PRO5-XXXXXXXXXXXXXXXX",
    credentialType: "session",
    priceDesc: "高并发通道",
    description: "面向重度编程和长上下文调用用户，5 倍于标准版的请求配额与专属调度链路。",
    tierLevel: 2,
  },
  {
    id: "gpt_pro_5x_ph",
    name: "ChatGPT Pro 5x (备用冗余)",
    badge: "备用容灾",
    codePrefix: "PH5-",
    codeSample: "PH5-XXXX-XXXX-XXXX",
    credentialType: "session",
    priceDesc: "容灾专线",
    description: "亚太 BGP 专线直达，主线路峰值繁忙时的无缝流转通道。",
    tierLevel: 2,
  },
  {
    id: "gpt_pro_20x_new",
    name: "ChatGPT Pro 20x · 首发新开",
    badge: "旗舰满血",
    codePrefix: "PRO20SPECIAL-",
    codeSample: "PRO20SPECIAL-XXXXXXXXXXXXXXXX",
    credentialType: "session",
    priceDesc: "算力怪兽",
    description: "专为从未开通过 Pro 20x 的全新/首开账号设计，提供 20 倍工业级算力配额。",
    tierLevel: 3,
  },
  {
    id: "gpt_pro_20x_renew",
    name: "ChatGPT Pro 20x · 续费通道",
    badge: "老号焕新",
    codePrefix: "PH20-",
    codeSample: "PH20-XXXX-XXXX-XXXX",
    credentialType: "session",
    priceDesc: "续费无忧",
    description: "针对历史订阅已失效的账号进行重新激活，延续原账号历史对话记忆。",
    tierLevel: 3,
  },
];

export function detectProductByCode(code: string): ProductInfo | null {
  const trimmed = code.trim().toUpperCase();
  for (const product of PRODUCTS_CATALOG) {
    if (trimmed.startsWith(product.codePrefix.toUpperCase())) {
      return product;
    }
  }
  return null;
}