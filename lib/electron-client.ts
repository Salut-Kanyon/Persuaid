"use client";

import { useSyncExternalStore } from "react";

/**
 * Public marketing site (Stripe checkout, pricing). Desktop opens this in the browser.
 * Set NEXT_PUBLIC_MARKETING_ORIGIN in production (e.g. https://persuaid.app); falls back to NEXT_PUBLIC_APP_URL.
 */
export const MARKETING_SITE_ORIGIN =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_MARKETING_ORIGIN || process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, "")) ||
  "https://persuaid.app";

/** True in the Electron shell. Prefer `window.persuaid` (preload) so we can strip `Electron` from User-Agent for Google OAuth without breaking detection. */
export function isElectronApp(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof (window as unknown as { persuaid?: unknown }).persuaid !== "undefined") return true;
  return typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);
}

type PersuaidPreload = {
  openExternal?: (url: string) => Promise<{ ok?: boolean; error?: string } | void>;
  openOAuthWindow?: (url: string) => Promise<{ ok?: boolean; error?: string }>;
  /** macOS: System Settings → Privacy & Security → Microphone */
  openMicSettings?: () => Promise<{ ok?: boolean } | void>;
  platform?: string;
};

/**
 * Logo / home: Electron desktop should stay in-app (dashboard), not the marketing landing at `/`.
 */
export function useAppHomeHref(): string {
  return useSyncExternalStore(
    () => () => {},
    () => (isElectronApp() ? "/dashboard" : "/"),
    () => "/"
  );
}

/**
 * Pricing / upgrade: in Electron, open the live site in the system browser; in web, stay in Next.js.
 */
export async function openMarketingPricing(router: { push: (href: string) => void }): Promise<void> {
  if (!isElectronApp() || typeof window === "undefined") {
    router.push("/pricing");
    return;
  }
  const url = `${MARKETING_SITE_ORIGIN}/pricing`;
  await openMarketingUrl(url);
}

/** Open a marketing URL in default browser from Electron; in web fallback to same-tab navigation. */
export async function openMarketingUrl(url: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isElectronApp()) {
    window.location.href = url;
    return;
  }
  const api = (window as Window & { persuaid?: PersuaidPreload }).persuaid;
  if (api?.openExternal) {
    const r = await api.openExternal(url);
    if (r && typeof r === "object" && r.ok === true) return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/** macOS Electron only: opens System Settings → Microphone. No-op in web or non-mac. */
export async function openElectronMicrophonePrivacySettings(): Promise<void> {
  if (typeof window === "undefined" || !isElectronApp()) return;
  const api = (window as Window & { persuaid?: PersuaidPreload }).persuaid;
  if (api?.platform !== "darwin" || !api.openMicSettings) return;
  await api.openMicSettings();
}
