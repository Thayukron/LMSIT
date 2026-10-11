require('dotenv').config(); // โหลดค่าจาก .env (เช่น API Key, DB Config)
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');

// ต้องมี JWT_SECRET ไม่งั้นระบบ login จะไม่ปลอดภัย
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("❌ กรุณาตั้งค่า JWT_SECRET ใน .env (ยาวอย่างน้อย 32 ตัวอักษร)");
    process.exit(1);
}

const app = express();

// --- Middlewares ---
// อนุญาตเฉพาะ Frontend ของเรา (ปกติ Frontend เรียกผ่าน rewrites ของ Next.js อยู่แล้ว จึงเป็นโดเมนเดียวกัน)
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json()); // ช่วยให้ Server อ่านข้อมูลแบบ JSON ที่ส่งมาจากหน้าบ้านได้
app.use(express.urlencoded({ extended: true })); // สำหรับข้อมูลจาก Form
app.use(cookieParser()); // อ่าน JWT จาก cookie

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

// --- 404 ---
app.use((req, res) => {
    res.status(404).json({ message: 'ไม่พบ API ที่เรียก' });
});

// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดบางอย่างภายในระบบ!' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server กำลังรันอยู่ที่พอร์ต ${PORT}`);
});
