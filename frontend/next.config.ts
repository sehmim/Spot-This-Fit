import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@spotthisfit/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
