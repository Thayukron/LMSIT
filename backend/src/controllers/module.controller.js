// backend/src/controllers/module.controller.js
const db = require('../config/db');
const aiService = require('../services/ai.service');
const { toId, findOwnedModule } = require('../utils/access');
const { MAX_CONTENT_LENGTH } = require('../services/parser.service');

// สไตล์การเรียนที่รองรับ (ต้องตรงกับหน้าเลือกสไตล์ฝั่ง Frontend)
const ALLOWED_STYLES = ['peer_to_peer', 'summary', 'example_based', 'gamified'];

// ตรวจและจัดรูปข้อสอบ คืน { values } หรือ { error }
const toQuizRows = (moduleId, questions) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return { error: "ไม่พบข้อสอบที่จะบันทึก" };
    }
    const values = [];
    for (const [i, q] of questions.entries()) {
        const fields = ['question', 'option_a', 'option_b', 'option_c', 'option_d'].map(k => String(q?.[k] ?? '').trim());
        const answer = String(q?.correct_answer ?? '').trim().toLowerCase();
        if (fields.some(f => !f) || !['a', 'b', 'c', 'd'].includes(answer)) {
            return { error: `ข้อสอบข้อที่ ${i + 1} ข้อมูลไม่ครบ (ต้องมีคำถาม ตัวเลือก a-d และเฉลย a-d)` };
        }
        values.push([moduleId, ...fields, answer]);
    }
    return { values };
};

const insertQuizzes = (values) => db.query(
    "INSERT INTO quizzes (module_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES ?",
    [values]
);

/**
 * 1. ข้อมูลบทเรียน (ครูเจ้าของวิชาจะได้เนื้อหาต้นฉบับด้วย)
 */
exports.getModule = async (req, res) => {
    try {
        const moduleId = toId(req.params.moduleId);
        const [rows] = moduleId
            ? await db.query(
                `SELECT m.id, m.title, m.course_id, m.original_content, m.created_at,
                        c.title AS course_title, c.teacher_id
                 FROM modules m JOIN courses c ON c.id = m.course_id WHERE m.id = ?`,
                [moduleId]
            )
            : [[]];
        if (rows.length === 0) return res.status(404).json({ message: "ไม่พบบทเรียนนี้" });

        const { original_content, teacher_id, ...publicFields } = rows[0];
        const canEdit = teacher_id === req.user.id;
        res.json({ ...publicFields, can_edit: canEdit, ...(canEdit ? { original_content } : {}) });
    } catch (error) {
        console.error("🔥 Get Module Error:", error);
        res.status(500).json({ message: "ดึงข้อมูลบทเรียนไม่สำเร็จ" });
    }
};

/**
 * 2. แก้ไขบทเรียน (เฉพาะเจ้าของ) — ถ้าเนื้อหาเปลี่ยน จะล้าง cache ของ AI ให้สร้างใหม่
 */
exports.updateModule = async (req, res) => {
    try {
        const moduleRow = await findOwnedModule(req, res, req.params.moduleId);
        if (!moduleRow) return;

        const title = String(req.body.title || '').trim();
        const content = req.body.original_content === undefined
            ? moduleRow.original_content
            : String(req.body.original_content).trim();
        if (!title || title.length > 255) {
            return res.status(400).json({ message: "กรุณากรอกชื่อบทเรียน (ไม่เกิน 255 ตัวอักษร)" });
        }
        if (!content || content.length > MAX_CONTENT_LENGTH) {
            return res.status(400).json({ message: `เนื้อหาต้องไม่ว่าง และยาวไม่เกิน ${MAX_CONTENT_LENGTH.toLocaleString()} ตัวอักษร` });
        }

        await db.query("UPDATE modules SET title = ?, original_content = ? WHERE id = ?",
            [title, content, moduleRow.id]);

        const contentChanged = content !== moduleRow.original_content;
        if (contentChanged) {
            await db.query("DELETE FROM content_styles WHERE module_id = ?", [moduleRow.id]);
        }
        res.json({ message: contentChanged ? "บันทึกแล้ว (AI จะสร้างเนื้อหาแต่ละสไตล์ใหม่)" : "บันทึกแล้ว" });
    } catch (error) {
        console.error("🔥 Update Module Error:", error);
        res.status(500).json({ message: "แก้ไขบทเรียนไม่สำเร็จ" });
    }
};

/**
 * 3. ลบบทเรียน (เฉพาะเจ้าของ) — ข้อสอบและ cache จะถูกลบตามไปด้วย
 */
