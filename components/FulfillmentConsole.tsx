"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  FileCode,
  Radio,
  Copy,
  ExternalLink,
  Smartphone,
  GraduationCap,
  AtSign,
  Rocket,
  Mail,
  Headphones,
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

interface Props {
  presetPrefix?: string;
  onTaskChange?: (count: number) => void;
}

const LINE_TABS: Array<{
  id: ActivationLine;
  label: string;
  prefixHint: string;
  pollMs: number;
}> = [
  { id: "chatgpt", label: "ChatGPT 四档", prefixHint: "PLS- / P10X- / P20X- / P50X-", pollMs: 3000 },
  { id: "sheerid", label: "Gemini 学生认证", prefixHint: "GSTU-", pollMs: 8000 },
  { id: "codex_sms", label: "Codex 在线接码", prefixHint: "SMS-", pollMs: 4500 },
  { id: "grok", label: "Grok 订阅", prefixHint: "GROK-", pollMs: 3000 },
  { id: "tg_premium", label: "Telegram 会员", prefixHint: "TGPREM-", pollMs: 5000 },
  { id: "muse_boost", label: "Muse 10亿助力", prefixHint: "MB-", pollMs: 5000 },
  { id: "gemini_pro", label: "Gemini Pro 季卡", prefixHint: "G-3MON-", pollMs: 10000 },
];

