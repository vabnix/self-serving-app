import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // scripts/azure-deploy.sh builds a self-contained server for App Service.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  cacheComponents: true,
  serverExternalPackages: ["mssql"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
