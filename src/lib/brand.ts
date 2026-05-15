// 品牌設定 — 公開版可隨意改名 / 改色
// 從環境變數讀，方便部署多個品牌

export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Stockmate",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT ?? "Stockmate",
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE ??
    "台美股投資儀表板 — 持股追蹤、產業熱度、AI 深度解讀",
  description:
    process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ??
    "Stockmate 是專為台灣投資人設計的台美股一站式投資儀表板。",
  domain: process.env.NEXT_PUBLIC_DOMAIN ?? "stockmate.app",
  /** 訂閱方案連結 */
  pricingUrl: "/pricing",
  /** 支援聯絡 email */
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@stockmate.app",
};
