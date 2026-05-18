// NVIDIA 供應鏈深度頁
//
// 完整介紹 NVIDIA 的：
//   1. 產品路線圖（Hopper / Blackwell / Rubin / Feynman）
//   2. 9 大類零組件供應鏈分類
//   3. 每類別下的台股對應 + 即時報價

import { NvdaDeepDive } from "@/components/NvdaDeepDive";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "NVIDIA 供應鏈深度頁 · Stockmate",
  description:
    "NVIDIA 完整產品線（H100/B200/GB200/Rubin）+ 9 大類零組件 + 台股受惠族群整理 — 公開資料整理工具、不構成投資建議。",
};

export default function NvdaCompanyPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <NvdaDeepDive />
    </main>
  );
}
