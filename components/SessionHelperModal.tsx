"use client";

import React from "react";
import { X, ExternalLink, KeyRound, Copy, Check } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplySample: (sampleJson: string) => void;
}

export const SessionHelperModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplySample,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const sampleSession = JSON.stringify(
    {
      user: {
        id: "user-alpha_99410",
        name: "Developer Alice",
        email: "alice.dev@openai-sandbox.io",
        image: "https://avatar.vercel.sh/alice",
        picture: "https://avatar.vercel.sh/alice",
        mfa: false,
      },
      expires: "2026-10-15T00:00:00.000Z",
      accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.sandbox_token_example_eyJleHAiOjE3ODk5MDAwMDB9.signature_hash_preview",
      authProvider: "auth0",
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleSession);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl border border-[var(--line-strong)] bg-[#090e15] p-6 text-white corner-bracket shadow-2xl">
        {/* 标题 */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[var(--holo)]" />
            <h3 className="font-mono text-base font-bold tracking-wider text-white">
              SESSION 凭证获取协议指南 (PROTOCOL DOC)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--fg-muted)] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 步骤指南 */}
        <div className="space-y-4 text-xs font-mono text-[var(--fg-muted)] leading-relaxed">
          <p className="text-gray-300">
            为了自动化下发官方 Plus 或 Pro 订阅，系统需要获取目标账号当前生效的授权会话凭证。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 border border-[var(--line)] bg-black/40">
              <span className="text-[var(--holo)] font-bold block mb-1">01. 网页登录</span>
              <span>在浏览器中打开并登录您的目标账号 chatgpt.com</span>
            </div>
            <div className="p-3 border border-[var(--line)] bg-black/40">
              <span className="text-[var(--holo)] font-bold block mb-1">02. 访问会话接口</span>
              <span>
                在同一浏览器新建标签页访问:{" "}
                <a
                  href="https://chatgpt.com/api/auth/session"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--warm)] underline inline-flex items-center gap-0.5"
                >
                  /api/auth/session <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </div>
            <div className="p-3 border border-[var(--line)] bg-black/40">
              <span className="text-[var(--holo)] font-bold block mb-1">03. 全选复制</span>
              <span>将页面显示的完整 JSON 文本全量复制并粘贴到兑换框中</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 mt-2">
              <span className="text-gray-400">标准 Session 示例 (点击可一键载入测试):</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[var(--holo)] hover:underline text-[11px]"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "已复制" : "复制示例 JSON"}
              </button>
            </div>
            <pre className="p-3 border border-[var(--line)] bg-black/60 text-[11px] text-cyan-200 overflow-x-auto max-h-48 font-mono">
              {sampleSession}
            </pre>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-6 flex justify-end gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              onApplySample(sampleSession);
              onClose();
            }}
            className="px-4 py-2 border border-[var(--holo)] text-[var(--holo)] bg-cyan-950/40 hover:bg-cyan-900/60 transition-colors"
          >
            载入此示例进行沙盒演练 (LOAD MOCK)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[var(--line)] text-gray-400 hover:text-white"
          >
            关闭 (CLOSE)
          </button>
        </div>
      </div>
    </div>
  );
};