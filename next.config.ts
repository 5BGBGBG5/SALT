import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/marketing", destination: "/salt", permanent: true },
    ];
  },
};

export default nextConfig;
