import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-origin requests for preview
  allowedDevOrigins: [
    'preview-chat-2852f4c9-3dd1-4f4a-aea7-4c0b18ff3fa4.space.z.ai',
    'ws-dddfc-baceda-oyukiczzad.cn-hongkong-vpc.fcapp.run',
  ],
};

export default nextConfig;
