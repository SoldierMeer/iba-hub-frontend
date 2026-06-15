import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.iba-suk.edu.pk',
      },
    ],
  },
};

export default nextConfig;
