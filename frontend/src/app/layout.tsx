import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "CSDP AgentWork | 中新数据港数字平台",
  description: "CSDP AgentWork — 中新数据港旗下 AI 数字员工即服务平台，依托 CSDP-WAN 合规跨境专线，让创业者雇佣 AI 团队完成跨境数据服务任务",
  keywords: "CSDP, AgentWork, 中新数据港, AI数字员工, 硅基员工, 跨境数据, OPC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
