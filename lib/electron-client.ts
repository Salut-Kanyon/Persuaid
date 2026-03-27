"use client";

import { useSyncExternalStore } from "react";

/** Public marketing site (Stripe checkout, pricing page). */
export const MARKETING_SITE_ORIGIN = "https://persuaid.app";

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
  const api = (window as Window & { persuaid?: PersuaidPreload }).persuaid;
  if (api?.openExternal) {
    const r = await api.openExternal(url);
    if (r && typeof r === "object" && r.ok === true) return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
