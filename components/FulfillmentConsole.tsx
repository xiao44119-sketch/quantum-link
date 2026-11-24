"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Radio,
  Copy,
  ExternalLink,
  Smartphone,
  GraduationCap,
  AtSign,
  Rocket,
  Mail,
  Headphones,
  Bot,
  Check,
} from "lucide-react";
import { detectActivationLine, detectProductByCode } from "@/lib/products-config";
import {
  ActivationLine,
  DuplicateConfirmError,
  ProductInfo,
  TaskRecord,
} from "@/lib/types";
import { CollisionWarningModal } from "./CollisionWarningModal";
import { SessionHelperModal } from "./SessionHelperModal";
import { SessionPrecheckCard } from "./SessionPrecheckCard";
import { TicketModal } from "./TicketModal";
import { soundFX } from "@/lib/tactile-feedback";

interface Props {
  presetPrefix?: string;
  onTaskChange?: (count: number) => void;
  onLineChange?: (line: ActivationLine) => void;
}

const LINE_TABS: Array<{
  id: ActivationLine;
  label: string;
  sub: string;
  tileBg: string;
  tileColor: string;
  Icon: any;
  pollMs: number;
}> = [
  {
    id: "chatgpt",
    label: "ChatGPT 订阅",
    sub: "Plus · Pro 10x / 20x / 50x",
    tileBg: "#C9D9CF",
    tileColor: "#234E39",
    Icon: Bot,
    pollMs: 3000,
  },
  {
    id: "sheerid",
    label: "Gemini 学生认证",
    sub: "GSTU- · 免密验证链接",
    tileBg: "#D6D3E6",
    tileColor: "#383266",
    Icon: GraduationCap,
    pollMs: 8000,
  },
  {
    id: "codex_sms",
    label: "Codex 在线接码",
    sub: "SMS- · 实时收信换号",
    tileBg: "#EFE0C5",
    tileColor: "#6B421B",
    Icon: Smartphone,
    pollMs: 4500,
  },
  {
    id: "grok",
    label: "Grok 订阅",
    sub: "GROK- · 四档免费预检",
    tileBg: "#DEDAD1",
    tileColor: "#33302A",
    Icon: Sparkles,
    pollMs: 3000,
  },
  {
    id: "tg_premium",
    label: "Telegram 会员",
    sub: "TGPREM- · @用户名直充",
    tileBg: "#D0E1EE",
    tileColor: "#1E4E79",
    Icon: AtSign,
    pollMs: 5000,
  },
  {
    id: "muse_boost",
    label: "Muse 邀请助力",
    sub: "MB- · 单次+10亿 Token",
    tileBg: "#F2D9CE",
    tileColor: "#7C321D",
    Icon: Rocket,
    pollMs: 5000,
  },
  {
    id: "gemini_pro",
    label: "Gemini Pro 季卡",
    sub: "G-3MON- · 3个月独享",
    tileBg: "#DDD6F3",
    tileColor: "#44337A",
    Icon: Mail,
    pollMs: 10000,
  },
];

