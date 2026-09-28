import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "短篇爽文编辑器",
  description: "给自己用的短篇爽文写作工具",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        {children}
      </body>
    </html>
  );
}
