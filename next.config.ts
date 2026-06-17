import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    if (process.env.VERCEL !== "1") {
      return [];
    }

    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: "http://ssh.gsmsv.site:25124/api/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
