const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attempt.controller');
const { requireAuth } = require('../middleware/auth');

// ผลสอบรายครั้ง (สิทธิ์ตรวจใน controller: เจ้าของผลสอบ หรือครูเจ้าของวิชา)
router.get('/:attemptId', requireAuth, attemptController.getAttempt);

module.exports = router;
