import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/marketing", destination: "/salt", permanent: true },
    ];
  },
  // Configure for larger file uploads (battlecard PDFs)
  serverExternalPackages: [],
};

export default nextConfig;
