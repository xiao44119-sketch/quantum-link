import type { Metadata } from "next";
import { StorefrontShell } from "@/components/StorefrontShell";
import { buildSiteJsonLd, SITE_URL } from "@/lib/seo-geo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Finn QuantumLink · Official AI Compute & Cross-Border SaaS Boutique (USD)",
  description:
    "Zero-password official provisioning for ChatGPT Plus, ChatGPT Pro 10x/20x, Google Gemini Student Verification (SheerID), xAI SuperGrok, Global Virtual Cards, Overseas OTP & Telegram Premium. Instant 24/7 delivery backed by encrypted Cloud Vault.",
  keywords: [
    "ChatGPT Pro 20x upgrade",
    "ChatGPT Pro 10x key",
    "ChatGPT Plus zero password upgrade",
    "Google Gemini student verification SheerID",
    "SuperGrok activation key",
    "virtual card for AI trials",
    "Telegram Premium gift",
    "cross-border e-commerce AI tools",
    "Finn QuantumLink",
  ],
  alternates: {
    canonical: `${SITE_URL}/en`,
    languages: {
      "zh-CN": SITE_URL,
      en: `${SITE_URL}/en`,
      "x-default": SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: `${SITE_URL}/en`,
    siteName: "Finn QuantumLink · Global AI Compute Boutique",
    title: "Finn QuantumLink — Flagship AI Compute, Delivered in Seconds",
    description:
      "Upgrade ChatGPT Plus / Pro 10x / 20x, verify Google Gemini Student status, and get Global Virtual Cards with zero password risk. Live USD pricing.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnglishHomePage() {
  const jsonLd = buildSiteJsonLd("en");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StorefrontShell initialLocale="en" />
    </>
  );
}
