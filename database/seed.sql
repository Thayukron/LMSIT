-- ข้อมูลตัวอย่างสำหรับทดลองระบบ (รันหลัง schema.sql)
USE lmsit;

-- บัญชีทดลอง (เปลี่ยนรหัสผ่านก่อนใช้งานจริง!)
--   ครู:      teacher@lmsit.local / teacher1234
--   นักเรียน: student@lmsit.local / student1234
INSERT INTO users (name, email, password_hash, role) VALUES
    ('ครูตัวอย่าง', 'teacher@lmsit.local', '$2b$10$VKdr/tfVI8YFHL.RFSvteOyqzz4Or4hhThYQ3jt2CBpw6RUHcOwUe', 'TEACHER'),
    ('นักเรียนตัวอย่าง', 'student@lmsit.local', '$2b$10$Fn0IXk2DyaHvCnrwvzbsZeTtMTeHNbPNCzGqFrNV685FFVI0gGZIa', 'STUDENT');

INSERT INTO courses (id, title, description) VALUES
    (1, 'พื้นฐานเทคโนโลยีสารสนเทศ', 'วิชาตัวอย่างสำหรับทดลองระบบ');

INSERT INTO modules (id, course_id, title, original_content) VALUES
    (1, 1, 'ความรู้เบื้องต้นเกี่ยวกับคอมพิวเตอร์',
     'คอมพิวเตอร์ประกอบด้วยฮาร์ดแวร์และซอฟต์แวร์ ฮาร์ดแวร์คือส่วนที่จับต้องได้ เช่น CPU หน่วยความจำ และอุปกรณ์รับเข้า/ส่งออก ส่วนซอฟต์แวร์คือชุดคำสั่งที่ทำให้ฮาร์ดแวร์ทำงาน แบ่งเป็นซอฟต์แวร์ระบบ เช่น ระบบปฏิบัติการ และซอฟต์แวร์ประยุกต์ เช่น โปรแกรมประมวลผลคำ');

INSERT INTO quizzes (module_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
    (1, 'ข้อใดเป็นฮาร์ดแวร์', 'ระบบปฏิบัติการ', 'CPU', 'โปรแกรมประมวลผลคำ', 'เว็บเบราว์เซอร์', 'b'),
    (1, 'ระบบปฏิบัติการจัดเป็นซอฟต์แวร์ประเภทใด', 'ซอฟต์แวร์ระบบ', 'ซอฟต์แวร์ประยุกต์', 'ฮาร์ดแวร์', 'เฟิร์มแวร์เกม', 'a');
