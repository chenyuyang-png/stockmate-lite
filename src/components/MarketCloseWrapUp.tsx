"use client";

// 收盤速報外殼 — 用 tab 切換台股 / 美股
// 預設台股（TA 為台灣投資人）

import { useState } from "react";
import { TwDailyWrapUp } from "./TwDailyWrapUp";
import { DailyWrapUp } from "./DailyWrapUp";

type Tab = "tw" | "us";

export function MarketCloseWrapUp() {
  const [tab, setTab] = useState<Tab>("tw");

  return (
    <div>
      {/* Tab switcher */}
      <div className="mb-2 flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
        <TabButton
          active={tab === "tw"}
          onClick={() => setTab("tw")}
          emoji="🇹🇼"
          label="台股收盤速報"
          tone="red"
        />
        <TabButton
          active={tab === "us"}
          onClick={() => setTab("us")}
          emoji="🇺🇸"
          label="美股收盤速報"
          tone="blue"
        />
      </div>

      {/* Content */}
      {tab === "tw" ? <TwDailyWrapUp /> : <DailyWrapUp />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  emoji,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  tone: "red" | "blue";
}) {
  const activeCls =
    tone === "red"
      ? "bg-red-600 text-white shadow-sm"
      : "bg-blue-600 text-white shadow-sm";
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
        active ? activeCls : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <span className="mr-1">{emoji}</span>
      {label}
    </button>
  );
}
