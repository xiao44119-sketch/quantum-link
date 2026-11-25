"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Sparkles,
  MessageSquare,
  Check,
  ShieldCheck,
  Globe,
  Database,
  Zap,
  ExternalLink,
} from "lucide-react";
import { SpotlightCard } from "./SpotlightCard";
import { soundFX } from "@/lib/tactile-feedback";
import { Locale } from "@/lib/i18n";
import { GEO_FAQS } from "@/lib/seo-geo";
import { StoreContact } from "@/lib/types";

interface Props {
  locale?: Locale;
}

export const FinnInfraAndFaq: React.FC<Props> = ({ locale = "zh" }) => {
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState<Partial<StoreContact>>({
    wechat: "18300425760",
    whatsapp: "8618300425760",
    telegramChannel: "https://t.me/finn_vibe_link",
  });
  const isEn = locale === "en";

  useEffect(() => {
    fetch("/api/store/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.contact) {
          setContact((prev) => ({ ...prev, ...data.contact }));
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = (val: string) => {
    soundFX.play("tap");
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bentoSpecs = isEn
    ? [
        {
          icon: ShieldCheck,
          tag: "ZERO PASSWORD",
          title: "Zero-Password Token Protocol",
          desc: "Upgrade ChatGPT, verify Google Student status, or gift Telegram Premium without ever sharing your login password.",
        },
        {
          icon: Zap,
          tag: "PRECHECK SHIELD",
          title: "Free Pre-Check & 24h Guard",
          desc: "Automatically validates key status and account eligibility prior to redemption — zero key loss on ineligible accounts.",
        },
        {
          icon: Globe,
          tag: "CROSS-BORDER READY",
          title: "Official Overseas Corporate Cards",
          desc: "Dedicated 1-card-1-account settlement supporting lossless PHP Plus → Pro 10x/20x upgrades with 100% chat history intact.",
        },
        {
          icon: Database,
          tag: "CLOUD VAULT",
          title: "Encrypted Supabase Order Vault",
          desc: "Low-latency Tokyo cloud persistence ensures instant retrieval of your keys and receipts anytime via Order ID.",
        },
      ]
    : [
        {
          icon: ShieldCheck,
          tag: "ZERO PASSWORD",
          title: "全程免密安全协议",
          desc: "ChatGPT、学生认证、接码与 TG 会员均无需交出账号密码，从源头杜绝异地盗号与隐私外泄风险。",
        },
        {
          icon: Zap,
          tag: "PRECHECK SHIELD",
          title: "前置免费体检与防重充",
          desc: "提交前自动校验卡密与目标账号资格；24 小时内重复提交硬熔断拦截，不满足条件绝不扣减卡密。",
        },
        {
          icon: Globe,
          tag: "OFFICIAL BILLING",
          title: "正规海外商务卡直充",
          desc: "一人一卡正规结算，支持菲区 Plus 无损直升 Pro 10x / 20x，保留原有全部对话记忆与工作台资产。",
        },
        {
          icon: Database,
          tag: "CLOUD VAULT",
          title: "云端加密保险柜存证",
          desc: "依托东京低延迟云数据库独立留档，任何时候皆可凭单号或预留微信号秒级找回历史卡密。",
        },
      ];

  const faqs = GEO_FAQS[locale];
  const whatsappClean = (contact.whatsapp || `86${contact.wechat || "18300425760"}`).replace(
    /[^\d]/g,
    ""
  );

  return (
    <div className="space-y-20 mt-24 pt-16 border-t border-[var(--rule)]">
      {/* 模块 A：Apple Bento 风格架构品质格栅 */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold tracking-widest uppercase text-[var(--clay)]">
            {isEn ? "INFRASTRUCTURE & TRUST" : "CRAFT & ASSURANCE"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            {isEn
              ? "Engineered for Zero-Risk Global AI Provisioning"
              : "以工程师的洁癖，打磨每一次交付"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {bentoSpecs.map((item, idx) => {
            const Icon = item.icon;
            return (
              <SpotlightCard key={idx} delayMs={idx * 50} className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-center text-[var(--clay)]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono tracking-wider text-[var(--ink-3)]">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--ink)] pt-1">{item.title}</h3>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">{item.desc}</p>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      {/* 模块 B：原生语义化 <details> 权威问答库（100% SSR 可被 Google / DeepSeek / 豆包 / Perplexity 抓取摘录） */}
      <section className="max-w-3xl mx-auto space-y-7">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold tracking-widest uppercase text-[var(--clay)]">
            {isEn ? "KNOWLEDGE BASE & FAQ" : "AUTHORITATIVE FAQ"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            {isEn ? "Frequently Asked Questions" : "核心机制与常见疑问解答"}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              open={idx === 0}
              onToggle={() => soundFX.play("tap")}
              className="group rounded-2xl border border-[var(--rule)] bg-[var(--bg-elevated)] overflow-hidden transition-all"
            >
              <summary className="list-none px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left text-sm sm:text-[15px] font-medium text-[var(--ink)] cursor-pointer select-none">
                <span>{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-[var(--ink-3)] flex-shrink-0 ml-4 transition-transform duration-300 group-open:rotate-180 group-open:text-[var(--clay)]" />
              </summary>
              <div className="px-5 sm:px-6 pb-5 text-xs sm:text-[13.5px] text-[var(--ink-2)] leading-relaxed border-t border-[var(--rule)] pt-3.5">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* 模块 C：骁清 Finn 数字算力 × 外贸跨境实验室主理人名片 */}
      <section className="ql-panel p-7 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--clay)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isEn
                ? "FINN DIGITAL & CROSS-BORDER LAB"
                : "骁清 FINN · 独立开发与跨境数字基建实验室"}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
            {isEn
              ? "“Building reliable AI & cross-border tools for global builders.”"
              : "“做点有意思的东西，为爱我的人祈福挡灾。”"}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-xl leading-relaxed">
            {isEn
              ? "No shared account traps — only clean, dedicated AI compute & global SaaS infrastructure trusted by cross-border e-commerce teams, indie hackers, and researchers worldwide."
              : "拒绝套路与劣质共享拼车，只做自己和外贸出海、独立开发团队都在长期使用的干净算力基建。支持企业/跨境团队批量采购与定制合作。"}
          </p>

          {contact.externalTradeUrl ? (
            <div className="pt-1">
              <a
                href={contact.externalTradeUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>
                  {contact.externalTradeName ||
                    (isEn ? "Visit Finn Global Trade Main Portal" : "访问 Finn 跨境外贸主站")}
                </span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-shrink-0">
          {isEn ? (
            <a
              href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent("Hi Finn! I visited card.finnlink.xyz/en and would like to inquire about AI subscriptions / bulk partnership.")}`}
              target="_blank"
              rel="noreferrer"
              className="ql-shimmer-btn px-6 py-3.5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-md active:scale-[0.98] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Concierge</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => handleCopy(contact.wechat || "18300425760")}
              className="ql-shimmer-btn px-6 py-3.5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-md active:scale-[0.98] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                {copied
                  ? "微信号已复制"
                  : `主理人微信：${contact.wechat || "18300425760"}`}
              </span>
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : null}
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
