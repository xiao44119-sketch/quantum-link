import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "骁清 FINN · 数字算力买手馆 | ChatGPT · Gemini · Grok 官方直连履约",
  description:
    "官方正版 AI 订阅与开发者认证中心：支持 ChatGPT Plus / Pro 10x / 20x / 50x、Gemini 学生认证、Grok、Codex 在线接码与 Telegram 大会员一步优雅开通。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
