import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.statmuse.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hoopmetrics-image-hosting.lon1.cdn.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hoopmetrics-image-hosting.lon1.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
