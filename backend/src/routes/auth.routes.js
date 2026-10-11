const express = require('express');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

// กันการเดารหัสผ่าน: login ผิดได้ 10 ครั้ง ต่อ 15 นาที ต่ออีเมล
// นับต่ออีเมลแทน IP เพราะทุก request ผ่าน Next.js มาก่อน Backend จึงเห็นทุกคนเป็น IP เดียวกัน
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true, // นับเฉพาะครั้งที่ login ไม่สำเร็จ
    keyGenerator: (req) => String(req.body?.email || '').trim().toLowerCase(),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: "ลองเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
