// Lite 版 — Clerk auth shim
//
// stockmate-lite 完全免費、不需要登入。但程式碼是從 stockmate-pro 同步來的，
// 各檔案到處引用 @clerk/nextjs（TopNav、API routes、各種 useUser 判斷）。
//
// 為了不大改 source，用 next.config.ts 的 turbopack.resolveAlias 把所有
// `@clerk/nextjs` import 都重導到這個檔案。
//
// 所有 Clerk 功能都是 no-op 或回傳「未登入訪客」假資料。

import { Fragment, createElement } from "react";
import type { ReactNode } from "react";

// Lite 版視為「永遠未登入」— tier 永遠為 "free"
// 由於 AI / 付費功能在 sync 時已被刪除，"free" 不會踩到 paywall
const LITE_USER = null;

// ─── @clerk/nextjs（client）────────────────────────────────
export function useUser() {
  return {
    user: LITE_USER,
    isLoaded: true,
    isSignedIn: false,
  };
}

export function useClerk() {
  return {
    openSignIn: () => {},
    signOut: async () => {},
  };
}

// Lite 版沒有「已登入」狀態 → SignedIn 內容不渲染
export function SignedIn(_props: { children: ReactNode }) {
  return null;
}

// Lite 版永遠是「未登入」→ SignedOut 內容永遠渲染
export function SignedOut({ children }: { children: ReactNode }) {
  return createElement(Fragment, null, children);
}

export function SignInButton({ children }: { children?: ReactNode; mode?: string }) {
  // Lite 版沒登入功能，直接吐 children（通常是「登入」按鈕）但點了無作用
  // 為了不亂跳 UI，回傳 fragment 包 children；實際 onClick 無 handler
  return createElement(Fragment, null, children ?? null);
}

export function SignUpButton({ children }: { children?: ReactNode; mode?: string }) {
  return createElement(Fragment, null, children ?? null);
}

export function UserButton(_props: { afterSignOutUrl?: string; appearance?: unknown }) {
  return null;
}

export function ClerkProvider({ children }: { children: ReactNode; publishableKey?: string }) {
  return createElement(Fragment, null, children);
}

// ─── @clerk/nextjs/server ─────────────────────────────────
export async function auth() {
  // 未登入 → userId 為 null
  return { userId: null as string | null };
}

export async function currentUser() {
  return null;
}

export async function clerkClient() {
  return {
    users: {
      // 任何「拿 user」操作都回 null/空，呼叫端應該自己處理
      getUser: async (_id: string) => null,
      updateUserMetadata: async (_id: string, _data: unknown) => null,
    },
  };
}
