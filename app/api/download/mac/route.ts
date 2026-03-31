import { NextResponse } from "next/server";

/**
 * Single entry for macOS DMG downloads from the marketing site.
 * Set `MAC_DOWNLOAD_URL` (or `NEXT_PUBLIC_MAC_DOWNLOAD_URL`) to a full https URL
 * (e.g. GitHub Release asset, S3, CDN). If unset, redirects to the static file
 * at `/downloads/Persuaid.dmg` (from `public/downloads/` after `npm run desktop:build`).
 */
function resolveRedirect(request: Request) {
  const explicit =
    process.env.MAC_DOWNLOAD_URL?.trim() ||
    process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL?.trim();
  if (explicit && /^https?:\/\//i.test(explicit)) {
    return NextResponse.redirect(explicit, 302);
  }
  return NextResponse.redirect(new URL("/downloads/Persuaid.dmg", request.url), 302);
}

export async function GET(request: Request) {
  return resolveRedirect(request);
}

export async function HEAD(request: Request) {
  return resolveRedirect(request);
}
