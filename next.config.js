/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export only when explicitly requested (e.g. Electron). Vercel needs a server build for /api/* routes.
  ...(process.env.OUTPUT_STATIC === '1' && { output: 'export' }),

  /**
   * Production CSP: strict hosts often block webpack/runtime patterns that rely on eval,
   * which breaks hydration or client chunks — live transcript then fails with no obvious mic error.
   * Next.js + many client bundles expect script-src to allow 'unsafe-eval' and 'unsafe-inline'.
   * STT needs connect-src for wss:// (Deepgram, relay) and https:// (API routes, Supabase).
   * Tighten connect-src to your exact origins when possible.
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      [
        "script-src",
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        "https://vercel.live",
        "https://va.vercel-scripts.com",
      ].join(" "),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // APIs, Supabase, Stripe, OpenAI (server routes), WebSocket STT — broad by scheme; narrow in production if you can
      "connect-src 'self' https: wss: ws:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
