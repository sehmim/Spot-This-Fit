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
  rewrites: async () => {
    let backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
    if (backendUrl && !/^https?:\/\//.test(backendUrl)) {
      backendUrl = `https://${backendUrl}`;
    }
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
