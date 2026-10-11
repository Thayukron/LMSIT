// backend/src/controllers/quiz.controller.js
const db = require('../config/db');
const { findOwnedQuiz } = require('../utils/access');
const { normalizeQuiz, quizError } = require('../utils/quiz');

/**
 * 1. แก้ไขข้อสอบ 1 ข้อ (เฉพาะครูเจ้าของวิชา)
 */
exports.updateQuiz = async (req, res) => {
    try {
        const existing = await findOwnedQuiz(req, res, req.params.quizId);
        if (!existing) return;

        const quiz = normalizeQuiz(req.body);
        const error = quizError(quiz);
        if (error) return res.status(400).json({ message: error });

        await db.query(
            `UPDATE quizzes SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?
             WHERE id = ?`,
            [quiz.question, quiz.option_a, quiz.option_b, quiz.option_c, quiz.option_d, quiz.correct_answer, existing.id]
        );
        res.json({ message: "บันทึกข้อสอบแล้ว", quiz: { id: existing.id, module_id: existing.module_id, ...quiz } });
    } catch (error) {
        console.error("🔥 Update Quiz Error:", error);
        res.status(500).json({ message: "แก้ไขข้อสอบไม่สำเร็จ" });
    }
};

/**
 * 2. ลบข้อสอบ 1 ข้อ (เฉพาะครูเจ้าของวิชา)
 */
exports.deleteQuiz = async (req, res) => {
    try {
        const existing = await findOwnedQuiz(req, res, req.params.quizId);
        if (!existing) return;

        await db.query("DELETE FROM quizzes WHERE id = ?", [existing.id]);
        res.json({ message: "ลบข้อสอบแล้ว" });
    } catch (error) {
        console.error("🔥 Delete Quiz Error:", error);
        res.status(500).json({ message: "ลบข้อสอบไม่สำเร็จ" });
    }
};
