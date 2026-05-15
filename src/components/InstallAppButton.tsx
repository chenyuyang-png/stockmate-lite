"use client";

// 「加到主畫面」教學按鈕 — 放在 TopNav 登入旁邊
// 點開 → modal 教學 iOS Safari / Android Chrome 兩種步驟

import { useState, useEffect } from "react";
import { Smartphone, X, Share, MoreVertical, Home, CheckCircle2 } from "lucide-react";
import { BRAND } from "@/lib/brand";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent.toLowerCase();
  // iOS Safari (iPhone / iPad / iPod)
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  // iPadOS 13+ 偽裝為 Mac，加 touch 判斷
  if (/macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  // Android
  if (/android/.test(ua)) return "android";
  return "desktop";
}

// 偵測是否已經在 PWA 模式（已安裝）
function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  // iOS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window.navigator as any).standalone === true) return true;
  // Android Chrome
  return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
}

export function InstallAppButton() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isInstalled());
  }, []);

  // 已經是 PWA 就不顯示
  if (installed) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 sm:flex"
        title="加到手機主畫面，當作 App 用"
      >
        <Smartphone size={12} />
        <span>裝 App</span>
      </button>

      {/* 手機版小按鈕（只有 icon）*/}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 sm:hidden"
        title="加到主畫面"
      >
        <Smartphone size={14} />
      </button>

      {open && (
        <InstallModal platform={platform} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function InstallModal({
  platform,
  onClose,
}: {
  platform: Platform;
  onClose: () => void;
}) {
  // 鎖住背景滾動
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-[95vw] max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-500 hover:bg-gray-100"
          aria-label="關閉"
        >
          <X size={18} />
        </button>

        <div className="px-5 py-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                把 {BRAND.name} 加到主畫面
              </h2>
              <p className="text-[11px] text-gray-500">
                30 秒裝完，從主畫面點開就像 App
              </p>
            </div>
          </div>

          <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 p-2.5 text-xs text-blue-900">
            <p className="font-semibold">✨ 為什麼裝？</p>
            <ul className="ml-4 mt-1 list-disc space-y-0.5 leading-snug">
              <li>從主畫面 1 秒打開，比瀏覽器快</li>
              <li>全螢幕無網址列，看圖表更舒服</li>
              <li>不佔空間 — 不是真的 App，只是書籤美化版</li>
            </ul>
          </div>

          {/* Platform tabs */}
          <PlatformTabs initial={platform} />
        </div>
      </div>
    </div>
  );
}

function PlatformTabs({ initial }: { initial: Platform }) {
  const [tab, setTab] = useState<Platform>(initial === "desktop" ? "ios" : initial);

  return (
    <>
      <div className="mb-3 flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
        <TabBtn
          active={tab === "ios"}
          onClick={() => setTab("ios")}
          label="📱 iPhone / iPad"
        />
        <TabBtn
          active={tab === "android"}
          onClick={() => setTab("android")}
          label="🤖 Android"
        />
      </div>

      {tab === "ios" ? <IosSteps /> : <AndroidSteps />}
    </>
  );
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}

function IosSteps() {
  return (
    <ol className="space-y-3 text-sm text-gray-800">
      <Step
        n={1}
        title="開 Safari 瀏覽器"
        body="必須用 Safari（不能是 Chrome / Firefox）— 用其他瀏覽器看不到「加到主畫面」選項。"
      />
      <Step
        n={2}
        title="點下方的「分享」按鈕"
        icon={<Share size={16} className="text-blue-600" />}
        body="畫面最下方中間，一個正方形 + 向上箭頭的 icon。"
      />
      <Step
        n={3}
        title="向下滑、找「加入主畫面」"
        icon={<Home size={16} className="text-blue-600" />}
        body="選單裡有一排灰底選項，找到「加入主畫面」（Add to Home Screen）。"
      />
      <Step
        n={4}
        title="按右上「加入」"
        icon={<CheckCircle2 size={16} className="text-green-600" />}
        body="可以改 icon 下方的名稱，按「加入」後主畫面就會有 icon 了。"
      />
    </ol>
  );
}

function AndroidSteps() {
  return (
    <ol className="space-y-3 text-sm text-gray-800">
      <Step
        n={1}
        title="開 Chrome 瀏覽器"
        body="或 Edge / Samsung Internet 也行，三大瀏覽器都支援。"
      />
      <Step
        n={2}
        title="點右上「⋮」三個點選單"
        icon={<MoreVertical size={16} className="text-blue-600" />}
        body="網址列右邊那個直排三個點。"
      />
      <Step
        n={3}
        title="找「加入主畫面」"
        icon={<Home size={16} className="text-blue-600" />}
        body="選單裡有「加入主畫面」（Add to Home Screen）。"
      />
      <Step
        n={4}
        title="按「加入」"
        icon={<CheckCircle2 size={16} className="text-green-600" />}
        body="會跳一個小彈窗確認 — 按「加入」或拖到主畫面任意位置。"
      />
    </ol>
  );
}

function Step({
  n,
  title,
  body,
  icon,
}: {
  n: number;
  title: string;
  body: string;
  icon?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
        {n}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {icon}
        </div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">
          {body}
        </p>
      </div>
    </li>
  );
}
