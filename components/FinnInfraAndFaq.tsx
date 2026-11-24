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
} from "lucide-react";
import { SpotlightCard } from "./SpotlightCard";
import { soundFX } from "@/lib/tactile-feedback";

export const FinnInfraAndFaq: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);
  const [wechat, setWechat] = useState("18300425760");

  useEffect(() => {
    fetch("/api/store/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.contact?.wechat) {
          setWechat(data.contact.wechat);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = () => {
    soundFX.play("tap");
    navigator.clipboard.writeText(wechat);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bentoSpecs = [
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

  const faqs = [
    {
      q: "为什么代充 ChatGPT 和学生认证不需要给账号密码？",
      a: "传统代充索要账号密码极易触发风控与隐私泄露。本站采用官方会话签名（Session JSON）与 SheerID 独立验证链接机制，仅在服务端瞬间完成订阅授权绑定，全程不触碰、不留存您的登录密码。",
    },
    {
      q: "我的账号目前还有没到期的 Plus，可以直接升级 Pro 10x 或 Pro 20x 吗？",
      a: "若您当前生效的是菲律宾区（PHP）计费的 Plus 订阅，可直接购买 P10X- 或 P20X- 卡密一键无损自动升级，无需先取消原订阅！若是非菲区订阅，等现有周期到期后再充即可。",
    },
    {
      q: "如果不小心重复提交或网络超时，卡密会被白白扣掉吗？",
      a: "不会。系统内置 24 小时防重充熔断与前置卡密体检，账号不符合条件在受理前即会无损退回；网络抖动时也可直接在【查单取卡】输入卡密恢复实时进度。",
    },
    {
      q: "Gemini 学生认证通过后怎么领取优惠？",
      a: "在【自助开通】提交您的 GSTU- 卡密和 SheerID 验证链接后，约数分钟即可弹出官方优惠领取链接。若谷歌页面提示绑卡验证，可直接搭配店内「海外绑卡专用虚拟卡」一站式搞定。",
    },
  ];

  return (
    <div className="space-y-20 mt-24 pt-16 border-t border-[var(--rule)]">
      {/* 模块 A：Apple Bento 风格架构品质格栅 */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold tracking-widest uppercase text-[var(--clay)]">
            CRAFT & ASSURANCE
          </span>
          <h3 className="font-serif-editorial text-2xl sm:text-3xl font-medium text-[var(--ink)]">
            以工程师的洁癖，打磨每一次交付
          </h3>
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
                  <h4 className="text-base font-semibold text-[var(--ink)] pt-1">{item.title}</h4>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">{item.desc}</p>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      {/* 模块 B：高定极简手风琴 FAQ */}
      <section className="max-w-3xl mx-auto space-y-7">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold tracking-widest uppercase text-[var(--clay)]">
            FREQUENTLY ASKED
          </span>
          <h3 className="font-serif-editorial text-2xl sm:text-3xl font-medium text-[var(--ink)]">
            常见疑问解答
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--rule)] bg-[var(--bg-elevated)] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => {
                    soundFX.play("tap");
                    setOpenFaq(isOpen ? null : idx);
                  }}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left text-sm sm:text-[15px] font-medium text-[var(--ink)] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--ink-3)] flex-shrink-0 ml-4 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-[var(--clay)]" : ""
                    }`}
                  />
                </button>
                {isOpen ? (
                  <div className="px-5 sm:px-6 pb-5 text-xs sm:text-[13.5px] text-[var(--ink-2)] leading-relaxed border-t border-[var(--rule)] pt-3.5">
                    {faq.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* 模块 C：骁清 Finn 数字岛屿主理人名片 */}
      <section className="ql-panel p-7 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--clay)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>骁清 FINN · INDEPENDENT STUDIO</span>
          </div>
          <h4 className="font-serif-editorial text-xl sm:text-2xl font-medium text-[var(--ink)]">
            “做点有意思的东西，为爱我的人祈福挡灾。”
          </h4>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-xl leading-relaxed">
            拒绝套路与劣质共享拼车，只做自己和身边工程师朋友都在长期使用的干净算力渠道。有任何大额采购或使用疑问，随时加我微信直聊。
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="ql-shimmer-btn px-6 py-3.5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-md active:scale-[0.98] cursor-pointer flex-shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{copied ? "微信号已复制" : `主理人微信：${wechat}`}</span>
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : null}
        </button>
      </section>
    </div>
  );
};
