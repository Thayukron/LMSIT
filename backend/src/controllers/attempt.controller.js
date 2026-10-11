// backend/src/controllers/attempt.controller.js
const db = require('../config/db');
const { toId } = require('../utils/access');

// เกณฑ์ผ่าน (เปอร์เซ็นต์ของคะแนนเต็ม)
const PASS_PERCENT = 60;
const ANSWERS = ['a', 'b', 'c', 'd'];

const percentOf = (score, total) => (total > 0 ? Math.round((score / total) * 100) : 0);

// รวมผลรายข้อเป็นสรุปคะแนนที่ส่งกลับให้หน้าเว็บ
const summarize = (answers) => {
    const score = answers.filter(a => a.is_correct).length;
    const total = answers.length;
    const percent = percentOf(score, total);
    return { score, total, percent, passed: percent >= PASS_PERCENT, pass_percent: PASS_PERCENT, answers };
};

/**
 * 1. ส่งคำตอบและตรวจคะแนน (ตรวจฝั่ง server เท่านั้น)
 *    body: { answers: { "<quizId>": "a" | "b" | "c" | "d" } } — ข้อที่ไม่ตอบนับเป็นผิด
 *    นักเรียน: บันทึกผล | ครู: โหมดดูตัวอย่าง ตรวจให้แต่ไม่บันทึก
 */
exports.submitAttempt = async (req, res) => {
    const moduleId = toId(req.params.moduleId);
    const submitted = req.body?.answers;
    if (!moduleId) return res.status(404).json({ message: "ไม่พบบทเรียนนี้" });
    if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) {
        return res.status(400).json({ message: "รูปแบบคำตอบไม่ถูกต้อง" });
    }

    let conn;
    try {
        const [quizzes] = await db.query("SELECT * FROM quizzes WHERE module_id = ? ORDER BY id", [moduleId]);
        if (quizzes.length === 0) return res.status(400).json({ message: "บทเรียนนี้ยังไม่มีข้อสอบ" });

        const answers = quizzes.map(q => {
            const raw = String(submitted[q.id] ?? '').toLowerCase();
            const selected = ANSWERS.includes(raw) ? raw : null;
            return {
                quiz_id: q.id,
                question: q.question,
                option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
                correct_answer: q.correct_answer,
                selected_answer: selected,
                is_correct: selected === q.correct_answer,
            };
        });
        const result = summarize(answers);

        if (req.user.role !== 'STUDENT') {
            return res.json({ ...result, saved: false });
        }

        // บันทึกผลสอบ + คำตอบรายข้อในทรานแซกชันเดียว (สำเร็จพร้อมกันหรือไม่บันทึกเลย)
        conn = await db.getConnection();
        await conn.beginTransaction();
        const [inserted] = await conn.query(
            "INSERT INTO quiz_attempts (user_id, module_id, score, total, passed) VALUES (?, ?, ?, ?, ?)",
            [req.user.id, moduleId, result.score, result.total, result.passed]
        );
        await conn.query(
            `INSERT INTO quiz_attempt_answers
                (attempt_id, quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, selected_answer, is_correct)
             VALUES ?`,
            [answers.map(a => [inserted.insertId, a.quiz_id, a.question, a.option_a, a.option_b, a.option_c, a.option_d,
                a.correct_answer, a.selected_answer, a.is_correct])]
        );
        await conn.commit();

        res.status(201).json({ ...result, saved: true, attempt_id: inserted.insertId });
    } catch (error) {
        if (conn) await conn.rollback().catch(() => {});
        console.error("🔥 Submit Attempt Error:", error);
        res.status(500).json({ message: "ส่งคำตอบไม่สำเร็จ กรุณาลองใหม่" });
    } finally {
        if (conn) conn.release();
    }
};

/**
 * 2. ประวัติการสอบของตัวเองในบทเรียนนี้ (ล่าสุดก่อน)
 */
exports.listMyAttempts = async (req, res) => {
    try {
        const moduleId = toId(req.params.moduleId);
        if (!moduleId) return res.status(404).json({ message: "ไม่พบบทเรียนนี้" });

        const [rows] = await db.query(
            `SELECT id, score, total, passed, created_at FROM quiz_attempts
             WHERE user_id = ? AND module_id = ? ORDER BY id DESC`,
            [req.user.id, moduleId]
        );
        res.json(rows.map(r => ({ ...r, passed: !!r.passed, percent: percentOf(r.score, r.total) })));
    } catch (error) {
        console.error("🔥 List Attempts Error:", error);
        res.status(500).json({ message: "ดึงประวัติการสอบไม่สำเร็จ" });
    }
};

/**
 * 3. ผลสอบรายครั้งพร้อมเฉลย (เจ้าของผลสอบ หรือครูเจ้าของวิชา)
 */
exports.getAttempt = async (req, res) => {
    try {
        const attemptId = toId(req.params.attemptId);
        const [rows] = attemptId
            ? await db.query(
                `SELECT a.*, m.title AS module_title, c.teacher_id, u.name AS student_name
                 FROM quiz_attempts a
                 JOIN modules m ON m.id = a.module_id
                 JOIN courses c ON c.id = m.course_id
                 JOIN users u ON u.id = a.user_id
                 WHERE a.id = ?`,
                [attemptId]
            )
            : [[]];
        const attempt = rows[0];
        if (!attempt || (attempt.user_id !== req.user.id && attempt.teacher_id !== req.user.id)) {
            return res.status(404).json({ message: "ไม่พบผลสอบนี้" });
        }

        const [answers] = await db.query(
            `SELECT quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, selected_answer, is_correct
             FROM quiz_attempt_answers WHERE attempt_id = ? ORDER BY id`,
            [attempt.id]
        );
        res.json({
            ...summarize(answers.map(a => ({ ...a, is_correct: !!a.is_correct }))),
            // ใช้ผลที่บันทึกไว้ตอนสอบ (กันกรณีเกณฑ์ผ่านเปลี่ยนภายหลัง)
            passed: !!attempt.passed,
            attempt_id: attempt.id,
            module_id: attempt.module_id,
            module_title: attempt.module_title,
            student_name: attempt.student_name,
            created_at: attempt.created_at,
        });
    } catch (error) {
        console.error("🔥 Get Attempt Error:", error);
        res.status(500).json({ message: "ดึงผลสอบไม่สำเร็จ" });
    }
};
