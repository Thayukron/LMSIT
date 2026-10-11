-- =====================================================
-- Migration 005: cache เนื้อหา AI หลายเวอร์ชันต่อสไตล์ (content_styles.version_number)
-- ใช้กับฐานข้อมูลที่สร้างไว้ก่อนระยะที่ 3 (ติดตั้งใหม่ใช้ schema.sql ได้เลย)
-- รันครั้งเดียว: mysql -u root -p < database/migrations/005_content_versions.sql
-- =====================================================
USE lmsit;

ALTER TABLE content_styles
    ADD COLUMN version_number INT NOT NULL DEFAULT 1 AFTER style_type;

-- แถวเดิมที่ซ้ำกัน (เคยเกิดตอนนักเรียนหลายคนเปิดพร้อมกัน) ให้เลขเวอร์ชันเรียงกัน 1, 2, 3, ...
UPDATE content_styles cs
JOIN (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY module_id, style_type ORDER BY id) AS rn
    FROM content_styles
) numbered ON numbered.id = cs.id
SET cs.version_number = numbered.rn;

-- เก็บไว้สูงสุด 3 เวอร์ชันต่อสไตล์
DELETE FROM content_styles WHERE version_number > 3;

ALTER TABLE content_styles
    ADD UNIQUE KEY uq_module_style_version (module_id, style_type, version_number),
    DROP INDEX idx_module_style;
