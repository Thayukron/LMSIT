const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

// จัดการข้อสอบรายข้อ (เฉพาะครู — ตรวจความเป็นเจ้าของใน controller)
router.use(requireAuth, requireRole('TEACHER'));

router.put('/:quizId', quizController.updateQuiz);
router.delete('/:quizId', quizController.deleteQuiz);

module.exports = router;
