import { NextRequest, NextResponse } from "next/server";

/** Origins allowed to call https://persuaid.app/api/* from another host (e.g. Electron static shell). */
const ALLOWED_ORIGINS = new Set([
  "https://persuaid.app",
  "https://www.persuaid.app",
  "http://127.0.0.1:2999",
  "http://localhost:2999",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  const origin = request.headers.get("origin");
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : null;

  if (request.method === "OPTIONS") {
    const h = new Headers();
    if (allow) {
      h.set("Access-Control-Allow-Origin", allow);
      h.set("Access-Control-Allow-Credentials", "true");
    }
    h.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    h.set("Access-Control-Max-Age", "86400");
    return new NextResponse(null, { status: 204, headers: h });
  }

  const res = NextResponse.next();
  if (allow) {
    res.headers.set("Access-Control-Allow-Origin", allow);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
