"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Terminal, 
  ShoppingCart, 
  Search, 
  Key, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  QrCode, 
  MessageSquare, 
  Send, 
  Mail, 
  Users, 
  Globe, 
  Cpu, 
  Sparkles 
} from "lucide-react";
import { StoreContact } from "@/lib/admin-store-service";

interface FooterProps {
  onNavigateTab?: (tab: "store" | "redeem" | "query") => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  const [contact, setContact] = useState<StoreContact>({
    wechat: "AI-ASSIST-VIP",
    wechatGroupTitle: "Finn 极客 AI 交流群",
    wechatGroupNote: "扫码添加客服微信后发送【加群】，即可受邀进入 VIP 交流群",
    qqGroup: "837192045",
    qqGroupUrl: "https://qm.qq.com/cgi-bin/qm/qr?k=demo",
    telegramChannel: "https://t.me/finn_vibe_link",
    telegramGroup: "https://t.me/finn_vibe_chat",
    email: "support@quantum-link.io",
    qrNote: "扫码添加客服 / 付款",
    noticeText: "支持充值至您现有的个人自用账号，正规海外实体卡结算，保留历史对话与全部数据，一人一卡安全稳定。",
    handlingFeePercent: 2.0,
    handlingFeeMin: 1.0
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
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <>
      <footer className="mt-24 border-t border-white/[0.08] bg-[#05080e]/90 backdrop-blur-xl relative z-10 font-mono text-xs">
        {/* 顶部柔和渐变线 */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--holo)]/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* 栏位 1 & 2：品牌 & 履约定位 (占两列) */}
            <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-6">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-[var(--holo)] rounded-sm rotate-45 shadow-[0_0_8px_var(--holo)]" />
                <span className="font-extrabold text-sm sm:text-base tracking-wider text-white">
                  QUANTUM LINK PROTOCOL
                </span>
                <span className="text-[10px] px-2 py-0.5 border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 rounded">
                  v2.4 LTS
                </span>
              </div>

              <p className="text-neutral-400 text-xs leading-relaxed text-justify">
                由 <strong>骁清 Finn</strong> 架构并维护的独立 AI 会员订阅分发网络。为创作者、工程师与科研团队提供 ChatGPT Plus、ChatGPT Pro、Claude Pro 等海外主流算力通道的高速自动化交付与长效售后质保。
              </p>

              <div className="p-3 border border-white/5 bg-white/[0.02] rounded text-[11px] text-neutral-400 space-y-1.5">
                <div className="flex items-center justify-between text-neutral-300">
                  <span>DISPATCH CORE:</span>
                  <span className="text-emerald-400 font-bold">● TOKYO BGP RUNTIME</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>QINGDAO TIME:</span>
                  <span className="text-neutral-200">UTC+8 · REALTIME NOMINAL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>FINN MOTTO:</span>
                  <span className="text-[var(--warm)] text-[10px]">做点有意思的东西，为爱我的人祈福挡灾</span>
                </div>
              </div>
            </div>

