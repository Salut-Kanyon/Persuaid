/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use static export for production builds, not dev mode
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
}

module.exports = nextConfig
