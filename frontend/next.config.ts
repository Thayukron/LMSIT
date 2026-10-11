import type { NextConfig } from "next";

// ที่อยู่ของ Backend API (ฝั่ง server เท่านั้น ไม่ถูกส่งไปที่เบราว์เซอร์)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // ส่งต่อ /api/* ไปที่ Backend ทำให้หน้าเว็บกับ API อยู่โดเมนเดียวกัน
  // (cookie ที่เก็บ JWT จึงทำงานได้โดยไม่ต้องเปิด CORS)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
