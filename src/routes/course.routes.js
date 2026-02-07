// D:\LMS\backend\src\routes\course.routes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // มั่นใจว่ามี middleware ตัวนี้สำหรับ multer
const courseController = require('../controllers/course.controller');

/**
 * -------------------------------------------------------
 * ROUTES สำหรับฝั่ง ADMIN / CONTENT CREATOR
 * -------------------------------------------------------
 */

// 1. นำเข้าเนื้อหาบทเรียน (รองรับไฟล์ PDF/DOCX หรือ URL)
router.post('/upload-module', upload.single('file'), courseController.uploadModuleContent);

// 2. นำเข้าข้อสอบอัจฉริยะ (AI วิเคราะห์จากข้อความ Raw Text)
router.post('/import-smart-quiz', courseController.importSmartQuiz);

// 3. สร้างข้อสอบแบบระบุข้อมูลเอง (Manual)
router.post('/create-quiz', courseController.createQuiz);


/**
 * -------------------------------------------------------
 * ROUTES สำหรับฝั่งนักเรียน (STUDENT UI)
 * -------------------------------------------------------
 */

// 4. ดึงรายวิชา/โมดูลทั้งหมด (แสดงผลบน Dashboard)
router.get('/', courseController.getAllModules);

// 5. ดึงเนื้อหาที่ถูกปรับแต่งสไตล์โดย AI (แสดงผลบนหน้าบทเรียน)
// ตัวอย่าง: /api/courses/modules/1/content?style=peer_to_peer
router.get('/modules/:moduleId/content', courseController.getModuleContentByStyle);

// 6. ดึงข้อมูลโมดูลแบบเจาะจง (ถ้าต้องใช้ข้อมูลดั้งเดิม)
router.get('/modules/:moduleId', courseController.getModuleById);

// 7. ดึงชุดข้อสอบของโมดูลนั้นๆ (สำหรับหน้าทำ Quiz)
router.get('/modules/:moduleId/quizzes', courseController.getModuleQuizzes);

module.exports = router;