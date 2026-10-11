// backend/src/controllers/course.controller.js
const db = require('../config/db');
const { parseFile, parseUrl, cleanText, MAX_CONTENT_LENGTH } = require('../services/parser.service');
const { toId, findOwnedCourse } = require('../utils/access');

// ตรวจชื่อ/คำอธิบายวิชา คืนข้อความ error หรือ null ถ้าถูกต้อง
const validateCourseInput = (title, description) => {
    if (!title || title.length > 255) return "กรุณากรอกชื่อวิชา (ไม่เกิน 255 ตัวอักษร)";
    if (description.length > 5000) return "คำอธิบายวิชายาวเกินไป (ไม่เกิน 5000 ตัวอักษร)";
    return null;
};

/**
 * 1. รายการวิชา (?mine=1 สำหรับครู = เฉพาะวิชาที่ตัวเองสอน)
 */
exports.listCourses = async (req, res) => {
    try {
        const mineOnly = req.query.mine === '1' && req.user.role === 'TEACHER';
        const [rows] = await db.query(
            `SELECT c.id, c.title, c.description, c.teacher_id, u.name AS teacher_name,
                    COUNT(m.id) AS module_count, c.created_at
             FROM courses c
             LEFT JOIN users u ON u.id = c.teacher_id
             LEFT JOIN modules m ON m.course_id = c.id
             ${mineOnly ? 'WHERE c.teacher_id = ?' : ''}
             GROUP BY c.id
             ORDER BY c.id DESC`,
            mineOnly ? [req.user.id] : []
        );
        res.json(rows);
    } catch (error) {
        console.error("🔥 List Courses Error:", error);
        res.status(500).json({ message: "ดึงรายวิชาไม่สำเร็จ" });
    }
};

/**
 * 2. รายละเอียดวิชา + รายการบทเรียน
 */
exports.getCourse = async (req, res) => {
    try {
        const courseId = toId(req.params.courseId);
        const [courses] = courseId
            ? await db.query(
                `SELECT c.id, c.title, c.description, c.teacher_id, u.name AS teacher_name, c.created_at
                 FROM courses c LEFT JOIN users u ON u.id = c.teacher_id WHERE c.id = ?`,
                [courseId]
            )
            : [[]];
        if (courses.length === 0) return res.status(404).json({ message: "ไม่พบวิชานี้" });

        const [modules] = await db.query(
            "SELECT id, title, created_at FROM modules WHERE course_id = ? ORDER BY id",
            [courseId]
        );
        const course = courses[0];
        res.json({ ...course, modules, can_edit: course.teacher_id === req.user.id });
    } catch (error) {
        console.error("🔥 Get Course Error:", error);
        res.status(500).json({ message: "ดึงข้อมูลวิชาไม่สำเร็จ" });
    }
};

/**
 * 3. สร้างวิชา (ครู)
 */
exports.createCourse = async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();
        const description = String(req.body.description || '').trim();
        const invalid = validateCourseInput(title, description);
        if (invalid) return res.status(400).json({ message: invalid });

        const [result] = await db.query(
            "INSERT INTO courses (title, description, teacher_id) VALUES (?, ?, ?)",
            [title, description || null, req.user.id]
        );
        res.status(201).json({ message: "สร้างวิชาสำเร็จ!", id: result.insertId });
    } catch (error) {
        console.error("🔥 Create Course Error:", error);
        res.status(500).json({ message: "สร้างวิชาไม่สำเร็จ" });
    }
};

/**
 * 4. แก้ไขวิชา (เฉพาะเจ้าของ)
 */
exports.updateCourse = async (req, res) => {
    try {
        const course = await findOwnedCourse(req, res, req.params.courseId);
        if (!course) return;

        const title = String(req.body.title || '').trim();
        const description = String(req.body.description || '').trim();
        const invalid = validateCourseInput(title, description);
        if (invalid) return res.status(400).json({ message: invalid });

        await db.query("UPDATE courses SET title = ?, description = ? WHERE id = ?",
            [title, description || null, course.id]);
        res.json({ message: "บันทึกการแก้ไขแล้ว" });
    } catch (error) {
        console.error("🔥 Update Course Error:", error);
        res.status(500).json({ message: "แก้ไขวิชาไม่สำเร็จ" });
    }
};

/**
 * 5. ลบวิชา (เฉพาะเจ้าของ) — บทเรียน ข้อสอบ และ cache ในวิชาจะถูกลบตามไปด้วย
 */
exports.deleteCourse = async (req, res) => {
    try {
        const course = await findOwnedCourse(req, res, req.params.courseId);
        if (!course) return;

        await db.query("DELETE FROM courses WHERE id = ?", [course.id]);
        res.json({ message: "ลบวิชาแล้ว" });
    } catch (error) {
        console.error("🔥 Delete Course Error:", error);
        res.status(500).json({ message: "ลบวิชาไม่สำเร็จ" });
    }
};

/**
 * 6. เพิ่มบทเรียนในวิชา (เฉพาะเจ้าของ)
 * เนื้อหามาจาก 1 ใน 3 แหล่ง: ไฟล์ (PDF/DOCX/TXT), URL หรือข้อความที่พิมพ์เอง (text)
 */
exports.createModule = async (req, res) => {
    try {
        const course = await findOwnedCourse(req, res, req.params.courseId);
        if (!course) return;

        const title = String(req.body.title || '').trim();
        const url = String(req.body.url || '').trim();
        const text = String(req.body.text || '');
        if (!title || title.length > 255) {
            return res.status(400).json({ message: "กรุณากรอกชื่อบทเรียน (ไม่เกิน 255 ตัวอักษร)" });
        }

        let extractedText;
        try {
            if (req.file) extractedText = await parseFile(req.file);
            else if (url) extractedText = await parseUrl(url);
            else if (text.trim()) extractedText = text;
            else return res.status(400).json({ message: "กรุณาอัปโหลดไฟล์ ระบุ URL หรือพิมพ์เนื้อหา" });
        } catch (parseError) {
            console.error("🔥 Parse Error:", parseError);
            return res.status(400).json({ message: "อ่านเนื้อหาจากไฟล์หรือ URL ไม่สำเร็จ" });
        }

        extractedText = cleanText(extractedText);
        if (!extractedText) {
            return res.status(400).json({ message: "ไม่พบข้อความในเนื้อหา (ไฟล์ PDF ที่เป็นภาพสแกนยังไม่รองรับ)" });
        }
        if (extractedText.length > MAX_CONTENT_LENGTH) {
            return res.status(400).json({
                message: `เนื้อหายาวเกินไป (${extractedText.length.toLocaleString()} ตัวอักษร, สูงสุด ${MAX_CONTENT_LENGTH.toLocaleString()}) กรุณาแบ่งเป็นหลายบทเรียน`
            });
        }

        const [result] = await db.query(
            "INSERT INTO modules (course_id, title, original_content) VALUES (?, ?, ?)",
            [course.id, title, extractedText]
        );
        res.status(201).json({ message: "เพิ่มบทเรียนสำเร็จ!", id: result.insertId });
    } catch (error) {
        console.error("🔥 Create Module Error:", error);
        res.status(500).json({ message: "เพิ่มบทเรียนไม่สำเร็จ" });
    }
};
