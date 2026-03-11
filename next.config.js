/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export only when explicitly requested (e.g. Electron). Vercel needs a server build for /api/* routes.
  ...(process.env.OUTPUT_STATIC === '1' && { output: 'export' }),
}

module.exports = nextConfig
