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
      accessToken:
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.sandbox_token_example_eyJleHAiOjE3ODk5MDAwMDB9.signature_hash_preview",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <div className="ql-pop relative w-full max-w-2xl rounded-3xl border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-6 sm:p-7 text-[var(--ink)] shadow-2xl backdrop-blur-2xl">
        {/* 标题 */}
        <div className="flex items-center justify-between border-b border-[var(--rule)] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-center text-[var(--clay)]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-editorial text-lg font-semibold text-[var(--ink)]">
                三步获取 ChatGPT Session 授权凭证
              </h3>
              <span className="text-xs text-[var(--ink-3)]">
                零密码安全协议 · 仅用于本次官方订阅下发校验
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] border border-[var(--rule)] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 步骤指南 */}
        <div className="space-y-4 text-xs text-[var(--ink-2)] leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl border border-[var(--rule)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--clay)] font-semibold block mb-1">01 · 登录网页版</span>
              <span>在电脑或手机浏览器打开并登录需要充值的 chatgpt.com 账号。</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-[var(--rule)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--clay)] font-semibold block mb-1">02 · 打开凭证页</span>
              <span>
                保持登录，点击访问{" "}
                <a
                  href="https://chatgpt.com/api/auth/session"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--clay)] font-medium underline inline-flex items-center gap-0.5"
                >
                  /api/auth/session <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </div>
            <div className="p-3.5 rounded-2xl border border-[var(--rule)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--clay)] font-semibold block mb-1">03 · 全选粘贴</span>
              <span>把页面里的全部代码（Ctrl+A / 全选）复制，粘贴回开通台输入框即可。</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 mt-1">
              <span className="text-[var(--ink-3)]">标准 JSON 格式参考：</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[var(--clay)] hover:underline text-[11.5px] font-medium cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "已复制" : "复制示例格式"}
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl border border-[var(--rule)] bg-[var(--bg-field)] text-[11px] text-[var(--ink-2)] overflow-x-auto max-h-44 font-mono">
              {sampleSession}
            </pre>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-6 flex items-center justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => {
              onApplySample(sampleSession);
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-[var(--rule-strong)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--ink)] font-medium transition-colors cursor-pointer"
          >
            填入示例体验体检流程
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold transition-opacity hover:opacity-95 cursor-pointer"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
