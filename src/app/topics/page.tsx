import { TopicCatalog } from "@/components/TopicCatalog";
import { RankBoard } from "@/components/RankBoard";

// 不預渲染（RankBoard 抓即時報價）
export const dynamic = "force-dynamic";

export const metadata = {
  title: "題材脈動 · Stockmate",
  description:
    "台美股 16 大產業即時題材熱度、領漲領跌族群、跨題材強弱排行榜 — 免費瀏覽。",
};

// 題材分頁 — 完全開放未登入瀏覽
// 過去用 SignInGate 強制登入，但這會把第一印象用戶擋在外面（轉換率殺手）
// 改為開放後，使用者體驗到「我這頁看得到內容」，註冊 / 訂閱意願才會升起
export default function TopicsPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      <TopicCatalog />
      <RankBoard />
    </main>
  );
}