            {/* 栏位 3：快速导航 */}
            <div className="space-y-3.5">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-[var(--holo)]">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>舱位直达 (NAV)</span>
              </h4>
              <ul className="space-y-2 text-neutral-400 text-xs">
                <li>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab("store")}
                    className="hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>01. 订阅套餐选购 (STORE)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab("redeem")}
                    className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>02. CDK 自助激活 (REDEEM)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab("query")}
                    className="hover:text-purple-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>03. 履约凭证查询 (TRACE)</span>
                  </button>
                </li>
                <li>
                  <a
                    href="/admin"
                    className="hover:text-neutral-200 text-neutral-500 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Key className="w-3 h-3" />
                    <span>04. 运维控制台 (ADMIN)</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* 栏位 4：服务与质保 */}
            <div className="space-y-3.5">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-[var(--warm)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>服务与保障 (ASSURANCE)</span>
              </h4>
              <ul className="space-y-2 text-neutral-400 text-xs">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>正规海外实体卡代开</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>自备独享账号 · 保留历史</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>30天完整周期售后质保</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>CDK 卡密即刻秒发开通</span>
                </li>
              </ul>
            </div>

            {/* 栏位 5：社区与支持 */}
            <div className="space-y-3.5">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-cyan-300">
                <Users className="w-3.5 h-3.5" />
                <span>社群与支持 (COMMUNITY)</span>
              </h4>
              <ul className="space-y-2.5 text-neutral-300 text-xs">
                {/* 微信交流群 */}
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal("wechatGroup")}
                    className="group flex items-center gap-2 text-neutral-400 hover:text-emerald-300 transition-colors w-full text-left cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 group-hover:border-emerald-400">
                      微
                    </span>
                    <span>微信交流群</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 ml-auto border border-emerald-500/20">
                      扫码进群
                    </span>
                  </button>
                </li>

                {/* 微信客服 (Finn) */}
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal("wechat")}
                    className="group flex items-center gap-2 text-neutral-400 hover:text-cyan-300 transition-colors w-full text-left cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-[10px] text-cyan-400 group-hover:border-cyan-400">
                      客
                    </span>
                    <span>微信客服 (Finn)</span>
                    <span className="text-[10px] text-cyan-400 ml-auto font-mono">
                      {contact.wechat}
                    </span>
                  </button>
                </li>

                {/* QQ 交流群 */}
                {contact.qqGroup && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveModal("qq")}
                      className="group flex items-center gap-2 text-neutral-400 hover:text-blue-300 transition-colors w-full text-left cursor-pointer"
                    >
                      <span className="w-5 h-5 rounded bg-blue-950/50 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 group-hover:border-blue-400">
                        Q
                      </span>
                      <span>QQ 极客交流群</span>
                      <span className="text-[10px] text-blue-400 ml-auto font-mono">
                        {contact.qqGroup}
                      </span>
                    </button>
                  </li>
                )}

                {/* Telegram 频道 */}
                {contact.telegramChannel && (
                  <li>
                    <a
                      href={contact.telegramChannel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 text-neutral-400 hover:text-sky-300 transition-colors"
                    >
                      <Send className="w-4 h-4 text-sky-400" />
                      <span>Telegram 官方频道</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100" />
                    </a>
                  </li>
                )}

                {/* Telegram 交流群 */}
                {contact.telegramGroup && (
                  <li>
                    <a
                      href={contact.telegramGroup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 text-neutral-400 hover:text-sky-300 transition-colors"
                    >
                      <Users className="w-4 h-4 text-sky-400" />
                      <span>Telegram 交流群</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100" />
                    </a>
                  </li>
                )}

                {/* 邮箱支持 */}
                {contact.email && (
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className="group flex items-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-neutral-400" />
                      <span>{contact.email}</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* 底部版权与免责 */}
          <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-neutral-500 text-[11px] gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--holo)] rounded-full animate-ping" />
              <span>© 2026 QUANTUM LINK · INDEPENDENT AI INFRASTRUCTURE BY 骁清 FINN</span>
            </div>
            <div className="flex items-center gap-4 text-neutral-400">
              <span>SSL 256-BIT ENCRYPTED</span>
              <span>ZERO LOG RETENTION</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 社交媒体弹窗交互 (微信 / 微信群 / QQ) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm border border-cyan-500/40 bg-[#080d16] p-6 text-white corner-bracket shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2 text-white font-mono text-sm font-bold">
                {activeModal === "wechat" && <MessageSquare className="w-4 h-4 text-[var(--holo)]" />}
                {activeModal === "wechatGroup" && <Users className="w-4 h-4 text-emerald-400" />}
                {activeModal === "qq" && <Cpu className="w-4 h-4 text-blue-400" />}
                <span>
                  {activeModal === "wechat" && "微信官方客服"}
                  {activeModal === "wechatGroup" && (contact.wechatGroupTitle || "微信交流群")}
                  {activeModal === "qq" && "QQ 极客交流群"}
                </span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-center font-mono">
              {/* 二维码展示区 */}
              <div className="w-44 h-44 mx-auto p-2 bg-white rounded shadow-md flex items-center justify-center">
                <div className="w-full h-full border border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-800 p-2">
                  <QrCode className="w-16 h-16 text-neutral-900 mb-1" />
                  <span className="text-[11px] font-bold text-neutral-900">
                    {activeModal === "wechat" && "微信扫码直接咨询"}
                    {activeModal === "wechatGroup" && "扫码受邀进入交流群"}
                    {activeModal === "qq" && "QQ 扫码一键加入"}
                  </span>
                  <span className="text-[9px] text-neutral-500 mt-0.5">
                    {activeModal === "wechat" && `微信号: ${contact.wechat}`}
                    {activeModal === "wechatGroup" && "官方认证 · 技术交流"}
                    {activeModal === "qq" && `群号: ${contact.qqGroup}`}
                  </span>
                </div>
              </div>

              {/* 关键信息与一键复制 */}
              {activeModal === "wechat" && (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-400">
                    微信搜索添加客服，获取 1 对 1 专业咨询、大额优惠及免手续费直充：
                  </p>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-cyan-500/40 bg-cyan-950/40 rounded text-xs text-white">
                    <span>微信号: <strong className="text-cyan-300">{contact.wechat}</strong></span>
                    <button
                      onClick={() => handleCopy(contact.wechat, "wechat")}
                      className="text-[11px] text-[var(--warm)] hover:underline inline-flex items-center gap-1"
                    >
                      {copiedKey === "wechat" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "wechat" ? "已复制" : "复制"}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeModal === "wechatGroup" && (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {contact.wechatGroupNote || "扫码添加客服后回复【加群】，即可受邀进入 VIP 交流群探讨最新 AI 工具与模型玩法。"}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-emerald-500/40 bg-emerald-950/40 rounded text-xs text-white">
                    <span>客服微信: <strong className="text-emerald-300">{contact.wechat}</strong></span>
                    <button
                      onClick={() => handleCopy(contact.wechat, "wechatGroup")}
                      className="text-[11px] text-[var(--warm)] hover:underline inline-flex items-center gap-1"
                    >
                      {copiedKey === "wechatGroup" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "wechatGroup" ? "已复制" : "复制微信号"}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeModal === "qq" && (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-400">
                    QQ 极客交流群，即时探讨 Claude、GPT-4o、Cursor 技巧与避坑指南：
                  </p>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-blue-500/40 bg-blue-950/40 rounded text-xs text-white">
                    <span>QQ 群号: <strong className="text-blue-300">{contact.qqGroup}</strong></span>
                    <button
                      onClick={() => handleCopy(contact.qqGroup || "", "qq")}
                      className="text-[11px] text-[var(--warm)] hover:underline inline-flex items-center gap-1"
                    >
                      {copiedKey === "qq" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "qq" ? "已复制" : "复制群号"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2 border border-white/10 text-neutral-400 hover:text-white text-xs rounded transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
