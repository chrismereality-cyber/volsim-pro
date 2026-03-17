/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'development' 
      ? 'http://127.0.0.1:5000' 
      : 'https://volsim-api-main.onrender.com',
  },
  images: { unoptimized: true } 
}

module.exports = nextConfig
