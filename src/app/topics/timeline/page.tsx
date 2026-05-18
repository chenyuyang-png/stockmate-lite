import { ThemeRotation } from "@/components/ThemeRotation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "2024-2026 台股漲價邏輯題材輪動 · Stockmate",
  description:
    "從 AI 伺服器到功率半導體 — 完整盤點 2024-2026 台股題材輪動史 + 預期下一波漲勢。公開資料整理工具、不構成投資建議。",
};

export default function ThemeTimelinePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <ThemeRotation />
    </main>
  );
}
