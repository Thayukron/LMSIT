-- =====================================================
-- Migration 006: API key ของ AI รายวิชา (ครูใช้ key ของตัวเอง)
-- ใช้กับฐานข้อมูลที่สร้างไว้ก่อนฟีเจอร์นี้ (ติดตั้งใหม่ใช้ schema.sql ได้เลย)
-- รันครั้งเดียว: mysql -u root -p < database/migrations/006_course_ai_key.sql
-- =====================================================
USE lmsit;

ALTER TABLE courses
    ADD COLUMN ai_api_key_enc TEXT NULL AFTER teacher_id,
    ADD COLUMN ai_api_key_hint VARCHAR(16) NULL AFTER ai_api_key_enc,
    ADD COLUMN ai_api_key_updated_at TIMESTAMP NULL AFTER ai_api_key_hint;
