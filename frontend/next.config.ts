import type { NextConfig } from "next";

// ที่อยู่ของ Backend API (ฝั่ง server เท่านั้น ไม่ถูกส่งไปที่เบราว์เซอร์)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Next.js ตัด body ที่ส่งต่อไป Backend ไว้ที่ 10MB โดยค่าเริ่มต้น
    // ตั้งให้มากกว่าขนาดไฟล์สูงสุดของ Backend (10MB) เล็กน้อย เพื่อให้ Backend เป็นคนตอบว่า "ไฟล์ใหญ่เกินไป"
    proxyClientMaxBodySize: "12mb",
    // Next.js ตัดการเชื่อมต่อไป Backend หลัง 30 วินาทีโดยค่าเริ่มต้น
    // แต่การให้ AI สร้างเนื้อหา/ข้อสอบอาจนานกว่านั้น (Backend รอ AI ได้สูงสุด ~135 วินาที: 3 model × 45 วินาที)
    proxyTimeout: 150_000,
  },
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
