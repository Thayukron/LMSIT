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

-- วิชาหลัก (teacher_id = ครูเจ้าของวิชา มีสิทธิ์แก้ไข/ลบ)
CREATE TABLE IF NOT EXISTS courses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id  INT NULL,
    -- Gemini API key ของครูสำหรับวิชานี้ (เข้ารหัส AES-256-GCM, ไม่ส่งกลับไปหน้าเว็บ)
    ai_api_key_enc        TEXT NULL,
    ai_api_key_hint       VARCHAR(16) NULL,
    ai_api_key_updated_at TIMESTAMP NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id)
        REFERENCES users(id) ON DELETE SET NULL
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
-- เก็บได้หลายเวอร์ชันต่อสไตล์ (สูงสุด 3) แล้วสุ่มแสดง
CREATE TABLE IF NOT EXISTS content_styles (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    module_id      INT NOT NULL,
    style_type     VARCHAR(50) NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    content_body   LONGTEXT NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_module_style_version (module_id, style_type, version_number),
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

-- การสอบแต่ละครั้งของนักเรียน (ทำซ้ำได้ เก็บทุกครั้ง)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    module_id  INT NOT NULL,
    score      INT NOT NULL,
    total      INT NOT NULL,
    passed     BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attempt_user_module (user_id, module_id),
    CONSTRAINT fk_attempts_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempts_module FOREIGN KEY (module_id)
        REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- คำตอบรายข้อ: เก็บสำเนาคำถาม/ตัวเลือก/เฉลย ณ ตอนสอบ
-- ครูแก้หรือลบข้อสอบภายหลังได้ โดยประวัติการสอบยังถูกต้อง (quiz_id จะเป็น NULL ถ้าข้อสอบถูกลบ)
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id      INT NOT NULL,
    quiz_id         INT NULL,
    question        TEXT NOT NULL,
    option_a        TEXT NOT NULL,
    option_b        TEXT NOT NULL,
    option_c        TEXT NOT NULL,
    option_d        TEXT NOT NULL,
    correct_answer  ENUM('a', 'b', 'c', 'd') NOT NULL,
    selected_answer ENUM('a', 'b', 'c', 'd') NULL,
    is_correct      BOOLEAN NOT NULL,
    CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id)
        REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_quiz FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

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
