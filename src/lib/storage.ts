"use client";

import { useEffect, useState } from "react";
import type { WatchlistItem, Holding, Transaction, DailySnapshot } from "./types";
import { SEED_HOLDINGS, SEED_WATCHLIST } from "./seedData";

// 用 localStorage 簡單存資料（個人本機/單一裝置足夠）
// 未來要跨裝置同步可以改成 Turso / Vercel KV

const WATCHLIST_KEY = "yoyo-stocks:watchlist:v1";
const HOLDINGS_KEY = "yoyo-stocks:holdings:v1";
const TRANSACTIONS_KEY = "yoyo-stocks:transactions:v1";
const SNAPSHOTS_KEY = "yoyo-stocks:snapshots:v1";
const SEEDED_KEY = "yoyo-stocks:seeded:v1";

export const STORAGE_KEYS = {
  WATCHLIST_KEY,
  HOLDINGS_KEY,
  TRANSACTIONS_KEY,
  SNAPSHOTS_KEY,
  SEEDED_KEY,
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// 第一次造訪時自動匯入預設資料；之後永遠不再觸發
function seedIfFirstVisit() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEEDED_KEY)) return;

  const now = Date.now();
  const holdings: Holding[] = SEED_HOLDINGS.map((h) => ({
    ...h,
    id: crypto.randomUUID(),
    addedAt: now,
  }));
  const watchlist: WatchlistItem[] = SEED_WATCHLIST.map((w) => ({
    ...w,
    addedAt: now,
  }));

  writeJson(HOLDINGS_KEY, holdings);
  writeJson(WATCHLIST_KEY, watchlist);
  window.localStorage.setItem(SEEDED_KEY, "1");
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    seedIfFirstVisit();
    setItems(readJson<WatchlistItem[]>(WATCHLIST_KEY, []));
    setHydrated(true);
  }, []);

  function persist(next: WatchlistItem[]) {
    setItems(next);
    writeJson(WATCHLIST_KEY, next);
  }

  function add(symbol: string, group?: string) {
    if (items.find((i) => i.symbol === symbol)) return;
    persist([...items, { symbol, group, addedAt: Date.now() }]);
  }

  function remove(symbol: string) {
    persist(items.filter((i) => i.symbol !== symbol));
  }

  function updateGroup(symbol: string, group: string) {
    persist(items.map((i) => (i.symbol === symbol ? { ...i, group } : i)));
  }

  return { items, hydrated, add, remove, updateGroup };
}

export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    seedIfFirstVisit();
    setHoldings(readJson<Holding[]>(HOLDINGS_KEY, []));
    setHydrated(true);
  }, []);

  function persist(next: Holding[]) {
    setHoldings(next);
    writeJson(HOLDINGS_KEY, next);
  }

  function add(holding: Omit<Holding, "id" | "addedAt">) {
    const newHolding: Holding = {
      ...holding,
      id: crypto.randomUUID(),
      addedAt: Date.now(),
    };
    persist([...holdings, newHolding]);
  }

  function remove(id: string) {
    persist(holdings.filter((h) => h.id !== id));
  }

  function update(id: string, patch: Partial<Holding>) {
    persist(holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  return { holdings, hydrated, add, remove, update };
}

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSnapshots(readJson<DailySnapshot[]>(SNAPSHOTS_KEY, []));
    setHydrated(true);
  }, []);

  function persist(next: DailySnapshot[]) {
    // 依日期升冪排序，最多保留 365 筆
    const sorted = [...next]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-365);
    setSnapshots(sorted);
    writeJson(SNAPSHOTS_KEY, sorted);
  }

  // 同一天只保留最新一筆
  function upsert(snap: DailySnapshot) {
    const without = snapshots.filter((s) => s.date !== snap.date);
    persist([...without, snap]);
  }

  function remove(date: string) {
    persist(snapshots.filter((s) => s.date !== date));
  }

  function hasToday(date: string): boolean {
    return snapshots.some((s) => s.date === date);
  }

  return { snapshots, hydrated, upsert, remove, hasToday };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTransactions(readJson<Transaction[]>(TRANSACTIONS_KEY, []));
    setHydrated(true);
  }, []);

  function persist(next: Transaction[]) {
    // 依日期排序（新到舊）
    const sorted = [...next].sort((a, b) => b.date.localeCompare(a.date));
    setTransactions(sorted);
    writeJson(TRANSACTIONS_KEY, sorted);
  }

  function add(tx: Omit<Transaction, "id" | "createdAt">) {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    persist([...transactions, newTx]);
  }

  function remove(id: string) {
    persist(transactions.filter((t) => t.id !== id));
  }

  function update(id: string, patch: Partial<Transaction>) {
    persist(transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  return { transactions, hydrated, add, remove, update };
}
