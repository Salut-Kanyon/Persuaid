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

export function isElectronApp(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Electron/i.test(navigator.userAgent);
}

type PersuaidPreload = {
  openExternal?: (url: string) => Promise<{ ok?: boolean; error?: string } | void>;
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
