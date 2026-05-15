"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Briefcase,
  Flame,
  Star,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { BackupDialog } from "./BackupDialog";
import { InstallAppButton } from "./InstallAppButton";
import { BRAND } from "@/lib/brand";

const TABS = [
  { href: "/", label: "首頁", icon: Home, exact: true },
  { href: "/portfolio", label: "持股", icon: Briefcase },
  { href: "/topics", label: "題材", icon: Flame },
  { href: "/watchlist", label: "自選", icon: Star },
  { href: "/ai", label: "AI", icon: Sparkles },
];

export function TopNav() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
      {/* 法律合規 — 永久顯示的「資料整理工具」標籤條 */}
      <div className="border-b border-amber-200 bg-amber-50/80 px-4 py-1 text-center text-[10px] leading-snug text-amber-900">
        🛠️ 本服務為<strong>資料整理工具</strong>，<strong>非投資顧問服務</strong>。所有 AI 輸出僅供研究參考、不構成投資建議。
        <Link href="/pricing#disclaimer" className="ml-1 underline hover:text-amber-700">
          完整聲明
        </Link>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-base font-semibold text-gray-900 sm:text-lg">
            {BRAND.name}
          </span>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-0.5 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.exact
              ? path === tab.href
              : path.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs sm:text-sm transition ${
                  active
                    ? "bg-gray-200 text-red-600"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <InstallAppButton />
          <BackupDialog />
          <a
            href={process.env.NEXT_PUBLIC_PRO_URL ?? 'https://stockmate-ai-ashen.vercel.app'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-violet-400 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100"
            title="想看 AI 解讀？去 Pro 版"
          >
            ✨ Pro 版
          </a>
        </div>
      </div>
    </header>
  );
}
