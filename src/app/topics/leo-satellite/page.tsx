import { LeoSatelliteDeepDive } from "@/components/LeoSatelliteDeepDive";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "低軌衛星 LEO 完整供應鏈 · Stockmate",
  description:
    "Starlink / Kuiper / OneWeb / 中國國網 + 台灣 B5G 完整低軌衛星供應鏈與台股受惠族群整理 — 公開資料整理工具、不構成投資建議。",
};

export default function LeoSatellitePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <LeoSatelliteDeepDive />
    </main>
  );
}