exports.deleteModule = async (req, res) => {
    try {
        const moduleRow = await findOwnedModule(req, res, req.params.moduleId);
        if (!moduleRow) return;

        await db.query("DELETE FROM modules WHERE id = ?", [moduleRow.id]);
        res.json({ message: "ลบบทเรียนแล้ว", course_id: moduleRow.course_id });
    } catch (error) {
        console.error("🔥 Delete Module Error:", error);
        res.status(500).json({ message: "ลบบทเรียนไม่สำเร็จ" });
    }
};

/**
 * 4. ดึงเนื้อหาแบบเลือกสไตล์ (AI)
 */
exports.getStyledContent = async (req, res) => {
    try {
        const moduleId = toId(req.params.moduleId);
        const style = String(req.query.style || '');
        if (!ALLOWED_STYLES.includes(style)) {
            return res.status(400).json({ message: "ไม่รู้จักสไตล์การเรียนนี้" });
        }

        const [modules] = moduleId
            ? await db.query("SELECT id, title, original_content FROM modules WHERE id = ?", [moduleId])
            : [[]];
        if (modules.length === 0) return res.status(404).json({ message: "ไม่พบบทเรียนนี้" });

        const styledContent = await aiService.getStyledContent(moduleId, style, modules[0].original_content);
        res.json({
            success: true,
            title: modules[0].title,
            content: styledContent,
            styleType: style
        });
    } catch (error) {
        console.error("🔥 Style Content Error:", error);
        res.status(500).json({ message: "ไม่สามารถสร้างเนื้อหาในสไตล์นี้ได้" });
    }
};

/**
 * 5. ข้อสอบของบทเรียน (ส่งเฉลยให้เฉพาะครูเจ้าของวิชา)
 */
exports.getQuizzes = async (req, res) => {
    try {
        const moduleId = toId(req.params.moduleId);
        if (!moduleId) return res.status(404).json({ message: "ไม่พบบทเรียนนี้" });

        const [owner] = await db.query(
            "SELECT c.teacher_id FROM modules m JOIN courses c ON c.id = m.course_id WHERE m.id = ?",
            [moduleId]
        );
        const isOwner = owner.length > 0 && owner[0].teacher_id === req.user.id;
        const columns = isOwner
            ? "*"
            : "id, module_id, question, option_a, option_b, option_c, option_d";
        const [quizzes] = await db.query(`SELECT ${columns} FROM quizzes WHERE module_id = ? ORDER BY id`, [moduleId]);
        res.json(quizzes);
    } catch (error) {
        console.error("🔥 Get Quizzes Error:", error);
        res.status(500).json({ message: "ดึงข้อสอบไม่สำเร็จ" });
    }
};

/**
 * 6. สร้างข้อสอบเอง (เฉพาะเจ้าของ)
 */
exports.createQuizzes = async (req, res) => {
    try {
        const moduleRow = await findOwnedModule(req, res, req.params.moduleId);
        if (!moduleRow) return;

        const { values, error } = toQuizRows(moduleRow.id, req.body.questions);
        if (error) return res.status(400).json({ message: error });

        await insertQuizzes(values);
        res.status(201).json({ message: `บันทึกข้อสอบสำเร็จ ${values.length} ข้อ!` });
    } catch (error) {
        console.error("🔥 Create Quiz Error:", error);
        res.status(500).json({ message: "ไม่สามารถบันทึกข้อสอบได้" });
    }
};

/**
 * 7. นำเข้าข้อสอบอัจฉริยะ: ให้ AI แยกข้อสอบจากข้อความดิบ (เฉพาะเจ้าของ)
 */
exports.importQuizzesWithAI = async (req, res) => {
    try {
        const moduleRow = await findOwnedModule(req, res, req.params.moduleId);
        if (!moduleRow) return;

        const rawText = String(req.body.rawText || '').trim();
        if (!rawText) return res.status(400).json({ message: "กรุณาวางข้อความข้อสอบ" });

        const quizData = await aiService.parseQuizWithAI(rawText);
        const { values, error } = toQuizRows(moduleRow.id, quizData);
        if (error) return res.status(422).json({ message: `AI แยกข้อสอบได้ไม่สมบูรณ์: ${error}` });

        await insertQuizzes(values);
        res.status(201).json({ success: true, message: `นำเข้าข้อสอบสำเร็จ ${values.length} ข้อ!` });
    } catch (error) {
        console.error("🔥 Import Quiz Error:", error);
        res.status(500).json({ success: false, message: "AI ไม่สามารถวิเคราะห์ข้อสอบได้" });
    }
};