export const FulfillmentConsole: React.FC<Props> = ({
  presetPrefix,
  onTaskChange,
}) => {
  const [cardCode, setCardCode] = useState("");
  const [selectedLine, setSelectedLine] = useState<ActivationLine>("chatgpt");
  const [manualLineOverride, setManualLineOverride] = useState(false);
  const [matchedProduct, setMatchedProduct] = useState<ProductInfo | null>(null);

  // 各产品线专属输入状态
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

  // 预检与任务执行状态
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
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

  // 自适应轮询间隔（严格遵守苏哲各产品线频率规范）
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
          setActiveTask(data.task);
          if (data.task.finished && data.task.line !== "codex_sms") {
            setPolling(false);
            onTaskChange?.(0);
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [polling, activeTask, onTaskChange]);

  const handlePrecheck = async () => {
    const code = cardCode.trim();
    if (!code) {
      setErrorMessage("请先在上方输入卡密后再点击预检");
      return;
    }
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
      } else if (data.line === "muse_boost" && data.card?.remaining_uses) {
        setMuseUses((prev) => Math.min(prev, data.card.remaining_uses));
      }
    } catch {
      setErrorMessage("预检请求超时，请检查网络后重试");
    } finally {
      setPrechecking(false);
    }
  };

  const handleSubmit = async (confirmDuplicate = false) => {
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
        setErrorMessage("Session JSON 格式不合法，请完整复制 chatgpt.com/api/auth/session 的全部内容");
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
      setErrorMessage("网络连接异常，若提交耗时较长请前往【03. 凭据查询】核实是否已受理，避免重复提交");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSmsControl = async (action: "resend" | "cancel" | "finish") => {
    if (!activeTask) return;
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
    <div className="relative z-10 space-y-6 my-6">
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

      {/* 顶部 7 大产品线全息切换栏 */}
      <div className="p-2 rounded-2xl border border-white/10 bg-[#080d15]/90 backdrop-blur-md flex items-center gap-1.5 overflow-x-auto">
        {LINE_TABS.map((tab) => {
          const active = selectedLine === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedLine(tab.id);
                setManualLineOverride(true);
                setErrorMessage(null);
                setPrecheckInfo(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                active
                  ? "bg-cyan-950/90 text-white border border-[var(--holo)]/70 shadow-[0_0_15px_rgba(0,229,216,0.2)] font-bold"
                  : "text-neutral-400 hover:text-white border border-transparent hover:bg-white/[0.03]"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[9px] text-cyan-400/80 hidden sm:inline">{tab.prefixHint}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* 左侧：动态自适应激活表单 (7 cols) */}
        <div className="lg:col-span-7 glass-card corner-bracket p-6 sm:p-8 rounded-lg shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-cyan-950/60 border border-cyan-400/30 flex items-center justify-center text-[var(--holo)]">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
                  7-IN-1 AUTONOMOUS DISPATCH (七合一全能激活台)
                </h2>
                <span className="text-[10px] text-neutral-400 font-mono">
                  粘贴卡密自动变形专属表单 · 前置体检不扣次数
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-cyan-300/80 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
              SUZHE V2 LIVE
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(false);
            }}
            className="space-y-5"
          >
            {/* 01. 通用卡密输入框 + 一键前置体检 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-xs text-neutral-200 tracking-wide flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[var(--holo)]" />
                  <span>01. 兑换卡密 (CARD / CDK CODE)</span>
                  <span className="text-rose-400">*</span>
                </label>
                {matchedProduct ? (
                  <span className="text-[11px] font-mono text-[var(--holo)] px-2 py-0.5 rounded border border-cyan-400/40 bg-cyan-950/50 font-medium">
                    识别: {matchedProduct.name}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={cardCode}
                  onChange={(e) => {
                    setManualLineOverride(false);
                    setCardCode(e.target.value);
                  }}
                  placeholder="粘贴 PLS- / P10X- / P20X- / P50X- / GSTU- / SMS- / GROK- / TGPREM- / MB- 卡密..."
                  className="flex-1 bg-black/50 border border-white/10 hover:border-white/20 focus:border-[var(--holo)] rounded-md px-4 py-3 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={handlePrecheck}
                  disabled={prechecking || !cardCode.trim()}
                  className="px-4 py-3 rounded-md border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 text-[var(--warm)] font-mono text-xs font-bold whitespace-nowrap inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {prechecking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>免费预检卡密</span>
                </button>
              </div>

              {precheckInfo && precheckInfo.success ? (
                <div className="mt-2.5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-emerald-200 text-xs font-mono">
                  {precheckInfo.message}
                </div>
              ) : null}
            </div>

            {/* 02. 动态产品线专属表单 */}
            {selectedLine === "chatgpt" ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-mono text-xs text-neutral-200 tracking-wide flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-[var(--warm)]" />
                      <span>02. CHATGPT 会话凭证 (SESSION JSON)</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsHelperOpen(true)}
                      className="text-[11px] font-mono text-[var(--warm)] hover:underline inline-flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>如何获取 Session?</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={sessionInput}
                    onChange={(e) => setSessionInput(e.target.value)}
                    placeholder="请先登录 chatgpt.com，打开 https://chatgpt.com/api/auth/session 全选复制粘贴至此..."
                    className="w-full bg-black/50 border border-white/10 hover:border-white/20 focus:border-[var(--holo)] rounded-md p-4 text-xs font-mono text-cyan-200 placeholder-neutral-600 focus:outline-none resize-y leading-relaxed"
                    required
                  />
                </div>
                <SessionPrecheckCard sessionInput={sessionInput} cardCode={cardCode} />
              </div>
            ) : null}

            {selectedLine === "sheerid" ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/25 text-xs font-mono text-neutral-300 space-y-1.5">
                  <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Gemini 学生认证极简 3 步指引（零密码免登）：</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    1. 在已登录您 Google 账号的浏览器打开{" "}
                    <a
                      href="https://gemini.google/students"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--warm)] underline"
                    >
                      gemini.google/students
                    </a>{" "}
                    确认可见学生优惠入口；
                    <br />
                    2. 点击进入学生身份验证页面（跳转到 <code className="text-cyan-300">services.sheerid.com/verify/...</code>）；
                    <br />
                    3. <strong>不要自己在网页填写资料</strong>，直接把浏览器地址栏完整的验证链接粘贴到下方提交！
                  </p>
                </div>

                <div>
                  <label className="font-mono text-xs text-neutral-200 block mb-2">
                    02. SheerID 完整验证链接 (VERIFICATION URL) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={sheeridUrl}
                    onChange={(e) => setSheeridUrl(e.target.value)}
                    placeholder="https://services.sheerid.com/verify/xxxxxxxx...?verificationId=xxxxxxxx..."
                    className="w-full bg-black/50 border border-white/10 focus:border-[var(--holo)] rounded-md px-4 py-3 text-xs font-mono text-cyan-200 focus:outline-none"
                    required
                  />
                </div>
              </div>
            ) : null}

            {selectedLine === "codex_sms" ? (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/25 text-xs font-mono space-y-2">
                <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>Codex / OpenAI 在线实时接码说明：</span>
                </div>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  输入 <code className="text-amber-300">SMS-</code> 卡密后点击下方【获取专属海外号码】，右侧雷达台将立即分配国家区号与手机号，并每 4.5 秒自动监听回显短信验证码。<strong>成功收到验证码才扣卡</strong>；若满 2 分钟未收到短信，可在右侧一键无损取消换号（单卡最多支持试 8 个号）！
                </p>
              </div>
            ) : null}

            {selectedLine === "grok" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs text-neutral-200">
                    02. Grok 登录 Cookie (必含 <code className="text-cyan-300">sso</code> 与{" "}
                    <code className="text-cyan-300">sso-rw</code>) <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-amber-300">
                    粘贴后建议先点上方「免费预检卡密」测首月资格
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={grokCookies}
                  onChange={(e) => setGrokCookies(e.target.value)}
                  placeholder='支持粘贴 grok.com 页面通过 Cookie-Editor 导出的 JSON 数组 [{"name":"sso","value":"..."},{"name":"sso-rw","value":"..."}] 或完整 Cookie 字符串'
                  className="w-full bg-black/50 border border-white/10 focus:border-[var(--holo)] rounded-md p-3.5 text-xs font-mono text-cyan-200 focus:outline-none"
                  required
                />
              </div>
            ) : null}

            {selectedLine === "tg_premium" ? (
              <div className="space-y-3">
                <label className="font-mono text-xs text-neutral-200 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-cyan-400" />
                  <span>02. 接收会员的 Telegram 用户名 (@username)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={tgUsername}
                  onChange={(e) => setTgUsername(e.target.value)}
                  placeholder="例如: @finn_coder 或 t.me/finn_coder（当前无生效 TG 会员的个人号）"
                  className="w-full bg-black/50 border border-white/10 focus:border-[var(--holo)] rounded-md px-4 py-3 text-sm font-mono text-white focus:outline-none"
                  required
                />
                <p className="text-[11px] font-mono text-neutral-400">
                  提示：填好用户名后可先点上方「免费预检卡密」核验该账号是否满足接收资格，30秒–2分钟自动空投到账。
                </p>
              </div>
            ) : null}

            {selectedLine === "muse_boost" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-mono text-xs text-neutral-200 flex items-center gap-1.5 mb-2">
                    <Rocket className="w-3.5 h-3.5 text-[var(--warm)]" />
                    <span>02. Muse 6位邀请码</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={museInviteCode}
                    onChange={(e) => setMuseInviteCode(e.target.value.trim())}
                    placeholder="输入 6 位字母数字邀请码 (如 ABC123)"
                    className="w-full bg-black/50 border border-white/10 focus:border-[var(--holo)] rounded-md px-4 py-3 text-sm font-mono text-white uppercase focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-mono text-xs text-neutral-200 block mb-2">
                    本次助力次数 (1-30)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={museUses}
                    onChange={(e) => setMuseUses(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-full bg-black/50 border border-white/10 focus:border-[var(--holo)] rounded-md px-4 py-3 text-sm font-mono text-cyan-300 font-bold focus:outline-none"
                  />
                </div>
              </div>
            ) : null}

            {selectedLine === "gemini_pro" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-xs text-neutral-200 flex items-center gap-1 mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Google 账号邮箱 *</span>
                    </label>
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full bg-black/50 border border-white/10 focus:border-[var(--holo)] rounded-md px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-neutral-200 block mb-1.5">
                      Google 登录密码 *
                    </label>
                    <input
                      type="password"
                      value={googlePassword}
                      onChange={(e) => setGooglePassword(e.target.value)}
                      placeholder="输入账号密码"
                      className="w-full bg-black/50 border border-white/10 focus:border-[var(--holo)] rounded-md px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs text-neutral-200 block mb-1.5">
                    两步验证 Base32 密钥 或 8位一次性备用码 *{" "}
                    <span className="text-amber-300 text-[10px]">(切勿填6位动态码)</span>
                  </label>
                  <input
                    type="text"
                    value={googleTwofa}
                    onChange={(e) => setGoogleTwofa(e.target.value)}
                    placeholder="16-256位 Base32 密钥串，或 8位数字备用码"
                    className="w-full bg-black/50 border border-white/10 focus:border-[var(--holo)] rounded-md px-3.5 py-2.5 text-xs font-mono text-cyan-200 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-mono text-xs text-neutral-400 block mb-1">
                    辅助验证邮箱 (选填)
                  </label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="如有辅助邮箱可一并填入提高一次通过率"
                    className="w-full bg-black/50 border border-white/10 focus:border-[var(--holo)] rounded-md px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="p-3.5 rounded-md border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || Boolean(activeTask?.forbid_resubmit)}
                className="laser-sweeper w-full py-3.5 px-6 rounded-md border border-[var(--holo)] bg-gradient-to-r from-cyan-950/80 via-cyan-900/60 to-cyan-950/80 hover:brightness-110 text-white font-mono text-sm tracking-wider font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(0,229,216,0.2)] cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--holo)]" />
                    <span>正在与苏哲上游网关握手核验 (最长约60-80秒)...</span>
                  </>
                ) : selectedLine === "codex_sms" ? (
                  <>
                    <Smartphone className="w-4 h-4 text-[var(--holo)]" />
                    <span>获取 / 恢复专属海外接码手机号</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[var(--holo)]" />
                    <span>派发自动化激活履约任务 (DISPATCH)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 右侧：全息遥测雷达与接码/验证交互舱 (5 cols) */}
        <div className="lg:col-span-5 glass-card corner-bracket corner-bracket-warm p-6 sm:p-7 rounded-lg shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <h3 className="font-mono text-xs font-bold text-white tracking-wider uppercase">
                  TELEMETRY RADAR (实时履约雷达)
                </h3>
              </div>
              {activeTask ? (
                <button
                  onClick={() => {
                    setActiveTask(null);
                    setPolling(false);
                    setShowVerifyIframe(false);
                  }}
                  className="text-[10px] font-mono text-neutral-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> 新任务重置
                </button>
              ) : null}
            </div>

            {!activeTask ? (
              <div className="h-80 rounded-md border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 text-neutral-400 font-mono text-xs space-y-3">
                <div className="w-12 h-12 rounded-full border border-cyan-400/20 bg-cyan-950/30 flex items-center justify-center text-[var(--holo)] animate-pulse">
                  <Radio className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-medium">7 合 1 调度引擎待命中</p>
                  <p className="text-[11px] text-neutral-500 mt-1 max-w-[260px] leading-relaxed">
                    在左侧输入卡密与对应凭据，启动后将在此实时展示任务进度、短信验证码或学生优惠领取链接
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                {/* 任务核心信息 */}
                <div className="p-3.5 rounded-md border border-white/[0.08] bg-black/40 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-500">TASK ID:</span>
                    <span className="text-[var(--holo)] font-bold break-all">{activeTask.task_id}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-500">TARGET:</span>
                    <span className="text-gray-200 break-all">{activeTask.target_email}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-500">CHANNEL:</span>
                    <span className="text-[var(--warm)] font-medium">{activeTask.product_name}</span>
                  </div>
                </div>

                {/* 专属模块 A：Codex 实时接码收信与换号面板 */}
                {activeTask.line === "codex_sms" && activeTask.sms_state ? (
                  <div className="p-4 rounded-xl border border-cyan-400/40 bg-cyan-950/25 space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-cyan-300 font-bold">
                        分配号码 ({activeTask.sms_state.country_en})
                      </span>
                      <span className="text-neutral-400">
                        卡内余 {activeTask.sms_state.numbers_left ?? "?"} 次换号
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/70 border border-white/10">
                      <span className="text-sm font-extrabold text-white tracking-wider">
                        {activeTask.sms_state.dial_code} {activeTask.sms_state.local}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            activeTask.sms_state?.local || "",
                            "sms_phone"
                          )
                        }
                        className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 text-[11px] inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === "sms_phone" ? "已复制号码" : "复制本地号"}</span>
                      </button>
                    </div>

                    {/* 验证码大屏回显 */}
                    {activeTask.sms_state.code ? (
                      <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-400/50 text-center space-y-1.5">
                        <span className="text-[10px] text-emerald-300 block">
                          📩 已收到最新验证码 (点击复制):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeTask.sms_state?.code || "", "sms_otp")}
                          className="text-2xl font-extrabold text-emerald-300 tracking-[0.25em] hover:text-white inline-flex items-center gap-2"
                        >
                          <span>{activeTask.sms_state.code}</span>
                          <Copy className="w-4 h-4" />
                        </button>
                        {activeTask.sms_state.sms_text ? (
                          <p className="text-[10px] text-neutral-300 pt-1 border-t border-white/10">
                            {activeTask.sms_state.sms_text}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-black/50 border border-white/5 text-center text-[11px] text-amber-200">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />
                        正在每 4.5 秒监听短信... 剩余有效期 {activeTask.sms_state.seconds_left ?? "--"}s
                      </div>
                    )}

                    {/* 接码控制按钮组 */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!activeTask.sms_state.can_resend || Boolean(smsActionLoading)}
                        onClick={() => handleSmsControl("resend")}
                        className="py-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-200 text-[11px] disabled:opacity-40 cursor-pointer"
                      >
                        重发短信
                      </button>
                      <button
                        type="button"
                        disabled={!activeTask.sms_state.can_cancel || Boolean(smsActionLoading)}
                        onClick={() => handleSmsControl("cancel")}
                        className="py-2 rounded-lg border border-amber-500/30 bg-amber-950/40 text-amber-200 text-[11px] disabled:opacity-40 cursor-pointer"
                        title="取号满2分钟未收码即可免费取消释放额度"
                      >
                        {activeTask.sms_state.can_cancel
                          ? "无码换号"
                          : `换号(${activeTask.sms_state.cancel_in ?? 0}s)`}
                      </button>
                      <button
                        type="button"
                        disabled={!activeTask.sms_state.can_finish || Boolean(smsActionLoading)}
                        onClick={() => handleSmsControl("finish")}
                        className="py-2 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 text-[11px] disabled:opacity-40 cursor-pointer"
                      >
                        完成结束
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* 专属模块 B：ChatGPT / Grok 安全人机或 3DS 验证引导卡片 */}
                {activeTask.action_required && activeTask.verification_url && !activeTask.finished ? (
                  <div className="p-4 rounded-xl border border-amber-400/60 bg-amber-950/35 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>需要您完成一次安全验证 ({activeTask.action_required})</span>
                    </div>
                    <p className="text-[11px] text-amber-100/90 leading-relaxed">
                      请点击下方按钮完成验证，完成后无需重新提交，本雷达会自动感知并完成开通！
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={activeTask.verification_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-lg bg-amber-400 text-black font-extrabold text-xs inline-flex items-center gap-1.5"
                      >
                        <span>新窗口打开安全验证页</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowVerifyIframe((v) => !v)}
                        className="px-3 py-2 rounded-lg border border-amber-400/40 text-amber-200 text-[11px]"
                      >
                        {showVerifyIframe ? "收起内嵌窗口" : "页内展开验证"}
                      </button>
                    </div>
                    {showVerifyIframe ? (
                      <iframe
                        src={activeTask.verification_url}
                        referrerPolicy="no-referrer"
                        className="w-full h-64 rounded-lg border border-white/15 bg-white mt-2"
                        title="Security Verification"
                      />
                    ) : null}
                  </div>
                ) : null}

                {/* 进度条 */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-neutral-300">状态: {activeTask.status}</span>
                    <span className="text-[var(--holo)] font-bold">{activeTask.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/60 rounded-full border border-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-[var(--holo)] to-emerald-400 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(0,229,216,0.8)]"
                      style={{ width: `${activeTask.progress}%` }}
                    />
                  </div>
                </div>

                {/* 日志流 (已做严格数组空值保护) */}
                <div>
                  <span className="text-[10px] text-neutral-400 block mb-1">
                    EXECUTION LOG STREAM (实时日志流):
                  </span>
                  <div
                    ref={logContainerRef}
                    className="h-44 rounded-md border border-white/[0.08] bg-black/70 p-3 overflow-y-auto text-[11px] space-y-2 select-text"
                  >
                    {safeLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        <span className="text-neutral-500 mr-2 text-[10px]">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span
                          className={
                            log.level === "SUCCESS"
                              ? "text-emerald-300 font-bold"
                              : log.level === "ERROR"
                              ? "text-rose-300 font-bold"
                              : log.level === "WARN"
                              ? "text-amber-300"
                              : "text-cyan-200/90"
                          }
                        >
                          {log.message}
                        </span>
                      </div>
                    ))}
                    {polling && !activeTask.finished ? (
                      <div className="text-neutral-500 animate-pulse text-[10px]">
                        › 正在与上游网关保持加密长轮询同步...
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* 终态结果与 SheerID 领取链接 / 售后分流卡片 */}
                {activeTask.finished ? (
                  <div
                    className={`p-4 rounded-xl border space-y-2.5 ${
                      activeTask.success
                        ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                        : "border-rose-500/40 bg-rose-950/40 text-rose-200"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {activeTask.success ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold block">
                          {activeTask.success
                            ? "PROVISIONING COMPLETED (履约成功)"
                            : `TASK FAILED (${activeTask.error_code || "未通过"})`}
                        </span>
                        <span className="text-[11px] text-neutral-300 block mt-1 leading-relaxed">
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
                        className="w-full py-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-lg"
                      >
                        <span>🎉 点击打开 Google 官方学生优惠领取页面</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : null}

                    {activeTask.disposal_hint ? (
                      <p className="text-[11px] text-amber-200 bg-black/40 p-2.5 rounded border border-white/10 leading-relaxed">
                        💡 处置指引：{activeTask.disposal_hint}
                      </p>
                    ) : null}

                    {!activeTask.success ? (
                      <button
                        type="button"
                        onClick={() => setIsTicketOpen(true)}
                        className="w-full py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 font-bold text-[11px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>附带 TASK ID 一键提交售后工单</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-neutral-500 flex items-center justify-between">
            <span>SUPABASE VAULT LOGGED</span>
            <span className="text-[var(--holo)]">7-LINE ROUTER V2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
