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
  Zap,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  FileCode,
  Radio
} from "lucide-react";
import { detectProductByCode } from "@/lib/products-config";
import { ProductInfo, TaskRecord, DuplicateConfirmError } from "@/lib/types";
import { CollisionWarningModal } from "./CollisionWarningModal";
import { SessionHelperModal } from "./SessionHelperModal";

interface Props {
  presetPrefix?: string;
  onTaskChange?: (count: number) => void;
}

export const FulfillmentConsole: React.FC<Props> = ({
  presetPrefix,
  onTaskChange,
}) => {
  const [cardCode, setCardCode] = useState("");
  const [sessionInput, setSessionInput] = useState("");
  const [matchedProduct, setMatchedProduct] = useState<ProductInfo | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskRecord | null>(null);
  const [polling, setPolling] = useState(false);

  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [collisionError, setCollisionError] = useState<DuplicateConfirmError | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (presetPrefix) {
      setCardCode((prev) => {
        if (!prev) return presetPrefix + "DEMO-8888-9999";
        return presetPrefix + prev.replace(/^[A-Za-z0-9]+-?/, "");
      });
    }
  }, [presetPrefix]);

  useEffect(() => {
    if (!cardCode.trim()) {
      setMatchedProduct(null);
      return;
    }
    const detected = detectProductByCode(cardCode);
    setMatchedProduct(detected);
  }, [cardCode]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activeTask?.log_trace]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (polling && activeTask && !activeTask.finished) {
      timer = setInterval(async () => {
        try {
          const resp = await fetch("/api/task/" + activeTask.task_id);
          if (resp.ok) {
            const data = await resp.json();
            if (data.task) {
              setActiveTask(data.task);
              if (data.task.finished) {
                setPolling(false);
                onTaskChange?.(0);
              }
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [polling, activeTask, onTaskChange]);

  const handleSubmit = async (confirmDuplicate = false) => {
    setErrorMessage(null);
    setSubmitting(true);

    let parsedSession: any = null;
    try {
      parsedSession = JSON.parse(sessionInput);
    } catch {
      setErrorMessage("Session JSON 格式不合法，必须为标准 JSON 字符串");
      setSubmitting(false);
      return;
    }

    try {
      const resp = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_code: cardCode.trim(),
          session_data: parsedSession,
          confirm_duplicate: confirmDuplicate,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (resp.status === 409 && data.duplicate) {
          setCollisionError(data);
          setSubmitting(false);
          return;
        }
        setErrorMessage(data.detail || data.error || "任务分派失败");
        setSubmitting(false);
        return;
      }

      setCollisionError(null);
      onTaskChange?.(1);

      const initialTask: TaskRecord = {
        task_id: data.task_id,
        card_code_masked: cardCode.slice(0, 4) + "••••-••••-" + cardCode.slice(-4),
        product_id: matchedProduct?.id || "unknown",
        product_name: matchedProduct?.name || "AI Subscription",
        target_email: parsedSession?.user?.email || "user@openai.com",
        status: "QUEUED",
        progress: 15,
        finished: false,
        success: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        log_trace: [
          {
            timestamp: new Date().toISOString(),
            level: "INFO",
            message: "任务握手完成，已建立量子链路长轮询通道...",
          },
        ],
      };

      setActiveTask(initialTask);
      setPolling(true);
    } catch (err) {
      setErrorMessage("网络连接故障，未能抵达履约代理端");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillSandboxMock = (type: "normal" | "duplicate" | "blocked") => {
    setCardCode("PH-ALPHA-9921-TEST");
    const email =
      type === "normal"
        ? "quantum.user@openai-test.org"
        : type === "duplicate"
        ? "duplicate@test.com"
        : "blocked@test.com";

    const mockSession = {
      user: {
        id: "usr_mock_007",
        name: "Sandbox Engineer",
        email: email,
      },
      expires: "2026-10-25T00:00:00.000Z",
      accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.sandbox_token_mock_test",
    };
    setSessionInput(JSON.stringify(mockSession, null, 2));
    setErrorMessage(null);
  };

  return (
    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-7 my-6">
      <SessionHelperModal
        isOpen={isHelperOpen}
        onClose={() => setIsHelperOpen(false)}
        onApplySample={(sample) => setSessionInput(sample)}
      />

      <CollisionWarningModal
        isOpen={!!collisionError}
        errorInfo={collisionError}
        onCancel={() => setCollisionError(null)}
        isLoading={submitting}
        onConfirmOverride={() => handleSubmit(true)}
      />

      {/* 左侧：表单录入区 (7 cols) */}
      <div className="lg:col-span-7 glass-card corner-bracket p-6 sm:p-8 rounded-lg shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-cyan-950/60 border border-cyan-400/30 flex items-center justify-center text-[var(--holo)]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
                FULFILLMENT DISPATCH (履约开通终端)
              </h2>
              <span className="text-[10px] text-neutral-400 font-mono">
                凭卡密与会话凭证，10秒自动化安全下发
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-cyan-300/80 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
            TLS 1.3 SECURE
          </span>
        </div>

        {/* 快捷测试演练胶囊 */}
        <div className="mb-6 p-3.5 rounded-md border border-white/[0.06] bg-white/[0.02] text-xs font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-300 font-bold flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--warm)]" />
              快速沙盒演练桩 (点击一键载入测试):
            </span>
            <span className="text-[10px] text-[var(--holo)]">无卡密也能体验</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFillSandboxMock("normal")}
              className="px-3 py-1 rounded border border-white/10 hover:border-cyan-400/60 bg-black/40 text-cyan-200 hover:text-white text-[11px] transition-all"
            >
              标准正常履约测试
            </button>
            <button
              type="button"
              onClick={() => handleFillSandboxMock("duplicate")}
              className="px-3 py-1 rounded border border-amber-500/30 hover:border-amber-400 bg-amber-950/20 text-amber-300 hover:text-white text-[11px] transition-all"
            >
              409 二次确认测试
            </button>
            <button
              type="button"
              onClick={() => handleFillSandboxMock("blocked")}
              className="px-3 py-1 rounded border border-rose-500/30 hover:border-rose-400 bg-rose-950/20 text-rose-300 hover:text-white text-[11px] transition-all"
            >
              409 强熔断拦截
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="space-y-5"
        >
          {/* 卡密输入 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-xs text-neutral-200 tracking-wide flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[var(--holo)]" />
                <span>01. 激活凭证 / 兑换卡密 (CARD CODE)</span>
                <span className="text-rose-400">*</span>
              </label>
              {matchedProduct && (
                <span className="text-[11px] font-mono text-[var(--holo)] px-2 py-0.5 rounded border border-cyan-400/40 bg-cyan-950/50 animate-pulse font-medium">
                  已匹配: {matchedProduct.name}
                </span>
              )}
            </div>
            <input
              type="text"
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value)}
              placeholder="例如: PH-XXXX-XXXX-XXXX 或 PRO20SPECIAL-XXXX"
              className="w-full bg-black/50 border border-white/10 hover:border-white/20 focus:border-[var(--holo)] rounded-md px-4 py-3 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              required
            />
          </div>

          {/* Session 输入 */}
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
                如何获取 Session?
              </button>
            </div>
            <textarea
              rows={6}
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              placeholder="请完整粘贴 https://chatgpt.com/api/auth/session 的 JSON 字符串"
              className="w-full bg-black/50 border border-white/10 hover:border-white/20 focus:border-[var(--holo)] rounded-md p-4 text-xs font-mono text-cyan-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-y leading-relaxed"
              required
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-md border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || polling}
              className="laser-sweeper w-full py-3.5 px-6 rounded-md border border-[var(--holo)] bg-gradient-to-r from-cyan-950/80 via-cyan-900/60 to-cyan-950/80 hover:brightness-110 text-white font-mono text-sm tracking-wider font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(0,229,216,0.2)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--holo)]" />
                  <span>正在构建链路任务 (INITIALIZING)...</span>
                </>
              ) : polling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--warm)]" />
                  <span>任务执行监控中 (MONITORING)...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[var(--holo)]" />
                  <span>派发自动化激活任务 (DISPATCH TASK)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 右侧：状态大盘 (5 cols) */}
      <div className="lg:col-span-5 glass-card corner-bracket corner-bracket-warm p-6 sm:p-7 rounded-lg shadow-xl flex flex-col justify-between">
        <div>
          {/* 终端头部仿真圆点 */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <h3 className="font-mono text-xs font-bold text-white tracking-wider uppercase">
                TELEMETRY RADAR (实时状态)
              </h3>
            </div>
            {activeTask && (
              <button
                onClick={() => {
                  setActiveTask(null);
                  setPolling(false);
                }}
                className="text-[10px] font-mono text-neutral-400 hover:text-white inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> 重置
              </button>
            )}
          </div>

          {!activeTask ? (
            <div className="h-80 rounded-md border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 text-neutral-400 font-mono text-xs space-y-3">
              <div className="w-12 h-12 rounded-full border border-cyan-400/20 bg-cyan-950/30 flex items-center justify-center text-[var(--holo)] animate-pulse">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white font-medium">调度中枢待命中</p>
                <p className="text-[11px] text-neutral-500 mt-1 max-w-[240px] leading-relaxed">
                  在左侧录入卡密与 Session，启动后将建立端到端状态追踪
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 任务指标卡 */}
              <div className="p-3.5 rounded-md border border-white/[0.08] bg-black/40 font-mono text-xs space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-500">TASK ID:</span>
                  <span className="text-[var(--holo)] font-bold">{activeTask.task_id}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-500">TARGET:</span>
                  <span className="text-gray-200">{activeTask.target_email}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-500">PRODUCT:</span>
                  <span className="text-[var(--warm)] font-medium">{activeTask.product_name}</span>
                </div>
              </div>

              {/* 进度条 */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-neutral-300">状态: {activeTask.status}</span>
                  <span className="text-[var(--holo)] font-bold">{activeTask.progress}%</span>
                </div>
                <div className="w-full h-2 bg-black/60 rounded-full border border-white/10 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-[var(--holo)] to-emerald-400 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(0,229,216,0.8)]"
                    style={{ width: activeTask.progress + "%" }}
                  />
                </div>
              </div>

              {/* 动态日志流 */}
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block mb-1">
                  EXECUTION LOG STREAM (执行日志流):
                </span>
                <div
                  ref={logContainerRef}
                  className="h-44 rounded-md border border-white/[0.08] bg-black/70 p-3 overflow-y-auto font-mono text-[11px] space-y-2 select-text"
                >
                  {activeTask.log_trace.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span className="text-neutral-500 mr-2 text-[10px]">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span
                        className={
                          log.level === "SUCCESS"
                            ? "text-emerald-300 font-bold"
                            : log.level === "WARN"
                            ? "text-amber-300"
                            : "text-cyan-200/90"
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {polling && (
                    <div className="text-neutral-500 animate-pulse text-[10px]">
                      › 正在保持长连接轮询中...
                    </div>
                  )}
                </div>
              </div>

              {/* 完成卡片 */}
              {activeTask.finished && (
                <div
                  className={"p-3.5 rounded-md border font-mono text-xs flex items-center gap-3 " + (
                    activeTask.success
                      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                      : "border-rose-500/40 bg-rose-950/40 text-rose-200"
                  )}
                >
                  {activeTask.success ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {activeTask.success ? "PROVISIONING SUCCESS (订阅下发完毕)" : "PROVISIONING FAILED"}
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">
                      {activeTask.success
                        ? "目标账号权益已生效，刷新 chatgpt.com 即可体验。"
                        : activeTask.error_message || "任务处理失败，卡密已解绑保护。"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部保障 */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-neutral-500 flex items-center justify-between">
          <span>TOKEN DEDICATED VPS</span>
          <span className="text-[var(--holo)]">UPSTREAM P95: 3.36s</span>
        </div>
      </div>
    </div>
  );
};