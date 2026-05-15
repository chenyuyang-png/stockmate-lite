import type { NextConfig } from "next";

// Lite 版 — 不用 Clerk 認證、不用 Anthropic SDK
// 把所有 @clerk/nextjs import 重導到 lite-auth shim（回傳「未登入 / free 用戶」）
// 把 @anthropic-ai/sdk 重導到 stub（fall through，讓 daily-wrap 等用 rule-based fallback）
const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "@clerk/nextjs": "./src/lib/lite-auth.ts",
      "@clerk/nextjs/server": "./src/lib/lite-auth.ts",
    },
  },
};

export default nextConfig;
