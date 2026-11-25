import type { Metadata } from "next";
import { StorefrontShell } from "@/components/StorefrontShell";
import { buildSiteJsonLd, SITE_URL } from "@/lib/seo-geo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "骁清 FINN · 数字算力买手馆 | ChatGPT Pro 10x/20x · Gemini学生认证 · Grok 免密直充",
  description:
    "骁清 FINN 官方 AI 算力与跨境工具直连商店：支持 ChatGPT Plus、ChatGPT Pro 10x/20x 满血无损升级、Google Gemini 学生认证(SheerID 免密)、SuperGrok、海外 0 月租虚拟卡、Codex 接码与 Telegram 会员秒级自动交付。",
  keywords: [
    "ChatGPT Plus代充",
    "ChatGPT Pro 10x升级",
    "ChatGPT Pro 20x",
    "Gemini学生认证",
    "SheerID学生验证",
    "SuperGrok充值",
    "海外虚拟信用卡",
    "Telegram会员直充",
    "外贸AI工具",
    "骁清FINN",
    "QuantumLink",
  ],
  alternates: {
    canonical: SITE_URL,
    languages: {
      "zh-CN": SITE_URL,
      en: `${SITE_URL}/en`,
      "x-default": SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: "骁清 FINN · 数字算力买手馆 (QuantumLink)",
    title: "骁清 FINN · 数字算力买手馆 | 前沿 AI 旗舰算力秒级直连交付",
    description:
      "全程零密码安全协议 · 直通 OpenAI / Google Gemini / xAI 官方源头仓 · 云端加密存证。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  const jsonLd = buildSiteJsonLd("zh");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StorefrontShell initialLocale="zh" />
    </>
  );
}
