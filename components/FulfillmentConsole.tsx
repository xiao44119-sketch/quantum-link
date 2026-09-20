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
  AlertCircle
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

  // 弹窗状态
  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [collisionError, setCollisionError] = useState<DuplicateConfirmError | null>(null);

  // 错误提示
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // 监听外部预设前缀注入
  useEffect(() => {
    if (presetPrefix) {
      setCardCode((prev) => {
        if (!prev) return presetPrefix + "DEMO-8888-9999";
        return presetPrefix + prev.replace(/^[A-Za-z0-9]+-?/, "");
      });
    }
  }, [presetPrefix]);

  // 实时检测卡密前缀
  useEffect(() => {
    if (!cardCode.trim()) {
      setMatchedProduct(null);
      return;
    }
    const detected = detectProductByCode(cardCode);
    setMatchedProduct(detected);
  }, [cardCode]);

  // 滚动终端日志
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activeTask?.log_trace]);

  // 轮询任务状态
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

      // 任务成功接收入列
      setCollisionError(null);
      onTaskChange?.(1);

      // 初始创建本地占位
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
    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
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

      <div className="lg:col-span-7 corner-bracket border border-[var(--line)] bg-[#070c14]/90 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[var(--holo)]" />
            <h2 className="font-mono text-sm sm:text-base font-bold text-white tracking-widest uppercase">
              FULFILLMENT DISPATCH TERMINAL (履约调度中枢)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[var(--fg-muted)]">
            SECURE LINK 256-BIT
          </span>
        </div>

        <div className="mb-6 p-3 border border-[var(--line)] bg-cyan-950/20 text-xs font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--warm)]" />
              快速沙盒演练桩 (ONE-CLICK SANDBOX):
            </span>
            <span className="text-[10px] text-[var(--holo)]">点击一键预填</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFillSandboxMock("normal")}
              className="px-2.5 py-1 border border-[var(--line)] hover:border-[var(--holo)] bg-black/40 text-cyan-200 hover:text-white transition-colors"
            >
              标准正常履约测试
            </button>
            <button
              type="button"
              onClick={() => handleFillSandboxMock("duplicate")}
              className="px-2.5 py-1 border border-amber-500/40 hover:border-amber-400 bg-amber-950/20 text-amber-300 hover:text-white transition-colors"
            >
              409 二次确认测试 (24h-30天)
            </button>
            <button
              type="button"
              onClick={() => handleFillSandboxMock("blocked")}
              className="px-2.5 py-1 border border-rose-500/40 hover:border-rose-400 bg-rose-950/20 text-rose-300 hover:text-white transition-colors"
            >
              409 强熔断拦截 (24h内)
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
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-xs text-gray-300 tracking-wider flex items-center gap-1.5">
                <span>01. 激活凭证 / 兑换卡密 (CARD CODE)</span>
                <span className="text-rose-400">*</span>
              </label>
              {matchedProduct && (
                <span className="text-[11px] font-mono text-[var(--holo)] px-2 py-0.5 border border-[var(--holo)]/40 bg-cyan-950/40 animate-pulse">
                  已匹配: {matchedProduct.name}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value)}
                placeholder="例如: PH-XXXX-XXXX-XXXX 或 PRO20SPECIAL-XXXX"
                className="w-full bg-black/60 border border-[var(--line)] px-4 py-3 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-[var(--holo)] focus:ring-1 focus:ring-[var(--holo)] transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-xs text-gray-300 tracking-wider flex items-center gap-1.5">
                <span>02. CHATGPT 会话凭证 (SESSION DATA JSON)</span>
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
              rows={7}
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              placeholder="请完整粘贴 https://chatgpt.com/api/auth/session 的 JSON 内容"
              className="w-full bg-black/60 border border-[var(--line)] p-4 text-xs font-mono text-cyan-200 placeholder-neutral-600 focus:outline-none focus:border-[var(--holo)] focus:ring-1 focus:ring-[var(--holo)] transition-all resize-y leading-relaxed"
              required
            />
          </div>

          {errorMessage && (
            <div className="p-3 border border-rose-500/50 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || polling}
              className="laser-sweeper w-full py-3.5 px-6 border border-[var(--holo)] bg-cyan-950/50 hover:bg-cyan-900/60 text-white font-mono text-sm tracking-widest font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,212,200,0.15)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--holo)]" />
                  <span>正在构建量子链路任务 (INITIALIZING)...</span>
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

      <div className="lg:col-span-5 corner-bracket corner-bracket-warm border border-[var(--line)] bg-[#070b12]/95 p-6 backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--warm)]" />
              <h3 className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                TELEMETRY RADAR (实时状态大盘)
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
                <RotateCcw className="w-3 h-3" /> 重置终端
              </button>
            )}
          </div>

          {!activeTask ? (
            <div className="h-72 border border-dashed border-[var(--line)]/60 flex flex-col items-center justify-center text-center p-6 text-neutral-500 font-mono text-xs">
              <ShieldCheck className="w-10 h-10 mb-3 text-cyan-900 stroke-1" />
              <p className="text-gray-400">调度中枢待命中</p>
              <p className="text-[10px] text-neutral-600 mt-1 max-w-[240px]">
                在左侧录入卡密与 Session，任务提交后将在此建立端到端状态追踪
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 border border-[var(--line)] bg-black/50 font-mono text-xs space-y-2">
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
                  <span className="text-[var(--warm)]">{activeTask.product_name}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-gray-300">状态: {activeTask.status}</span>
                  <span className="text-[var(--holo)] font-bold">{activeTask.progress}%</span>
                </div>
                <div className="w-full h-2 bg-black border border-[var(--line)] overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-[var(--holo)] transition-all duration-500 shadow-[0_0_12px_rgba(0,212,200,0.8)]"
                    style={{ width: activeTask.progress + "%" }}
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-neutral-400 block mb-1">
                  EXECUTION LOG STREAM (执行日志流):
                </span>
                <div
                  ref={logContainerRef}
                  className="h-44 border border-[var(--line)] bg-black/80 p-3 overflow-y-auto font-mono text-[11px] space-y-2 select-text"
                >
                  {activeTask.log_trace.map((log, idx) => (
                    <div key={idx} className="leading-snug">
                      <span className="text-neutral-600 mr-2">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span
                        className={
                          log.level === "SUCCESS"
                            ? "text-emerald-400 font-bold"
                            : log.level === "WARN"
                            ? "text-amber-400"
                            : "text-cyan-200"
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

              {activeTask.finished && (
                <div
                  className={"p-3 border font-mono text-xs flex items-center gap-3 " + (
                    activeTask.success
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                      : "border-rose-500/40 bg-rose-950/30 text-rose-300"
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
                    <span className="text-[10px] text-neutral-400 block">
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

        <div className="mt-6 pt-4 border-t border-[var(--line)]/60 text-[11px] font-mono text-neutral-500 flex items-center justify-between">
          <span>TOKEN DEDICATED VPS</span>
          <span className="text-[var(--holo)]">UPSTREAM P95: 3.36s</span>
        </div>
      </div>
    </div>
  );
};