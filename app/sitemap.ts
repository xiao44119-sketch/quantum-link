import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo-geo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          "zh-CN": SITE_URL,
          en: `${SITE_URL}/en`,
          "x-default": SITE_URL,
        },
      },
    },
    {
      url: `${SITE_URL}/en`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
      alternates: {
        languages: {
          "zh-CN": SITE_URL,
          en: `${SITE_URL}/en`,
          "x-default": SITE_URL,
        },
      },
    },
    {
      url: `${SITE_URL}/llms.txt`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/llms-full.txt`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
