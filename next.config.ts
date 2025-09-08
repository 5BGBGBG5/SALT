import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/marketing", destination: "/salt", permanent: true },
    ];
  },
  // Configure for larger file uploads (battlecard PDFs)
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Increase body size limit for file uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default nextConfig;
