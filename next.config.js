/** @type {import('next').NextConfig} */
const nextConfig = {
  // New way to ignore linting during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}
module.exports = nextConfig