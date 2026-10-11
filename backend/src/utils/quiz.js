// ตัวช่วยตรวจ/จัดรูปข้อสอบ (ใช้ทั้งตอนบันทึก แก้ไข และตอนรับผลจาก AI)

const QUIZ_TEXT_FIELDS = ['question', 'option_a', 'option_b', 'option_c', 'option_d'];
const ANSWERS = ['a', 'b', 'c', 'd'];
const MAX_FIELD_LENGTH = 2000;

// เกณฑ์ผ่านแบบทดสอบ (เปอร์เซ็นต์ของคะแนนเต็ม)
const PASS_PERCENT = 60;
const percentOf = (score, total) => (total > 0 ? Math.round((score / total) * 100) : 0);

// แปลงข้อสอบ 1 ข้อให้เป็นรูปแบบมาตรฐาน (ตัดช่องว่าง, เฉลยเป็นตัวพิมพ์เล็ก)
const normalizeQuiz = (q) => {
    const quiz = {};
    for (const k of QUIZ_TEXT_FIELDS) quiz[k] = String(q?.[k] ?? '').trim();
    quiz.correct_answer = String(q?.correct_answer ?? '').trim().toLowerCase();
    return quiz;
};

// คืนข้อความ error ถ้าข้อสอบไม่ถูกต้อง หรือ null ถ้าใช้ได้
const quizError = (quiz) => {
    if (QUIZ_TEXT_FIELDS.some(k => !quiz[k])) return 'ต้องมีคำถามและตัวเลือก a-d ครบ';
    if (QUIZ_TEXT_FIELDS.some(k => quiz[k].length > MAX_FIELD_LENGTH)) return `ข้อความแต่ละช่องต้องไม่เกิน ${MAX_FIELD_LENGTH} ตัวอักษร`;
    if (!ANSWERS.includes(quiz.correct_answer)) return 'ต้องเลือกเฉลย (a, b, c หรือ d)';
    return null;
};

/**
 * ตรวจและแปลงรายการข้อสอบเป็นแถวสำหรับ INSERT
 * คืน { values } หรือ { error }
 */
const toQuizRows = (moduleId, questions) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return { error: "ไม่พบข้อสอบที่จะบันทึก" };
    }
    if (questions.length > 200) {
        return { error: "บันทึกได้ครั้งละไม่เกิน 200 ข้อ" };
    }
    const values = [];
    for (const [i, q] of questions.entries()) {
        const quiz = normalizeQuiz(q);
        const error = quizError(quiz);
        if (error) return { error: `ข้อที่ ${i + 1}: ${error}` };
        values.push([moduleId, ...QUIZ_TEXT_FIELDS.map(k => quiz[k]), quiz.correct_answer]);
    }
    return { values };
};

// AI บางครั้งตอบเป็น { "questions": [...] } แทน Array ตรงๆ
const extractQuizArray = (aiResult) => {
    if (Array.isArray(aiResult)) return aiResult;
    if (aiResult && typeof aiResult === 'object') {
        const arr = Object.values(aiResult).find(Array.isArray);
        if (arr) return arr;
    }
    return [];
};

module.exports = { normalizeQuiz, quizError, toQuizRows, extractQuizArray, PASS_PERCENT, percentOf };
