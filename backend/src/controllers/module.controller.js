// backend/src/controllers/module.controller.js
const db = require('../config/db');
const aiService = require('../services/ai.service');
const { toId, findOwnedModule } = require('../utils/access');
const { MAX_CONTENT_LENGTH } = require('../services/parser.service');
const { toQuizRows, normalizeQuiz, extractQuizArray } = require('../utils/quiz');
const { STYLE_IDS } = require('../services/lessonFormats');
const { getCourseApiKey, sharedKeyAllowed } = require('../services/aiKey.service');

// แปลง error จาก AI เป็นคำตอบที่ผู้ใช้เข้าใจ: ยังไม่ตั้งค่า key / key ใช้ไม่ได้ / AI ไม่ว่าง
const sendAiError = (res, error, { isTeacher, busyMessage }) => {
    if (error.code === 'AI_KEY_MISSING') {
        return res.status(503).json({
            code: 'AI_KEY_MISSING',
            message: isTeacher
                ? 'วิชานี้ยังไม่ได้ตั้งค่า API key ของ AI — ไปที่หน้าจัดการวิชา แล้วกด "ตั้งค่า AI"'
                : 'ครูผู้สอนยังไม่ได้เปิดใช้ AI สำหรับวิชานี้ กรุณาแจ้งครูผู้สอน',
        });
    }
    if (error.code === 'AI_QUOTA') {
        return res.status(503).json({
            code: 'AI_QUOTA',
            message: isTeacher
                ? 'API key ของวิชานี้ใช้ครบโควตาแล้ว (แบบฟรีได้ประมาณ 20 ครั้ง/วัน ต่อ model) — รอโควตาคืนในวันถัดไป หรือเปิดใช้แบบเสียเงินที่ Google AI Studio'
                : 'วันนี้ AI ของวิชานี้ถูกใช้งานครบโควตาแล้ว ลองใหม่พรุ่งนี้ หรือเลือกสไตล์ที่มีป้าย "พร้อมเรียน"',
        });
    }
    if ([400, 401, 403].includes(Number(error.status))) {
        return res.status(502).json({
            code: 'AI_KEY_INVALID',
            message: isTeacher
                ? 'API key ของวิชานี้ใช้งานไม่ได้ (อาจถูกยกเลิกหรือหมดโควตา) กรุณาตั้งค่า key ใหม่ในหน้าจัดการวิชา'
                : 'AI ของวิชานี้ใช้งานไม่ได้ชั่วคราว กรุณาแจ้งครูผู้สอน',
        });
    }
    return res.status(502).json({ message: busyMessage });
};
const MAX_RAW_QUIZ_TEXT = 50000;
const MAX_GENERATE_COUNT = 20;

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
                        c.title AS course_title, c.teacher_id, c.ai_api_key_enc IS NOT NULL AS has_ai_key
                 FROM modules m JOIN courses c ON c.id = m.course_id WHERE m.id = ?`,
                [moduleId]
            )
            : [[]];
        if (rows.length === 0) return res.status(404).json({ message: "ไม่พบบทเรียนนี้" });

        const { original_content, teacher_id, has_ai_key, ...publicFields } = rows[0];
        const canEdit = teacher_id === req.user.id;
        // สไตล์ที่ AI สร้างไว้แล้ว (เปิดได้ทันที ไม่ต้องรอและไม่ใช้โควตา)
        const [cached] = await db.query("SELECT DISTINCT style_type FROM content_styles WHERE module_id = ?", [moduleId]);
        res.json({
            ...publicFields,
            can_edit: canEdit,
            cached_styles: cached.map(r => r.style_type),
            ai_ready: !!has_ai_key || sharedKeyAllowed(), // สร้างเนื้อหาสไตล์ใหม่ได้หรือไม่ (cache เดิมเปิดได้เสมอ)
            ...(canEdit ? { original_content } : {}),
        });
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
        if (!STYLE_IDS.includes(style)) {
            return res.status(400).json({ message: "ไม่รู้จักสไตล์การเรียนนี้" });
        }

        const [modules] = moduleId
            ? await db.query("SELECT id, title, course_id, original_content FROM modules WHERE id = ?", [moduleId])
            : [[]];
        if (modules.length === 0) return res.status(404).json({ message: "ไม่พบบทเรียนนี้" });

        const apiKey = await getCourseApiKey(modules[0].course_id);
        const styledContent = await aiService.getStyledContent(moduleId, style, modules[0].original_content, apiKey);

        // บันทึกการเข้าเรียน (เฉพาะนักเรียน, เมื่อได้เนื้อหาสำเร็จ)
        if (req.user.role === 'STUDENT') {
            await db.query(
                `INSERT INTO module_visits (user_id, module_id) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE last_visited_at = CURRENT_TIMESTAMP`,
                [req.user.id, moduleId]
            );
        }
        res.json({
            success: true,
            title: modules[0].title,
            content: styledContent,
            styleType: style
        });
    } catch (error) {
        console.error("🔥 Style Content Error:", error);
        sendAiError(res, error, { isTeacher: req.user.role === 'TEACHER', busyMessage: "AI ไม่ว่างหรือสร้างเนื้อหาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือเลือกสไตล์อื่น" });
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

// ส่งร่างข้อสอบจาก AI กลับไปให้ครูตรวจ (ยังไม่บันทึก)
const sendQuizDrafts = (res, aiResult) => {
    const questions = extractQuizArray(aiResult).map(normalizeQuiz);
    if (questions.length === 0) {
        return res.status(422).json({ message: "AI ไม่พบข้อสอบในข้อความนี้ ลองตรวจรูปแบบข้อความแล้วลองใหม่" });
    }
    res.json({ questions });
};

/**
 * 7. ให้ AI แยกข้อสอบจากข้อความที่ครูวางมา (เฉพาะเจ้าของ)
 *    คืนร่างข้อสอบให้ครูตรวจ/แก้ก่อน แล้วค่อยบันทึกผ่าน POST /quizzes
 */
exports.aiParseQuizzes = async (req, res) => {
    try {
        const moduleRow = await findOwnedModule(req, res, req.params.moduleId);
        if (!moduleRow) return;

        const rawText = String(req.body.rawText || '').trim();
        if (!rawText) return res.status(400).json({ message: "กรุณาวางข้อความข้อสอบ" });
        if (rawText.length > MAX_RAW_QUIZ_TEXT) {
            return res.status(400).json({ message: `ข้อความยาวเกินไป (สูงสุด ${MAX_RAW_QUIZ_TEXT.toLocaleString()} ตัวอักษร)` });
        }

        sendQuizDrafts(res, await aiService.parseQuizWithAI(rawText, await getCourseApiKey(moduleRow.course_id)));
    } catch (error) {
        console.error("🔥 AI Parse Quiz Error:", error);
        sendAiError(res, error, { isTeacher: true, busyMessage: "AI ไม่สามารถวิเคราะห์ข้อสอบได้ กรุณาลองใหม่" });
    }
};

/**
 * 8. ให้ AI ออกข้อสอบจากเนื้อหาบทเรียน (เฉพาะเจ้าของ) — คืนร่างให้ครูตรวจเช่นกัน
 */
exports.aiGenerateQuizzes = async (req, res) => {
    try {
        const moduleRow = await findOwnedModule(req, res, req.params.moduleId);
        if (!moduleRow) return;

        const count = Number(req.body.count);
        if (!Number.isInteger(count) || count < 1 || count > MAX_GENERATE_COUNT) {
            return res.status(400).json({ message: `จำนวนข้อต้องอยู่ระหว่าง 1-${MAX_GENERATE_COUNT}` });
        }

        sendQuizDrafts(res, await aiService.generateQuizFromContent(moduleRow.original_content, count, await getCourseApiKey(moduleRow.course_id)));
    } catch (error) {
        console.error("🔥 AI Generate Quiz Error:", error);
        sendAiError(res, error, { isTeacher: true, busyMessage: "AI ไม่สามารถออกข้อสอบได้ กรุณาลองใหม่" });
    }
};
