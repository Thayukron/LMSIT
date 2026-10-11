-- =====================================================
-- Migration 004: บันทึกการเข้าเรียนบทเรียน (module_visits)
-- ใช้กับฐานข้อมูลที่สร้างไว้ก่อน Dashboard (ติดตั้งใหม่ใช้ schema.sql ได้เลย)
-- รันครั้งเดียว: mysql -u root -p < database/migrations/004_module_visits.sql
-- =====================================================
USE lmsit;

-- การเข้าเรียน: 1 แถวต่อนักเรียน 1 บทเรียน (บันทึกเมื่อเปิดอ่านเนื้อหาสำเร็จ)
CREATE TABLE IF NOT EXISTS module_visits (
    user_id          INT NOT NULL,
    module_id        INT NOT NULL,
    first_visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_visited_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, module_id),
    CONSTRAINT fk_visits_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_visits_module FOREIGN KEY (module_id)
        REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;
