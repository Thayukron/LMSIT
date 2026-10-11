-- =====================================================
-- Migration 003: ตารางเก็บผลสอบ (quiz_attempts, quiz_attempt_answers)
-- ใช้กับฐานข้อมูลที่สร้างไว้ก่อนระบบสอบ (ติดตั้งใหม่ใช้ schema.sql ได้เลย)
-- รันครั้งเดียว: mysql -u root -p < database/migrations/003_quiz_attempts.sql
-- =====================================================
USE lmsit;

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
