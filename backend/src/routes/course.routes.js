const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const courseController = require('../controllers/course.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

// ทุก route ในไฟล์นี้ต้อง login ก่อน
router.use(requireAuth);

/**
 * -------------------------------------------------------
 * ROUTES สำหรับครู (TEACHER เท่านั้น)
 * -------------------------------------------------------
 */
const teacherOnly = requireRole('TEACHER');

// 1. นำเข้าเนื้อหาบทเรียน (รองรับไฟล์ PDF/DOCX หรือ URL)
router.post('/upload-module', teacherOnly, upload.single('file'), courseController.uploadModuleContent);

// 2. นำเข้าข้อสอบอัจฉริยะ (AI วิเคราะห์จากข้อความ Raw Text)
router.post('/import-smart-quiz', teacherOnly, courseController.importSmartQuiz);

// 3. สร้างข้อสอบแบบระบุข้อมูลเอง (Manual)
router.post('/create-quiz', teacherOnly, courseController.createQuiz);


/**
 * -------------------------------------------------------
 * ROUTES สำหรับผู้ใช้ทุกคนที่ login แล้ว
 * -------------------------------------------------------
 */

// 4. ดึงรายวิชา/โมดูลทั้งหมด (แสดงผลบน Dashboard)
router.get('/', courseController.getAllModules);

// 5. ดึงเนื้อหาที่ถูกปรับแต่งสไตล์โดย AI (แสดงผลบนหน้าบทเรียน)
// ตัวอย่าง: /api/courses/modules/1/content?style=peer_to_peer
router.get('/modules/:moduleId/content', courseController.getModuleContentByStyle);

// 6. ดึงข้อมูลโมดูลแบบเจาะจง (ถ้าต้องใช้ข้อมูลดั้งเดิม)
router.get('/modules/:moduleId', courseController.getModuleById);

// 7. ดึงชุดข้อสอบของโมดูลนั้นๆ (นักเรียนจะไม่ได้รับเฉลย)
router.get('/modules/:moduleId/quizzes', courseController.getModuleQuizzes);

module.exports = router;