export const FulfillmentConsole: React.FC<Props> = ({
  presetPrefix,
  onTaskChange,
  onLineChange,
}) => {
  const [cardCode, setCardCode] = useState("");
  const [selectedLine, setSelectedLine] = useState<ActivationLine>("chatgpt");
  const [manualLineOverride, setManualLineOverride] = useState(false);
  const [matchedProduct, setMatchedProduct] = useState<ProductInfo | null>(null);

  const [sessionInput, setSessionInput] = useState("");
  const [grokCookies, setGrokCookies] = useState("");
  const [sheeridUrl, setSheeridUrl] = useState("");
  const [tgUsername, setTgUsername] = useState("");
  const [museInviteCode, setMuseInviteCode] = useState("");
  const [museUses, setMuseUses] = useState(1);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [googleTwofa, setGoogleTwofa] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const [prechecking, setPrechecking] = useState(false);
  const [precheckInfo, setPrecheckInfo] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [smsActionLoading, setSmsActionLoading] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskRecord | null>(null);
  const [polling, setPolling] = useState(false);
  const [showVerifyIframe, setShowVerifyIframe] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [collisionError, setCollisionError] = useState<DuplicateConfirmError | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, key: string) => {
    soundFX.play("tap");
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    onLineChange?.(selectedLine);
  }, [selectedLine, onLineChange]);

  useEffect(() => {
    if (presetPrefix) {
      setManualLineOverride(false);
      setCardCode(presetPrefix);
    }
  }, [presetPrefix]);

  useEffect(() => {
    const trimmed = cardCode.trim();
    if (!trimmed) {
      setMatchedProduct(null);
      setPrecheckInfo(null);
      return;
    }
    const detectedProd = detectProductByCode(trimmed);
    setMatchedProduct(detectedProd);
    if (!manualLineOverride) {
      setSelectedLine(detectActivationLine(trimmed));
    }
  }, [cardCode, manualLineOverride]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activeTask?.log_trace]);

  useEffect(() => {
    if (!polling || !activeTask) return;
    if (activeTask.finished && activeTask.line !== "codex_sms") return;

    const tabCfg = LINE_TABS.find((t) => t.id === activeTask.line);
    const intervalMs = tabCfg?.pollMs || 3500;

    const timer = setInterval(async () => {
      try {
        const resp = await fetch(`/api/task/${encodeURIComponent(activeTask.task_id)}`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (data.task) {
          if (data.task.success && !activeTask.success) {
            soundFX.play("success");
          }
          setActiveTask(data.task);
          if (data.task.finished && data.task.line !== "codex_sms") {
            setPolling(false);
            onTaskChange?.(0);
          }
        }
      } catch {}
    }, intervalMs);

    return () => clearInterval(timer);
  }, [polling, activeTask, onTaskChange]);

  const handlePrecheck = async () => {
    const code = cardCode.trim();
    if (!code) {
      setErrorMessage("请先输入卡密后再点击预检");
      return;
    }
    soundFX.play("tap");
    setPrechecking(true);
    setErrorMessage(null);
    setPrecheckInfo(null);

    try {
      const resp = await fetch("/api/activate/precheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_code: code,
          line: selectedLine,
          tg_username: tgUsername.trim() || undefined,
          grok_cookies: grokCookies.trim() || undefined,
        }),
      });
      const data = await resp.json();
      setPrecheckInfo(data);
      if (!data.success) {
        setErrorMessage(data.detail || data.error || "卡密预检未通过");
      } else {
        soundFX.play("switch");
        if (data.line === "muse_boost" && data.card?.remaining_uses) {
          setMuseUses((prev) => Math.min(prev, data.card.remaining_uses));
        }
      }
    } catch {
      setErrorMessage("预检请求超时，请检查网络后重试");
    } finally {
      setPrechecking(false);
    }
  };

  const handleSubmit = async (confirmDuplicate = false) => {
    soundFX.play("tap");
    setErrorMessage(null);
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      card_code: cardCode.trim(),
      line: selectedLine,
      confirm_duplicate: confirmDuplicate,
    };

    if (selectedLine === "chatgpt") {
      try {
        payload.session_data = JSON.parse(sessionInput);
      } catch {
        setErrorMessage("Session JSON 格式不合法，请完整复制 chatgpt.com/api/auth/session 全部内容");
        setSubmitting(false);
        return;
      }
    } else if (selectedLine === "grok") {
      payload.grok_cookies = grokCookies.trim();
    } else if (selectedLine === "sheerid") {
      payload.sheerid_url = sheeridUrl.trim();
    } else if (selectedLine === "tg_premium") {
      payload.tg_username = tgUsername.trim();
    } else if (selectedLine === "muse_boost") {
      payload.invite_code = museInviteCode.trim();
      payload.uses = museUses;
    } else if (selectedLine === "gemini_pro") {
      payload.google_email = googleEmail.trim();
      payload.google_password = googlePassword;
      payload.google_twofa = googleTwofa.trim();
      payload.recovery_email = recoveryEmail.trim();
    } else if (selectedLine === "codex_sms") {
      payload.sms_action = "get_number";
    }

    try {
      const resp = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!resp.ok || data.success === false) {
        if (resp.status === 409 && data.duplicate) {
          setCollisionError(data);
          setSubmitting(false);
          return;
        }
        setErrorMessage(data.detail || data.detail_zh || data.error || "任务提交未通过");
        setSubmitting(false);
        return;
      }

      setCollisionError(null);
      onTaskChange?.(1);
      setActiveTask(data.task);
      setPolling(true);
    } catch {
      setErrorMessage("网络连接异常，若提交耗时较长请前往【查单取卡】核实是否已受理，避免重复提交");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSmsControl = async (action: "resend" | "cancel" | "finish") => {
    if (!activeTask) return;
    soundFX.play("tap");
    setSmsActionLoading(action);
    setErrorMessage(null);
    try {
      const resp = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_code: cardCode.trim(),
          line: "codex_sms",
          sms_action: action,
          sms_activation_id: activeTask.sms_state?.id,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.success === false) {
        setErrorMessage(data.detail || data.error || "操作未生效");
      } else if (data.task) {
        setActiveTask(data.task);
        if (action === "cancel" || action === "finish") {
          setPolling(false);
        }
      }
    } catch {
      setErrorMessage("接码指令请求异常，请稍后重试");
    } finally {
      setSmsActionLoading(null);
    }
  };

  const safeLogs = Array.isArray(activeTask?.log_trace) ? activeTask!.log_trace : [];

  return (
    <div className="relative z-10 space-y-7">
      <SessionHelperModal
        isOpen={isHelperOpen}
        onClose={() => setIsHelperOpen(false)}
        onApplySample={(sample) => setSessionInput(sample)}
      />

      <TicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        presetOrderId={activeTask?.task_id || cardCode}
      />

      <CollisionWarningModal
        isOpen={Boolean(collisionError)}
        errorInfo={collisionError}
        onCancel={() => setCollisionError(null)}
        isLoading={submitting}
        onConfirmOverride={() => handleSubmit(true)}
      />

      {/* 苏哲 v4 同款高定彩色图标瓷砖切换坞 (.fam-switch) */}
      <nav
        aria-label="选择开通产品线"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        {LINE_TABS.map((tab, idx) => {
          const active = selectedLine === tab.id;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              style={{ animationDelay: `${idx * 45}ms` }}
              onClick={() => {
                soundFX.play("switch");
                setSelectedLine(tab.id);
                setManualLineOverride(true);
                setErrorMessage(null);
                setPrecheckInfo(null);
              }}
              className={`ql-rise group relative flex items-center gap-3.5 text-left p-3.5 rounded-[20px] border transition-all duration-300 cursor-pointer ${
                active
                  ? "bg-[var(--bg-card-hover)] border-[var(--ink)] shadow-md"
                  : "bg-[var(--bg-elevated)] border-[var(--rule)] hover:border-[var(--rule-strong)] hover:-translate-y-0.5"
              }`}
            >
              <span
                className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105"
                style={{
                  backgroundColor: tab.tileBg,
                  color: tab.tileColor,
                }}
              >
                <Icon className="w-5 h-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="text-[14px] font-semibold text-[var(--ink)] block truncate">
                  {tab.label}
                </span>
                <span className="text-[11.5px] text-[var(--ink-3)] block truncate mt-0.5">
                  {tab.sub}
                </span>
              </span>

              {active ? (
                <span className="ql-pop absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[2.8]" />
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* 主工作台双栏面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7">
        {/* 左侧：分步优雅向导表单 */}
        <div className="lg:col-span-7 ql-panel p-6 sm:p-9">
          <div className="flex items-center justify-between border-b border-[var(--rule)] pb-4 mb-6">
            <div>
              <h2 className="font-serif-editorial text-lg sm:text-xl font-semibold text-[var(--ink)]">
                填写激活信息
              </h2>
              <p className="text-xs text-[var(--ink-3)] mt-0.5">
                输入卡密后系统会自动匹配对应套餐，前置预检不消耗卡密次数
              </p>
            </div>
            {matchedProduct ? (
              <span className="ql-pop text-xs px-3 py-1 rounded-full bg-emerald-500/12 text-emerald-500 font-medium border border-emerald-500/25">
                {matchedProduct.name}
              </span>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(false);
            }}
            className="space-y-6"
          >
            {/* 步骤 1：卡密 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--ink)] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-bold inline-flex items-center justify-center">
                  1
                </span>
                <span>您的激活卡密</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={cardCode}
                  onChange={(e) => {
                    setManualLineOverride(false);
                    setCardCode(e.target.value);
                  }}
                  placeholder="粘贴 PLS- / P10X- / GSTU- / SMS- / GROK- / TGPREM- / MB- 卡密..."
                  className="ql-input flex-1 h-12 px-4 font-mono text-sm uppercase"
                  required
                />
                <button
                  type="button"
                  onClick={handlePrecheck}
                  disabled={prechecking || !cardCode.trim()}
                  className="h-12 px-5 rounded-[14px] border border-[var(--rule-strong)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--ink)] text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-45"
                >
                  {prechecking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[var(--clay)]" />
                  )}
                  <span>免费预检卡密</span>
                </button>
              </div>

              {precheckInfo && precheckInfo.success ? (
                <div className="ql-rise p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs leading-relaxed">
                  {precheckInfo.message}
                </div>
              ) : null}
            </div>

            {/* 步骤 2：动态产品线专属字段 */}
            {selectedLine === "chatgpt" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--ink)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-bold inline-flex items-center justify-center">
                      2
                    </span>
                    <span>ChatGPT 账号 Session 数据</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsHelperOpen(true)}
                    className="text-xs text-[var(--clay)] font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>30 秒图文获取教程</span>
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={sessionInput}
                  onChange={(e) => setSessionInput(e.target.value)}
                  placeholder="在已登录 chatgpt.com 的浏览器新开标签页访问 https://chatgpt.com/api/auth/session ，全选复制整段内容粘贴至此..."
                  className="ql-input w-full p-4 font-mono text-xs leading-relaxed resize-y"
                  required
                />

                <SessionPrecheckCard sessionInput={sessionInput} cardCode={cardCode} />
              </div>
            ) : null}

            {selectedLine === "sheerid" ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] text-xs text-[var(--ink-2)] space-y-1.5 leading-relaxed">
                  <div className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[var(--clay)]" />
                    <span>3 步免密获取验证链接：</span>
                  </div>
                  <p>
                    ① 登录您的 Google 账号并打开{" "}
                    <a
                      href="https://gemini.google/students"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--clay)] font-semibold underline"
                    >
                      gemini.google/students
                    </a>{" "}
                    ；② 点击验证学生资格跳转至 <code className="font-mono">services.sheerid.com</code> 页面；③ <strong>无需自行填表</strong>，直接复制地址栏完整链接粘贴到下方即可。
                  </p>
                </div>

                <label className="text-sm font-medium text-[var(--ink)] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-bold inline-flex items-center justify-center">
                    2
                  </span>
                  <span>SheerID 完整验证链接</span>
                </label>
                <input
                  type="url"
                  value={sheeridUrl}
                  onChange={(e) => setSheeridUrl(e.target.value)}
                  placeholder="https://services.sheerid.com/verify/xxxxxxxx...?verificationId=xxxxxxxx..."
                  className="ql-input w-full h-12 px-4 font-mono text-xs"
                  required
                />
              </div>
            ) : null}

            {selectedLine === "codex_sms" ? (
              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] text-xs text-[var(--ink-2)] leading-relaxed space-y-1.5">
                <div className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[var(--clay)]" />
                  <span>在线实时接码说明</span>
                </div>
                <p>
                  粘贴 <code className="font-mono">SMS-</code> 卡密后点击下方按钮获取专属海外手机号，右侧面板将每 4.5 秒实时回显短信验证码。<strong>成功收到验证码才扣卡</strong>；满 2 分钟未收码支持一键无损取消换号（单卡最多可试 8 个号）。
                </p>
              </div>
            ) : null}

            {selectedLine === "grok" ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--ink)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-bold inline-flex items-center justify-center">
                      2
                    </span>
                    <span>Grok 登录 Cookie（含 sso 与 sso-rw）</span>
                  </label>
                  <span className="text-[11px] text-[var(--clay)]">建议先点预检测首月资格</span>
                </div>
                <textarea
                  rows={5}
                  value={grokCookies}
                  onChange={(e) => setGrokCookies(e.target.value)}
                  placeholder='粘贴在 grok.com 用 Cookie-Editor 导出的 JSON 数组（需包含 sso 与 sso-rw 两项）...'
                  className="ql-input w-full p-4 font-mono text-xs resize-y"
                  required
                />
              </div>
            ) : null}

            {selectedLine === "tg_premium" ? (
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-[var(--ink)] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-bold inline-flex items-center justify-center">
                    2
                  </span>
                  <span>接收会员的 Telegram 用户名</span>
                </label>
                <input
                  type="text"
                  value={tgUsername}
                  onChange={(e) => setTgUsername(e.target.value)}
                  placeholder="例如 @finn_coder（须为当前无生效会员的个人账号）"
                  className="ql-input w-full h-12 px-4 text-sm"
                  required
                />
              </div>
            ) : null}

            {selectedLine === "muse_boost" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-[var(--ink)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-bold inline-flex items-center justify-center">
                      2
                    </span>
                    <span>Muse 6 位邀请码</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={museInviteCode}
                    onChange={(e) => setMuseInviteCode(e.target.value.trim())}
                    placeholder="输入 6 位邀请码"
                    className="ql-input w-full h-12 px-4 font-mono text-sm uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--ink)] block">助力次数</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={museUses}
                    onChange={(e) => setMuseUses(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                    className="ql-input w-full h-12 px-4 font-mono text-sm font-semibold tabular-nums"
                  />
                </div>
              </div>
            ) : null}

            {selectedLine === "gemini_pro" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--ink-2)]">Google 邮箱 *</label>
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="ql-input w-full h-11 px-3.5 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--ink-2)]">登录密码 *</label>
                    <input
                      type="password"
                      value={googlePassword}
                      onChange={(e) => setGooglePassword(e.target.value)}
                      placeholder="Google 密码"
                      className="ql-input w-full h-11 px-3.5 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--ink-2)]">
                    Base32 两步验证密钥 或 8 位一次性备用码 *{" "}
                    <span className="text-[var(--clay)]">(不支持 6 位动态码)</span>
                  </label>
                  <input
                    type="text"
                    value={googleTwofa}
                    onChange={(e) => setGoogleTwofa(e.target.value)}
                    placeholder="填写 16-256 位 Base32 密钥串或 8 位备用码"
                    className="ql-input w-full h-11 px-3.5 font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--ink-3)]">辅助邮箱（选填）</label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="如有辅助验证邮箱可一并填写"
                    className="ql-input w-full h-11 px-3.5 text-xs"
                  />
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="p-4 rounded-2xl border border-rose-500/35 bg-rose-500/10 text-rose-400 text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || Boolean(activeTask?.forbid_resubmit)}
              className="ql-shimmer-btn w-full h-12 sm:h-[52px] px-6 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold text-sm sm:text-[15px] transition-all disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md active:scale-[0.985] cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在与官方网关安全核验（最坏约 60s）...</span>
                </>
              ) : selectedLine === "codex_sms" ? (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>获取专属海外接码号码</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>立即提交自动开通</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* 右侧：高定进度追踪与实时接码/验证舱 */}
        <div className="lg:col-span-5 ql-panel p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ql-halo-dot" />
                <h3 className="font-serif-editorial text-base sm:text-lg font-semibold text-[var(--ink)]">
                  实时进度面板
                </h3>
              </div>
              {activeTask ? (
                <button
                  onClick={() => {
                    setActiveTask(null);
                    setPolling(false);
                    setShowVerifyIframe(false);
                  }}
                  className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 重置新任务
                </button>
              ) : null}
            </div>

            {!activeTask ? (
              <div className="h-80 rounded-3xl border border-dashed border-[var(--rule-strong)] flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-center text-[var(--clay)]">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">等待提交开通任务</p>
                  <p className="text-xs text-[var(--ink-3)] mt-1.5 max-w-[240px] leading-relaxed">
                    提交后将在此实时同步进度、接收短信验证码或弹出学生优惠领取按钮
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--ink-3)]">任务编号</span>
                    <span className="font-mono font-semibold text-[var(--ink)] break-all">
                      {activeTask.task_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--ink-3)]">目标账号</span>
                    <span className="font-medium text-[var(--ink)] break-all">
                      {activeTask.target_email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--ink-3)]">开通服务</span>
                    <span className="font-semibold text-[var(--clay)]">{activeTask.product_name}</span>
                  </div>
                </div>

                {/* Codex 实时短信收信箱 */}
                {activeTask.line === "codex_sms" && activeTask.sms_state ? (
                  <div className="p-4 rounded-2xl border border-[var(--rule-strong)] bg-[var(--bg-subtle)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--ink)]">
                        专属号码 ({activeTask.sms_state.country_en})
                      </span>
                      <span className="text-[var(--ink-3)] tabular-nums">
                        剩余换号 {activeTask.sms_state.numbers_left ?? "?"} 次
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)]">
                      <span className="font-mono text-sm font-bold text-[var(--ink)]">
                        {activeTask.sms_state.dial_code} {activeTask.sms_state.local}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeTask.sms_state?.local || "", "sms_phone")}
                        className="px-2.5 py-1 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === "sms_phone" ? "已复制" : "复制号码"}</span>
                      </button>
                    </div>

                    {activeTask.sms_state.code ? (
                      <div className="ql-pop p-4 rounded-2xl bg-emerald-500/12 border border-emerald-500/35 text-center space-y-1.5">
                        <span className="text-[11px] text-emerald-500 block font-medium">
                          已收到最新验证码（点击复制）
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeTask.sms_state?.code || "", "sms_otp")}
                          className="font-mono text-2xl font-bold text-emerald-500 tracking-[0.22em] inline-flex items-center gap-2"
                        >
                          <span>{activeTask.sms_state.code}</span>
                          <Copy className="w-4 h-4" />
                        </button>
                        {activeTask.sms_state.sms_text ? (
                          <p className="text-[11px] text-[var(--ink-2)] pt-1.5 border-t border-[var(--rule)]">
                            {activeTask.sms_state.sms_text}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[var(--bg-field)] border border-[var(--rule)] text-center text-[var(--ink-2)]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1.5 text-[var(--clay)]" />
                        每 4.5 秒监听短信中 · 有效期 {activeTask.sms_state.seconds_left ?? "--"}s
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={!activeTask.sms_state.can_resend || Boolean(smsActionLoading)}
                        onClick={() => handleSmsControl("resend")}
                        className="py-2 rounded-xl border border-[var(--rule-strong)] text-[var(--ink)] disabled:opacity-40 cursor-pointer"
                      >
                        重发短信
                      </button>
                      <button
                        type="button"
                        disabled={!activeTask.sms_state.can_cancel || Boolean(smsActionLoading)}
                        onClick={() => handleSmsControl("cancel")}
                        className="py-2 rounded-xl border border-[var(--rule-strong)] text-[var(--ink)] disabled:opacity-40 cursor-pointer"
                      >
                        {activeTask.sms_state.can_cancel
                          ? "无码换号"
                          : `换号(${activeTask.sms_state.cancel_in ?? 0}s)`}
                      </button>
                      <button
                        type="button"
                        disabled={!activeTask.sms_state.can_finish || Boolean(smsActionLoading)}
                        onClick={() => handleSmsControl("finish")}
                        className="py-2 rounded-xl border border-[var(--rule-strong)] text-[var(--ink)] disabled:opacity-40 cursor-pointer"
                      >
                        完成结束
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* 安全验证卡片 */}
                {activeTask.action_required && activeTask.verification_url && !activeTask.finished ? (
                  <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-500 font-semibold">
                      <Sparkles className="w-4 h-4" />
                      <span>请完成一次安全验证 ({activeTask.action_required})</span>
                    </div>
                    <p className="text-[var(--ink-2)] leading-relaxed">
                      完成后无需重新提交，当前页面将自动继续并完成开通。
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={activeTask.verification_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold inline-flex items-center gap-1.5"
                      >
                        <span>打开安全验证窗口</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowVerifyIframe((v) => !v)}
                        className="px-3 py-2 rounded-xl border border-[var(--rule-strong)] text-[var(--ink)]"
                      >
                        {showVerifyIframe ? "收起内嵌窗口" : "页内展开"}
                      </button>
                    </div>
                    {showVerifyIframe ? (
                      <iframe
                        src={activeTask.verification_url}
                        referrerPolicy="no-referrer"
                        className="w-full h-64 rounded-xl border border-[var(--rule)] bg-white mt-2"
                        title="Security Verification"
                      />
                    ) : null}
                  </div>
                ) : null}

                {/* 丝滑进度条 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center tabular-nums">
                    <span className="text-[var(--ink-2)] font-medium">{activeTask.status}</span>
                    <span className="font-semibold text-[var(--ink)]">{activeTask.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--rule)]">
                    <div
                      className="h-full bg-gradient-to-r from-[#4E9578] via-[#E6BE8A] to-[#E27B58] transition-all duration-500 rounded-full"
                      style={{ width: `${activeTask.progress}%` }}
                    />
                  </div>
                </div>

                {/* 时间轴日志 */}
                <div
                  ref={logContainerRef}
                  className="h-44 rounded-2xl border border-[var(--rule)] bg-[var(--bg-field)] p-3.5 overflow-y-auto space-y-2 select-text"
                >
                  {safeLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed text-[11.5px]">
                      <span className="text-[var(--ink-3)] font-mono mr-2 text-[10.5px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={
                          log.level === "SUCCESS"
                            ? "text-emerald-500 font-semibold"
                            : log.level === "ERROR"
                            ? "text-rose-400 font-semibold"
                            : log.level === "WARN"
                            ? "text-amber-500"
                            : "text-[var(--ink-2)]"
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>

                {activeTask.finished ? (
                  <div
                    className={`ql-rise p-4 rounded-2xl border space-y-3 ${
                      activeTask.success
                        ? "border-emerald-500/35 bg-emerald-500/10"
                        : "border-rose-500/35 bg-rose-500/10"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {activeTask.success ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold text-[var(--ink)] block">
                          {activeTask.success ? "开通已完成" : `未能完成 (${activeTask.error_code || "提示"})`}
                        </span>
                        <span className="text-[var(--ink-2)] block mt-0.5 leading-relaxed">
                          {activeTask.success
                            ? "您的订阅或认证权益已确认生效！"
                            : activeTask.error_message || "任务未能完成"}
                        </span>
                      </div>
                    </div>

                    {activeTask.redirect_url ? (
                      <a
                        href={activeTask.redirect_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ql-shimmer-btn w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold inline-flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <span>打开 Google 官方学生优惠领取页面</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : null}

                    {activeTask.disposal_hint ? (
                      <p className="text-[11.5px] text-[var(--ink-2)] bg-[var(--bg-field)] p-3 rounded-xl border border-[var(--rule)] leading-relaxed">
                        建议：{activeTask.disposal_hint}
                      </p>
                    ) : null}

                    {!activeTask.success ? (
                      <button
                        type="button"
                        onClick={() => setIsTicketOpen(true)}
                        className="w-full py-2.5 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>一键提交售后工单</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--rule)] text-[11px] text-[var(--ink-3)] flex items-center justify-between">
            <span>零密码安全协议</span>
            <span>云端保险柜全程存证</span>
          </div>
        </div>
      </div>
    </div>
  );
};
