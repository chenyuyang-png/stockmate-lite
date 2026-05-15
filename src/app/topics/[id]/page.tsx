import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getSectorById } from "@/lib/sectors";
import { displayName } from "@/lib/symbols";
import { INFLUENCE_GROUPS } from "@/lib/influence";
import { TopicDeepDive } from "@/components/TopicDeepDive";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const sector = getSectorById(id);
  return {
    title: sector ? `${sector.label} · 楊yoyo的持股` : "題材 · 楊yoyo的持股",
  };
}

export default async function TopicDetailPage({ params }: Props) {
  const { id } = await params;
  const sector = getSectorById(id);
  if (!sector) notFound();

  // 找出上游美股 influence groups
  const upstreamGroups = INFLUENCE_GROUPS.filter((g) =>
    g.twSymbols.some((s) => sector.symbols.includes(s)),
  );

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-4">
      <Link
        href="/topics"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft size={14} /> 返回題材總覽
      </Link>

      <header className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="rounded bg-gray-200 px-1.5 py-0.5">
            {sector.market === "TW" ? "🇹🇼 台股" : "🇺🇸 美股"}
          </span>
          <span>共 {sector.symbols.length} 檔成員</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{sector.label}</h1>
        {sector.description && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
            {sector.description}
          </p>
        )}

        {/* 上游美股族群 */}
        {upstreamGroups.length > 0 && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="mb-1 text-[11px] text-gray-500">🔗 上游美股驅動族群</div>
            <div className="flex flex-wrap gap-1.5">
              {upstreamGroups.map((g) => (
                <span
                  key={g.id}
                  className="rounded-md bg-gray-200 px-2 py-1 text-xs text-gray-600"
                  title={g.rationale}
                >
                  {g.label}
                </span>
              ))}
            </div>
            {upstreamGroups[0] && (
              <p className="mt-1.5 text-[11px] italic text-gray-500">
                💡 {upstreamGroups[0].rationale}
              </p>
            )}
          </div>
        )}
      </header>

      {/* Tier + 成員清單 */}
      <TopicDeepDive sectorId={sector.id} />
    </main>
  );
}

// 避免 unused import warning
void displayName;
