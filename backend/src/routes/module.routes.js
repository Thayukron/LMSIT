const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/module.controller');
const attemptController = require('../controllers/attempt.controller');
const progressController = require('../controllers/progress.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

// ทุก route ในไฟล์นี้ต้อง login ก่อน
router.use(requireAuth);
const teacherOnly = requireRole('TEACHER');

// ข้อมูลบทเรียน / แก้ไข / ลบ
router.get('/:moduleId', moduleController.getModule);
router.put('/:moduleId', teacherOnly, moduleController.updateModule);
router.delete('/:moduleId', teacherOnly, moduleController.deleteModule);

// เนื้อหาที่ AI ปรับสไตล์ เช่น /api/modules/1/content?style=summary
router.get('/:moduleId/content', moduleController.getStyledContent);

// ข้อสอบ
router.get('/:moduleId/quizzes', moduleController.getQuizzes);
router.post('/:moduleId/quizzes', teacherOnly, moduleController.createQuizzes);
// ให้ AI ช่วย: คืนร่างข้อสอบให้ครูตรวจก่อน (ยังไม่บันทึก)
router.post('/:moduleId/quizzes/ai-parse', teacherOnly, moduleController.aiParseQuizzes);
router.post('/:moduleId/quizzes/ai-generate', teacherOnly, moduleController.aiGenerateQuizzes);
// สถิติรายข้อ (ข้อไหนตอบผิดเยอะ)
router.get('/:moduleId/quiz-stats', teacherOnly, progressController.getQuizStats);

// สอบ: ส่งคำตอบ (นักเรียนบันทึกผล / ครูเป็นโหมดดูตัวอย่าง) และประวัติการสอบของตัวเอง
router.post('/:moduleId/attempts', attemptController.submitAttempt);
router.get('/:moduleId/attempts', attemptController.listMyAttempts);

module.exports = router;
