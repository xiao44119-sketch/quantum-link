"use client";

import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  X,
  QrCode,
  MessageSquare,
  Send,
  Mail,
  Users,
  Key,
  Globe,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { StoreContact } from "@/lib/types";
import { soundFX } from "@/lib/tactile-feedback";
import { Locale } from "@/lib/i18n";

interface FooterProps {
  onNavigateTab?: (tab: "store" | "redeem" | "query") => void;
  locale?: Locale;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab, locale = "zh" }) => {
  const [contact, setContact] = useState<StoreContact>({
    wechat: "18300425760",
    whatsapp: "8618300425760",
    wechatGroupTitle: "Finn 极客 AI 交流群",
    wechatGroupNote: "扫码添加站长微信后发送【加群】，即可受邀进入 VIP 交流群",
    qqGroup: "837192045",
    telegramChannel: "https://t.me/finn_vibe_link",
    telegramGroup: "https://t.me/finn_vibe_chat",
    email: "support@quantum-link.io",
    qrNote: "扫码添加客服 / 付款",
    noticeText: "",
  });

  const [activeModal, setActiveModal] = useState<"wechat" | "wechatGroup" | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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

  const handleCopy = (text: string, key: string) => {
    soundFX.play("tap");
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const whatsappNum = (contact.whatsapp || `86${contact.wechat || "18300425760"}`).replace(
    /[^\d]/g,
    ""
  );

  return (
    <>
      <footer className="mt-20 border-t border-[var(--rule)] bg-[var(--bg-elevated)] backdrop-blur-xl relative z-10 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-sky-400/30 text-sky-300 font-bold text-sm shadow-[0_0_18px_-4px_rgba(56,189,248,0.45)]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(56,189,248,0.22) 0%, rgba(99,102,241,0.34) 100%)",
                  }}
                >
                  F
                </div>
                <span className="font-semibold text-base text-[var(--ink)]">
                  {isEn
                    ? "FINN QUANTUM · Global AI & Cross-Border Lab"
                    : "骁清 FINN · 数字算力买手馆"}
                </span>
              </div>
              <p className="text-[var(--ink-2)] leading-relaxed max-w-md">
                {isEn
                  ? "Official zero-password AI provisioning & cross-border developer infrastructure: ChatGPT Plus / Pro 10x / 20x, Google Gemini Student Verification, SuperGrok, Global Virtual Cards & Telegram Premium."
                  : "连接全球前沿 AI 模型与跨境出海工具。提供 ChatGPT Plus / Pro 10x / 20x、Gemini 学生身份认证、SuperGrok、海外虚拟卡接码与 Telegram 大会员正规自动化交付。"}
              </p>

              {/* 双语互链与 AI 大模型 GEO 索引入口（利于 Google / DeepSeek / 豆包 / GPTBot 发现） */}
              <div className="pt-2 flex items-center gap-4 flex-wrap text-[11px] text-[var(--ink-3)]">
                <Link href="/" className="hover:text-[var(--ink)] inline-flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>简体中文 (CNY)</span>
                </Link>
                <Link
                  href="/en"
                  className="hover:text-[var(--ink)] inline-flex items-center gap-1"
                >
                  <Globe className="w-3 h-3 text-sky-400" />
                  <span>Global English (USD)</span>
                </Link>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--ink)] inline-flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>AI Index (llms.txt)</span>
                </a>
                {contact.externalTradeUrl ? (
                  <a
                    href={contact.externalTradeUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-sky-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>
                      {contact.externalTradeName ||
                        (isEn ? "Global Trade Partner" : "跨境外贸合作主站")}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[var(--ink)]">
                {isEn ? "Navigation" : "快捷导航"}
              </h4>
              <ul className="space-y-2 text-[var(--ink-2)]">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.("store")}
                    className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                  >
                    {isEn ? "Official AI Storefront" : "严选订阅商店"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.("redeem")}
                    className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                  >
                    {isEn ? "7-in-1 Activation Studio" : "7 合 1 自助开通台"}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.("query")}
                    className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                  >
                    {isEn ? "Encrypted Order Vault" : "订单与卡密查询"}
                  </button>
                </li>
                <li>
                  <a
                    href="/admin"
                    className="text-[var(--ink-3)] hover:text-[var(--ink)] inline-flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>{isEn ? "Admin Console" : "站长运营后台"}</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[var(--ink)]">
                {isEn ? "Global Direct Desk" : "联系与社群"}
              </h4>
              <ul className="space-y-2.5 text-[var(--ink-2)]">
                {isEn ? (
                  <li>
                    <a
                      href={`https://wa.me/${whatsappNum}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[var(--ink)] inline-flex items-center gap-2 text-emerald-400 font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp: +{whatsappNum}</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </li>
                ) : null}
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal("wechat")}
                    className="hover:text-[var(--ink)] inline-flex items-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[var(--clay)]" />
                    <span>
                      {isEn ? `WeChat: ${contact.wechat}` : `微信客服：${contact.wechat}`}
                    </span>
                  </button>
                </li>
                {!isEn ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveModal("wechatGroup")}
                      className="hover:text-[var(--ink)] inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>加入极客 AI 交流群</span>
                    </button>
                  </li>
                ) : null}
                {contact.telegramChannel ? (
                  <li>
                    <a
                      href={contact.telegramChannel}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[var(--ink)] inline-flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-500" />
                      <span>{isEn ? "Telegram Channel" : "Telegram 频道"}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </li>
                ) : null}
                {contact.email ? (
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className="hover:text-[var(--ink)] inline-flex items-center gap-2"
                    >
                      <Mail className="w-3.5 h-3.5 text-[var(--ink-3)]" />
                      <span>{contact.email}</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[var(--rule)] flex flex-col sm:flex-row items-center justify-between text-[var(--ink-3)] text-[11.5px] gap-2">
            <span>© 2026 骁清 FINN · QuantumLink Global AI & Cross-Border Studio</span>
            <span>Zero-Password Provisioning · Cloud Vault Protected</span>
          </div>
        </div>
      </footer>

      {activeModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="ql-pop w-full max-w-sm rounded-3xl border border-[var(--rule-strong)] bg-[var(--bg)] p-6 text-[var(--ink)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
              <span className="font-semibold text-base">
                {activeModal === "wechat"
                  ? isEn
                    ? "Connect on WeChat"
                    : "添加主理人微信"
                  : contact.wechatGroupTitle || "极客交流群"}
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--ink-2)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-48 h-48 mx-auto p-2.5 bg-white rounded-2xl shadow-md flex items-center justify-center overflow-hidden">
              {activeModal === "wechat" && contact.qrCodeImage ? (
                <img
                  src={contact.qrCodeImage}
                  alt="WeChat QR"
                  className="w-full h-full object-contain"
                />
              ) : activeModal === "wechatGroup" && contact.wechatGroupQr ? (
                <img
                  src={contact.wechatGroupQr}
                  alt="Group QR"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-neutral-800 p-3">
                  <QrCode className="w-14 h-14 mx-auto mb-1.5" />
                  <span className="text-xs font-semibold block">WeChat: {contact.wechat}</span>
                </div>
              )}
            </div>

            <div className="text-center space-y-2.5 text-xs">
              <p className="text-[var(--ink-2)] leading-relaxed">
                {activeModal === "wechat"
                  ? isEn
                    ? "Scan QR or copy WeChat ID for 1-on-1 support & bulk pricing"
                    : "扫码或复制微信号添加，享一对一咨询与大额优惠"
                  : contact.wechatGroupNote}
              </p>
              <button
                type="button"
                onClick={() => handleCopy(contact.wechat, "modal_wx")}
                className="px-4 py-2 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === "modal_wx" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copiedKey === "modal_wx"
                    ? isEn
                      ? "Copied!"
                      : "已复制微信号"
                    : `${isEn ? "Copy WeChat" : "复制微信号"}：${contact.wechat}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
