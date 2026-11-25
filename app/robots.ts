import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo-geo";

/**
 * 面向全球搜索引擎 + 国内外全系 AI 大模型联网爬虫 (GEO) 的显式白名单策略：
 * - 海外 AI 与搜索：Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, Google-Extended, PerplexityBot, ClaudeBot
 * - 国内 AI 与搜索：Bytespider / ToutiaoSpider (豆包), DeepSeekBot (DeepSeek), Baiduspider, Sogou, YisouSpider (夸克), 360Spider
 */
export default function robots(): MetadataRoute.Robots {
  const allowedPaths = ["/", "/en", "/llms.txt", "/llms-full.txt"];
  const disallowedPaths = ["/admin", "/approve/", "/api/"];

  const aiAndSearchAgents = [
    "*",
    "Googlebot",
    "Bingbot",
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Google-Extended",
    "PerplexityBot",
    "ClaudeBot",
    "anthropic-ai",
    "Applebot-Extended",
    "Bytespider",
    "ToutiaoSpider",
    "DeepSeekBot",
    "Baiduspider",
    "Sogou web spider",
    "YisouSpider",
    "360Spider",
  ];

  return {
    rules: aiAndSearchAgents.map((ua) => ({
      userAgent: ua,
      allow: allowedPaths,
      disallow: disallowedPaths,
    })),
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
