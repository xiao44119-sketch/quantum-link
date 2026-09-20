import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantumLink · AI 订阅自动化履约控制中枢",
  description: "面向高强度开发者的 ChatGPT Plus / Pro 自动化极速履约系统，高可用异步任务调度与 409 防重保护机制。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark bg-[#05070a]">
      <body className="min-h-screen bg-[#05070a] antialiased text-[#eaf8f7]">
        {children}
      </body>
    </html>
  );
}