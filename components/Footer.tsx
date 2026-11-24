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
} from "lucide-react";
import { StoreContact } from "@/lib/types";
import { soundFX } from "@/lib/tactile-feedback";

interface FooterProps {
  onNavigateTab?: (tab: "store" | "redeem" | "query") => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  const [contact, setContact] = useState<StoreContact>({
    wechat: "18300425760",
    wechatGroupTitle: "Finn 极客 AI 交流群",
    wechatGroupNote: "扫码添加站长微信后发送【加群】，即可受邀进入 VIP 交流群",
    qqGroup: "837192045",
    telegramChannel: "https://t.me/finn_vibe_link",
    telegramGroup: "https://t.me/finn_vibe_chat",
    email: "support@quantum-link.io",
    qrNote: "扫码添加客服 / 付款",
    noticeText: "",
  });

  const [activeModal, setActiveModal] = useState<"wechat" | "wechatGroup" | "qq" | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  return (
    <>
      <footer className="mt-20 border-t border-[var(--rule)] bg-[var(--bg-elevated)] backdrop-blur-xl relative z-10 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-serif-editorial font-bold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #E27B58 0%, #C85A38 100%)",
                    color: "#FAF8F5",
                  }}
                >
                  F
                </div>
                <span className="font-serif-editorial font-semibold text-base text-[var(--ink)]">
                  骁清 FINN · 数字算力买手馆
                </span>
              </div>
              <p className="text-[var(--ink-2)] leading-relaxed max-w-md">
                连接全球前沿 AI 模型与开发者工具。提供 ChatGPT Plus / Pro 10x / 20x / 50x、Gemini 学生身份认证、SuperGrok、Codex 接码与 Telegram 大会员的正规自动化交付。
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[var(--ink)]">快捷导航</h4>
              <ul className="space-y-2 text-[var(--ink-2)]">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.("store")}
                    className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                  >
                    严选订阅商店
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.("redeem")}
                    className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                  >
                    7 合 1 自助开通台
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.("query")}
                    className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                  >
                    订单与卡密查询
                  </button>
                </li>
                <li>
                  <a
                    href="/admin"
                    className="text-[var(--ink-3)] hover:text-[var(--ink)] inline-flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>站长运营后台</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[var(--ink)]">联系与社群</h4>
              <ul className="space-y-2.5 text-[var(--ink-2)]">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal("wechat")}
                    className="hover:text-[var(--ink)] inline-flex items-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[var(--clay)]" />
                    <span>微信客服：{contact.wechat}</span>
                  </button>
                </li>
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
                {contact.telegramChannel ? (
                  <li>
                    <a
                      href={contact.telegramChannel}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[var(--ink)] inline-flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-500" />
                      <span>Telegram 频道</span>
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
            <span>© 2026 骁清 FINN · QuantumLink Studio</span>
            <span>Official API Fulfillment · Cloud Vault Protected</span>
          </div>
        </div>
      </footer>

      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
          <div className="ql-pop w-full max-w-sm rounded-3xl border border-[var(--rule-strong)] bg-[var(--bg)] p-6 text-[var(--ink)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
              <span className="font-serif-editorial font-semibold text-base">
                {activeModal === "wechat" ? "添加主理人微信" : contact.wechatGroupTitle || "极客交流群"}
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
                  alt="微信二维码"
                  className="w-full h-full object-contain"
                />
              ) : activeModal === "wechatGroup" && contact.wechatGroupQr ? (
                <img
                  src={contact.wechatGroupQr}
                  alt="交流群二维码"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-neutral-800 p-3">
                  <QrCode className="w-14 h-14 mx-auto mb-1.5" />
                  <span className="text-xs font-semibold block">微信: {contact.wechat}</span>
                </div>
              )}
            </div>

            <div className="text-center space-y-2.5 text-xs">
              <p className="text-[var(--ink-2)] leading-relaxed">
                {activeModal === "wechat"
                  ? "扫码或复制微信号添加，享一对一咨询与大额优惠"
                  : contact.wechatGroupNote}
              </p>
              <button
                type="button"
                onClick={() => handleCopy(contact.wechat, "modal_wx")}
                className="px-4 py-2 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === "modal_wx" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "modal_wx" ? "已复制微信号" : `复制微信号：${contact.wechat}`}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
