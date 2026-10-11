-- =====================================================
-- Migration 002: เพิ่มเจ้าของวิชา (courses.teacher_id)
-- ใช้กับฐานข้อมูลที่สร้างไว้ก่อนระยะที่ 2 เท่านั้น (ติดตั้งใหม่ใช้ schema.sql ได้เลย)
-- รันครั้งเดียว: mysql -u root -p < database/migrations/002_course_owner.sql
-- =====================================================
USE lmsit;

ALTER TABLE courses
    ADD COLUMN teacher_id INT NULL AFTER description,
    ADD CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id)
        REFERENCES users(id) ON DELETE SET NULL;

-- วิชาเดิมที่ยังไม่มีเจ้าของ ให้เป็นของครูคนแรกในระบบ
UPDATE courses
SET teacher_id = (SELECT id FROM users WHERE role = 'TEACHER' ORDER BY id LIMIT 1)
WHERE teacher_id IS NULL;
