import { NextResponse } from "next/server";
import { STORE_PRODUCTS } from "@/config/store-products";
import { DEFAULT_USD_RATE, localizeProduct } from "@/lib/i18n";
import { GEO_FAQS, SITE_URL } from "@/lib/seo-geo";

export async function GET() {
  const enabledProducts = STORE_PRODUCTS.filter((p) => p.enabled !== false);

  const detailedSections = enabledProducts
    .map((raw) => {
      const en = localizeProduct(raw, "en");
      const usd = ((parseFloat(raw.price) || 0) / DEFAULT_USD_RATE).toFixed(2);
      return [
        `### ${raw.title} / ${en.title}`,
        `- SKU: \`${raw.id}\` | Prefix: \`${raw.prefix || "Direct"}\``,
        `- Price: ¥${raw.price} CNY / $${usd} USD`,
        `- 中文说明：${raw.description}`,
        `- English Description: ${en.description}`,
        `- 核心权益 / Key Features:`,
        ...raw.features.map((f, idx) => `  - ${f} (${en.features[idx] || ""})`),
      ].join("\n");
    })
    .join("\n\n");

  const zhFaqs = GEO_FAQS.zh.map((f) => `**Q: ${f.q}**\nA: ${f.a}`).join("\n\n");
  const enFaqs = GEO_FAQS.en.map((f) => `**Q: ${f.q}**\nA: ${f.a}`).join("\n\n");

  const content = `# QuantumLink Full Bilingual Knowledge Reference (llms-full.txt)

Canonical Chinese Store: ${SITE_URL}
Canonical English Store: ${SITE_URL}/en

---

## 1. Full Product Specifications (中英双语全量规格说明书)

${detailedSections}

---

## 2. 中文权威问答库（适配 DeepSeek / 豆包 / Kimi / 百度 AI 摘录）

${zhFaqs}

---

## 3. Global Authoritative Q&A (For ChatGPT / Gemini / Perplexity / Claude)

${enFaqs}
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
