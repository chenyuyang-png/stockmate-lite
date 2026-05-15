// 市場交易期 (session) 計算 — 用於 daily-wrap / tw-daily-wrap 的 cache key
//
// 為什麼需要：
//   過去用「12 小時固定 TTL」當 cache key 條件，但跨過收盤的時間點，
//   會出現「市場已經收盤、AI 摘要還是收盤前舊版」的尷尬狀況。
//
//   改用「交易期 ID」（YYYY-MM-DD 字串），跨過收盤緩衝時間就自動切到新一輪：
//   - 美股：每天 05:30 TPE 切到新 session
//   - 台股：每天 14:00 TPE 切到新 session
//
// 用法：
//   const session = usWrapSession();   // "2026-05-15"
//   const cacheKey = `us-wrap:${session}:${extraSymbols}`;

/** 取得當前 TPE 時區的 Date 物件（避免 server 在不同時區跑出怪結果）*/
function tpeNow(): Date {
  // sv-SE 直接吐 YYYY-MM-DD HH:mm:ss
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  // 組回 UTC 時間（因為 Date 在 server 上會把字串視為 UTC）
  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`,
  );
}

/** 從一個 Date 抽 YYYY-MM-DD（UTC，因為 tpeNow() 已經把 TPE 時間轉成 UTC 數字）*/
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * 美股 wrap-up 交易期 ID
 *
 * 行為：
 *   - 美股 16:00 ET = 04:00-05:00 TPE 收盤（夏/冬令時間差 1h）
 *   - 我們設 05:30 TPE 為切換點（給 1.5h 緩衝給 yahoo 更新數據）
 *   - TPE 時間 ≥ 05:30 → 用今天的 TPE 日期當 session
 *   - TPE 時間 < 05:30 → 用昨天的 TPE 日期當 session
 *
 * 範例：
 *   TPE 2026-05-15 03:00 → "2026-05-14"（仍在前一個交易期）
 *   TPE 2026-05-15 05:30 → "2026-05-15"（新一輪 session 開始）
 *   TPE 2026-05-15 12:00 → "2026-05-15"
 */
export function usWrapSession(): string {
  const tpe = tpeNow();
  const totalMinutes = tpe.getUTCHours() * 60 + tpe.getUTCMinutes();
  const cutoff = 5 * 60 + 30; // 05:30 = 330 分
  if (totalMinutes < cutoff) {
    // 倒退一天
    const yesterday = new Date(tpe.getTime() - 24 * 60 * 60_000);
    return ymd(yesterday);
  }
  return ymd(tpe);
}

/**
 * 台股 wrap-up 交易期 ID
 *
 * 行為：
 *   - 台股 13:30 TPE 收盤
 *   - 設 14:00 TPE 為切換點（給 30 分鐘讓 yahoo / FinMind 結算）
 *   - TPE 時間 ≥ 14:00 → 用今天的 TPE 日期當 session
 *   - TPE 時間 < 14:00 → 用昨天的 TPE 日期當 session
 */
export function twWrapSession(): string {
  const tpe = tpeNow();
  const totalMinutes = tpe.getUTCHours() * 60 + tpe.getUTCMinutes();
  const cutoff = 14 * 60; // 14:00 = 840 分
  if (totalMinutes < cutoff) {
    const yesterday = new Date(tpe.getTime() - 24 * 60 * 60_000);
    return ymd(yesterday);
  }
  return ymd(tpe);
}

/** 取得當前 TPE 日期（純展示用 — 例如「2026-05-15 收盤回顧」）*/
export function tpeToday(): string {
  return ymd(tpeNow());
}
