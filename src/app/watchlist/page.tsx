import { Watchlist } from "@/components/Watchlist";
import { NewsFeed } from "@/components/NewsFeed";

export const metadata = {
  title: "自選股 + 新聞 · 楊yoyo的持股",
};

// 自選股 + 新聞分頁
export default function WatchlistPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-4">
      <Watchlist />
      <NewsFeed />
    </main>
  );
}
