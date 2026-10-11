-- =====================================================
-- AI-Powered Personalized LMS - Database Schema (MySQL / MariaDB)
-- วิธีใช้: mysql -u root -p < database/schema.sql
-- =====================================================

CREATE DATABASE IF NOT EXISTS lmsit
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE lmsit;

-- ผู้ใช้งาน (สมัครเองได้เฉพาะ STUDENT, บัญชี TEACHER สร้างโดยผู้ดูแลระบบ)
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('TEACHER', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- วิชาหลัก
CREATE TABLE IF NOT EXISTS courses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- หน่วยการเรียนรู้ (เก็บเนื้อหาต้นฉบับที่ดึงจาก PDF / Word / URL)
CREATE TABLE IF NOT EXISTS modules (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    course_id        INT NOT NULL,
    title            VARCHAR(255) NOT NULL,
    original_content LONGTEXT NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_modules_course FOREIGN KEY (course_id)
        REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Cache เนื้อหาที่ AI ปรับสไตล์แล้ว (content_body เป็น JSON string)
CREATE TABLE IF NOT EXISTS content_styles (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    module_id    INT NOT NULL,
    style_type   VARCHAR(50) NOT NULL,
    content_body LONGTEXT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_module_style (module_id, style_type),
    CONSTRAINT fk_styles_module FOREIGN KEY (module_id)
        REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ข้อสอบปรนัย 4 ตัวเลือก
CREATE TABLE IF NOT EXISTS quizzes (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    module_id      INT NOT NULL,
    question       TEXT NOT NULL,
    option_a       TEXT NOT NULL,
    option_b       TEXT NOT NULL,
    option_c       TEXT NOT NULL,
    option_d       TEXT NOT NULL,
    correct_answer ENUM('a', 'b', 'c', 'd') NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quizzes_module FOREIGN KEY (module_id)
        REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ตาราง user_progress จะเพิ่มในระยะที่ 2 (ระบบสอบ)
