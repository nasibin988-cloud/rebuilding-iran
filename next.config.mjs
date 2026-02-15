/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',
  images: { unoptimized: true },
};

export default nextConfig;
