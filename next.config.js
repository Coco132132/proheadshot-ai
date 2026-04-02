/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Cloudflare Pages deployment
  // @ts-check
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
