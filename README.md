# Stockmate Lite

**Stockmate 的免費閹割版** — 純資料整理，無 AI、無付費、無登入。
要 AI 解讀請去 [Pro 版](https://stockmate-ai-ashen.vercel.app)。

---

## 它有什麼

| 區塊 | Lite 版 | Pro 版 |
|---|---|---|
| 🇹🇼 台股大盤 / 加權 / 櫃買 | ✅ | ✅ |
| 🇺🇸 美股大盤 / 指數 | ✅ | ✅ |
| 收盤速報（指數 / 法人 / 強弱族群 / 新聞） | ✅ | ✅ |
| **AI 整理 10 大事件** | ❌ | ✅ |
| 16 大產業題材 / 100+ 子題材 | ✅ | ✅ |
| 個股頁（K 線 / 財報三表 / 法人 / 籌碼） | ✅ | ✅ |
| **AI 個股 IB 級報告** | ❌ | ✅ |
| **AI 題材深度解讀** | ❌ | ✅ |
| **AI 持股健檢** | ❌ | ✅ |
| **AI K 線多空判讀** | ❌ | ✅ |
| **AI 持股再平衡** | ❌ | ✅ |
| 自選股 / 持股 / 警示（localStorage） | ✅ | ✅ |
| 雲端同步 | ❌ | ✅ |
| 美股夜盤 → 明日台股對應 | ✅ | ✅ |
| 預期影響 chips（具體 TW 標的） | ✅ 直接看 | ✅ 直接看 |
| 產業板塊圖 / treemap | ✅ | ✅ |
| 經濟事件曆 / VIX / F&G | ✅ | ✅ |
| 5 大區塊財務深度分析（3 年） | ✅ | ✅ |
| 融資維持率 / 加碼試算 | ✅ | ✅ |

**收費差別**：Lite 永遠免費。Pro NT$ 499 / 月（年票 4,490 省 25%）。

---

## 架構

Lite 版是從 Pro 版 fork 出來的「閹割版」，**透過 sync script 同步**：

```
stockmate-pro/           ← 主程式碼 + AI + 認證 + 付費
   └── (main repo)

stockmate-lite/          ← 本 repo
   ├── scripts/sync-from-pro.sh   ← 同步腳本
   ├── src/lib/lite-auth.ts        ← Clerk shim（無認證）
   └── src/components/PaywallBlur.tsx ← 透明 wrapper
```

每次 Pro 版更新後，跑一次 `npm run sync` 就會自動：
1. `rsync` 過來 src/，排除所有 AI / 認證 / 金流檔案
2. 用 node 改 layout、TopNav、page.tsx、stock 頁、portfolio 頁
3. 換 `/ai` 頁為「升級提示頁」
4. 加 LiteBanner 在頂部
5. PaywallBlur 在 Lite 是透明 wrapper，所有原本 paywall 包住的內容都顯示

---

## 部署步驟

### 1. 建立 GitHub repo

```bash
cd stockmate-lite
git init
git add -A
git commit -m "初始版本 Stockmate Lite — 從 stockmate-pro b4c8eaf 同步"

# 上 GitHub 建一個新 repo (e.g., `stockmate-lite` or `yoyo-stocks-lite`)
git remote add origin https://github.com/YOUR_USERNAME/stockmate-lite.git
git branch -M main
git push -u origin main
```

### 2. Vercel 部署

1. 到 [Vercel dashboard](https://vercel.com/new) 點 "Import Project"
2. 選 GitHub repo `stockmate-lite`
3. **Framework Preset**：Next.js（自動偵測）
4. **Environment Variables**（必填 / 可選）：

| 變數 | 值 | 必填？ |
|---|---|---|
| `NEXT_PUBLIC_BRAND_NAME` | `Stockmate Lite` | 可選 |
| `NEXT_PUBLIC_PRO_URL` | `https://stockmate-ai-ashen.vercel.app` | **建議**（給 LiteBanner 連到 Pro）|

⚠️ **不要設**：
- ❌ `ANTHROPIC_API_KEY`（Lite 不呼叫 Claude，設了浪費）
- ❌ `CLERK_*`（Clerk 已被 shim）
- ❌ `ECPAY_*`（沒有金流）

5. Deploy。完成後會拿到一個 `https://YOUR-PROJECT.vercel.app` 網址。

### 3. 加 custom domain（可選）

如果有自己的 domain 想對應 Lite 版，去 Vercel → Settings → Domains 加。
建議 naming：`lite.stockmate.app` 或 `free.stockmate.app`。

---

## 開發

```bash
# 第一次（或主版更新後）
npm run sync         # 從 stockmate-pro 同步並閹割
npm install          # 安裝 deps（首次或 package.json 變動）

# 開發
npm run dev          # http://localhost:3000

# 確認 build 沒問題
npx tsc --noEmit
npm run build
```

---

## 為什麼這樣設計（不是兩個獨立 repo）

**Pro 版的功能演進飛快**（每週都改）。如果 Lite 版獨立維護：
1. 每次 Pro 加功能要重寫一遍適配
2. UI / API 一致性會慢慢 drift
3. 容易忘記同步 bugfix

用 sync script 的好處：
- ✅ Pro 改完，Lite 跑一次 sync 就同步
- ✅ AI 相關檔案永遠不會混進 Lite（rsync exclude）
- ✅ PaywallBlur 在 Lite 是透明 wrapper → Pro 原本鎖住的內容自動解鎖
- ✅ 兩個版本程式碼上 95% 一致，bug 修一次兩邊都好

---

## 升級導流策略

Lite 版上有 3 個地方把使用者導向 Pro 版：

1. **頂部 LiteBanner**：紫色一條，「想要 AI 解讀？去 Pro 版 →」（每個 session 可關閉一次）
2. **TopNav 右上**：永久顯示「✨ Pro 版」連結
3. **`/ai` 頁**：完整升級提示頁，展示 Pro 版 6 大 AI 功能 + CTA

預期轉換漏斗：
```
Lite 用戶 100 人
  ↓ 看 LiteBanner / TopNav
進 Pro 版瀏覽 10 人
  ↓ 試免費 4 種 AI
轉訂閱 1-2 人
```

---

## 法律

Lite 版繼承了 Pro 版的所有法律文件（同步過來）：
- [服務條款 /terms](https://YOUR-LITE-DOMAIN/terms)
- [隱私權政策 /privacy](https://YOUR-LITE-DOMAIN/privacy)（依台灣個資法 §8）
- [關於 /about](https://YOUR-LITE-DOMAIN/about)
- 免責聲明（每頁 footer）

Lite 跟 Pro 一樣是「資料整理工具」，**不構成投資建議**。
