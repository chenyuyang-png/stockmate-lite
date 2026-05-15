import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { LiteBanner } from "@/components/LiteBanner";
import { BRAND } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${BRAND.name} Lite`,
  description: "完全免費、不登入、純資料整理 — 想要 AI 解讀請去 Pro 版。",
  manifest: "/manifest.webmanifest",
  applicationName: BRAND.shortName,
  appleWebApp: {
    capable: true,
    title: BRAND.shortName,
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="zh-Hant"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-gray-50 text-gray-800">
          <LiteBanner />
          <TopNav />
          {children}
          <footer className="mx-auto mt-8 max-w-7xl border-t border-gray-200 px-4 py-6 text-[11px] text-gray-500">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="font-semibold text-gray-700">{`${BRAND.name} Lite`}</p>
                <p className="mt-1 text-gray-500">
                  台美股投資資料整理工具
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">產品</p>
                <ul className="mt-1 space-y-0.5">
                  <li><Link href="/pricing" className="hover:text-red-600">訂閱方案</Link></li>
                  <li><Link href="/ai" className="hover:text-red-600">AI 個股報告</Link></li>
                  <li><Link href="/topics" className="hover:text-red-600">題材脈動</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700">法律</p>
                <ul className="mt-1 space-y-0.5">
                  <li><Link href="/terms" className="hover:text-red-600">服務條款</Link></li>
                  <li><Link href="/privacy" className="hover:text-red-600">隱私權政策</Link></li>
                  <li><Link href="/pricing#disclaimer" className="hover:text-red-600">免責聲明</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700">支援</p>
                <ul className="mt-1 space-y-0.5">
                  <li><Link href="/about" className="hover:text-red-600">關於我們</Link></li>
                  <li>
                    <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-red-600">
                      {BRAND.supportEmail}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <p className="mt-5 border-t border-gray-100 pt-3 text-center text-[10px] leading-relaxed text-gray-400">
              ⚠️ 本服務為資料整理工具、<strong>不構成投資建議</strong>。報價為 15 分鐘延遲。
              投資有風險，使用者應自行查證並承擔決策後果。
              <br />© {new Date().getFullYear()} {`${BRAND.name} Lite`}. All rights reserved.
            </p>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
