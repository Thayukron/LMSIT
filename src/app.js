require('dotenv').config(); // โหลดค่าจาก .env (เช่น API Key, DB Config)
const express = require('express');
const cors = require('cors');
const courseRoutes = require('./routes/course.routes');

const app = express();

// --- Middlewares ---
app.use(cors()); // อนุญาตให้ Frontend (Next.js) เรียกใช้งาน API ได้
app.use(express.json()); // ช่วยให้ Server อ่านข้อมูลแบบ JSON ที่ส่งมาจากหน้าบ้านได้
app.use(express.urlencoded({ extended: true })); // สำหรับข้อมูลจาก Form

// --- Routes ---
// ทุก API ที่เราเขียนจะขึ้นต้นด้วย /api เช่น /api/courses/import-smart-quiz
app.use('/api/courses', courseRoutes);

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