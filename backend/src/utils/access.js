// ตัวช่วยตรวจ ID และสิทธิ์ความเป็นเจ้าของ (ใช้ร่วมกันใน controllers)
const db = require('../config/db');

// แปลงเป็นเลข ID ที่ถูกต้อง (จำนวนเต็มบวก) ไม่งั้นคืน null
const toId = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
};

/**
 * หาวิชาที่ครูคนนี้เป็นเจ้าของ
 * ถ้าไม่พบหรือไม่ใช่เจ้าของ จะตอบ 404/403 ให้เลยแล้วคืน null (controller แค่ return)
 */
const findOwnedCourse = async (req, res, courseIdParam) => {
    const courseId = toId(courseIdParam);
    const [rows] = courseId
        ? await db.query("SELECT * FROM courses WHERE id = ?", [courseId])
        : [[]];
    if (rows.length === 0) {
        res.status(404).json({ message: "ไม่พบวิชานี้" });
        return null;
    }
    if (rows[0].teacher_id !== req.user.id) {
        res.status(403).json({ message: "คุณไม่ใช่ผู้สอนของวิชานี้" });
        return null;
    }
    return rows[0];
};

/**
 * หาบทเรียนที่อยู่ในวิชาของครูคนนี้ (หลักการเดียวกับ findOwnedCourse)
 */
const findOwnedModule = async (req, res, moduleIdParam) => {
    const moduleId = toId(moduleIdParam);
    const [rows] = moduleId
        ? await db.query(
            "SELECT m.*, c.teacher_id FROM modules m JOIN courses c ON c.id = m.course_id WHERE m.id = ?",
            [moduleId]
        )
        : [[]];
    if (rows.length === 0) {
        res.status(404).json({ message: "ไม่พบบทเรียนนี้" });
        return null;
    }
    if (rows[0].teacher_id !== req.user.id) {
        res.status(403).json({ message: "คุณไม่ใช่ผู้สอนของบทเรียนนี้" });
        return null;
    }
    return rows[0];
};

module.exports = { toId, findOwnedCourse, findOwnedModule };
