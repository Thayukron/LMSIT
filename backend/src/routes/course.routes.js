const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { uploadSingle } = require('../middleware/upload');
const { requireAuth, requireRole } = require('../middleware/auth');

// ทุก route ในไฟล์นี้ต้อง login ก่อน
router.use(requireAuth);
const teacherOnly = requireRole('TEACHER');

// รายการวิชา (ครูใช้ ?mine=1 เพื่อดูเฉพาะวิชาของตัวเอง)
router.get('/', courseController.listCourses);
// สร้างวิชา
router.post('/', teacherOnly, courseController.createCourse);

// รายละเอียดวิชา + รายการบทเรียน
router.get('/:courseId', courseController.getCourse);
// แก้ไข / ลบวิชา (เฉพาะเจ้าของ)
router.put('/:courseId', teacherOnly, courseController.updateCourse);
router.delete('/:courseId', teacherOnly, courseController.deleteCourse);

// เพิ่มบทเรียน (form-data: title + file หรือ url หรือ text)
router.post('/:courseId/modules', teacherOnly, uploadSingle('file'), courseController.createModule);

module.exports = router;
