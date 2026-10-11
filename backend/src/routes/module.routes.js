const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/module.controller');
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
router.post('/:moduleId/quizzes/import-ai', teacherOnly, moduleController.importQuizzesWithAI);

module.exports = router;
