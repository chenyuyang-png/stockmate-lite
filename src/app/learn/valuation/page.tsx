import { ValuationLearn } from "@/components/ValuationLearn";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "法人怎麼看財報 + 預估 EPS · Stockmate",
  description:
    "從營收、毛利率推到 EPS、再到目標價 — 一套機構投資人實戰流程。含 欣興 / 國巨 真實案例、Forward EPS + PEG + 反推法完整教學。",
};

export default function ValuationLearnPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <ValuationLearn />
    </main>
  );
}
