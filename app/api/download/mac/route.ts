import { NextResponse } from "next/server";

/**
 * Single entry for macOS DMG downloads from the marketing site.
 *
 * Production: set `MAC_DOWNLOAD_URL` (or `NEXT_PUBLIC_MAC_DOWNLOAD_URL`) to a full **https** URL
 * (GitHub Release asset, S3, CDN). Vercel cannot read `DesktopBuild/` on your Mac; the DMG there is local only.
 *
 * Fallback when unset: redirect to `/downloads/Persuaid.dmg` — that file must exist under `public/downloads/`
 * in the deployed build (often omitted because large DMGs are gitignored). Prefer hosting the asset externally.
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
