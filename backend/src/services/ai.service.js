// backend/src/services/ai.service.js
const { GoogleGenAI } = require("@google/genai");
const db = require('../config/db');

// ลำดับ model ที่จะลอง: ถ้าตัวแรกไม่ว่าง (503/429) หรือช้าเกินไป จะสลับไปตัวถัดไป
// ตั้งค่าเองได้ใน .env เช่น GEMINI_MODELS=gemini-2.5-flash,gemini-3.8-flash
const MODELS = (process.env.GEMINI_MODELS || 'gemini-2.5-flash,gemini-3.8-flash,gemini-2.5-flash-lite')
    .split(',').map(s => s.trim()).filter(Boolean);
// ต่อ model — ลองครบ 3 model ได้ภายในเวลาที่ Next.js รอ Backend (150 วินาที)
const REQUEST_TIMEOUT_MS = 45000;

// เก็บเนื้อหาแต่ละสไตล์ไว้สูงสุดกี่เวอร์ชัน (สุ่มแสดง เพื่อให้นักเรียนได้เนื้อหาหลากหลาย)
const MAX_VERSIONS = 3;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    // ไม่ให้ SDK ลองซ้ำเอง (ค่าเริ่มต้นลองซ้ำนานหลายนาที) — เราสลับ model เองแทน
    httpOptions: { timeout: REQUEST_TIMEOUT_MS, retryOptions: { attempts: 1 } },
});

// error ที่ลองกับ model อื่นแล้วอาจสำเร็จ (ไม่มี model นี้ / ไม่ว่าง / ล่ม / หมดเวลา / ตอบผิดรูปแบบ)
const isRetryable = (error) => {
    const status = Number(error?.status);
    return !status || [404, 408, 429].includes(status) || status >= 500;
};

/**
 * เรียก AI ให้ตอบเป็น JSON ตาม schema แล้วตรวจความถูกต้องด้วย validate()
 * ลองทีละ model ตามลำดับ จนกว่าจะได้ผลที่ใช้ได้
 */
const generateJson = async ({ prompt, schema, temperature, validate }) => {
    let lastError;
    for (const model of MODELS) {
        const started = Date.now();
        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature },
            });
            const data = JSON.parse(response.text);
            const invalid = validate(data);
            if (invalid) throw Object.assign(new Error(`AI ตอบผิดรูปแบบ: ${invalid}`), { status: 0 });
            console.log(`🤖 ${model} ตอบสำเร็จใน ${Date.now() - started}ms`);
            return data;
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ ${model} ใช้ไม่ได้ (${error.status || error.name}: ${String(error.message).slice(0, 120)})`);
            if (!isRetryable(error)) break; // เช่น API key ผิด (401/403) หรือคำขอผิด (400) — ลอง model อื่นก็ไม่ช่วย
        }
    }
    throw lastError;
};

// ---------------------------------------------------------------
// 1. เนื้อหาบทเรียนตามสไตล์การเรียน
// ---------------------------------------------------------------

// คำอธิบายแต่ละสไตล์ให้ AI (key ต้องตรงกับ ALLOWED_STYLES ใน module.controller)
const STYLE_GUIDES = {
    peer_to_peer: `สไตล์ "เพื่อนติวเพื่อน"
- น้ำเสียง: รุ่นพี่ใจดีที่เก่งเรื่องนี้ มานั่งติวให้ตัวต่อตัว ใช้ "เรา" "นาย/เธอ" ได้ เป็นกันเองแต่สุภาพ มีมุกเบาๆ ได้
- ชอบเปรียบเทียบเรื่องยากกับของใกล้ตัว (มือถือ เกม ร้านกาแฟ ห้องเรียน) ใช้บล็อก analogy อย่างน้อย 1 บล็อก
- อธิบายศัพท์เทคนิคทันทีด้วยภาษาบ้านๆ และบอกว่า "จุดที่คนมักงง" คืออะไร (บล็อก warning หรือ tip)`,
    summary: `สไตล์ "สรุปเน้นๆ"
- น้ำเสียง: โค้ชที่เคารพเวลาผู้เรียน กระชับ ตรงประเด็น
- แต่ละบล็อกสั้น ใช้ bullet point และ **ตัวหนา** กับคำสำคัญ ไม่เกิน 4-6 บรรทัดต่อบล็อก
- เน้นบล็อก concept, steps, fact และ key_terms ให้ครบทุกคำนิยามสำคัญ`,
    example_based: `สไตล์ "เรียนจากเคสจริง"
- น้ำเสียง: ผู้เชี่ยวชาญที่เล่าประสบการณ์จากการทำงานจริง
- เปิดแต่ละหัวข้อด้วยสถานการณ์/เคสที่จับต้องได้ (บล็อก example หรือ story) แล้วค่อยสรุปหลักการ (บล็อก concept)
- ตัวอย่างต้องเฉพาะเจาะจง มีชื่อคน สถานที่ ตัวเลข ให้เห็นภาพ`,
    gamified: `สไตล์ "ภารกิจเกม"
- น้ำเสียง: ผู้บรรยายเกมผจญภัย ผู้เรียนคือ "ผู้กล้า" ที่ต้องผ่านด่าน เก็บไอเทมความรู้
- ตั้งชื่อบล็อกเป็นด่าน เช่น "ด่าน 1: ..." ใช้บล็อก mission เป็นหลัก แทรก story และ tip (เป็น "ไอเทมลับ")
- สนุกและมีพลัง แต่เนื้อหาความรู้ต้องถูกต้องครบถ้วน ห้ามให้เรื่องเล่ากลบเนื้อหา`,
};

// ชนิดบล็อกเนื้อหา — หน้าเว็บแสดงแต่ละชนิดด้วยสีและไอคอนต่างกัน
const BLOCK_TYPES = ['concept', 'example', 'analogy', 'steps', 'tip', 'warning', 'story', 'mission', 'fact'];

const STYLED_CONTENT_SCHEMA = {
    type: 'object',
    properties: {
        headline: { type: 'string', description: 'ชื่อบทเรียนที่ดึงดูด ไม่เกิน 60 ตัวอักษร' },
        emoji: { type: 'string', description: 'อีโมจิ 1 ตัวที่แทนบทเรียนนี้' },
        intro: { type: 'string', description: 'คำโปรยเปิดเรื่อง 2-3 ประโยค ชวนให้อยากอ่านต่อ (hook)' },
        estimated_minutes: { type: 'integer', description: 'เวลาอ่านโดยประมาณ (นาที)' },
        objectives: { type: 'array', items: { type: 'string' }, description: 'เรียนจบแล้วจะทำอะไรได้ 2-4 ข้อ' },
        sections: {
            type: 'array',
            description: '4-8 บล็อก ใช้ชนิดบล็อกให้หลากหลาย',
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: BLOCK_TYPES },
                    emoji: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string', description: 'Markdown: ย่อหน้าสั้น, **ตัวหนา**, bullet, ตาราง ได้' },
                    highlight: { type: 'string', description: 'ประโยคเด็ด 1 ประโยคที่ควรจำจากบล็อกนี้ (ไม่บังคับ)' },
                },
                required: ['type', 'emoji', 'title', 'content'],
            },
        },
        quick_checks: {
            type: 'array',
            description: 'คำถามเช็กความเข้าใจระหว่างอ่าน 2-3 ข้อ',
            items: {
                type: 'object',
                properties: {
                    after_section: { type: 'integer', description: 'แสดงหลังบล็อกลำดับที่เท่าไร (เริ่มที่ 0)' },
                    question: { type: 'string' },
                    choices: { type: 'array', items: { type: 'string' }, description: '3-4 ตัวเลือก' },
                    answer_index: { type: 'integer', description: 'ตำแหน่งคำตอบที่ถูกใน choices (เริ่มที่ 0)' },
                    explanation: { type: 'string', description: 'อธิบายสั้นๆ ว่าทำไมคำตอบนี้ถูก' },
                },
                required: ['after_section', 'question', 'choices', 'answer_index', 'explanation'],
            },
        },
        key_terms: {
            type: 'array',
            items: {
                type: 'object',
                properties: { term: { type: 'string' }, meaning: { type: 'string' } },
                required: ['term', 'meaning'],
            },
        },
        key_points: { type: 'array', items: { type: 'string' }, description: 'สรุปสิ่งที่ต้องจำ 3-5 ข้อ' },
        closing: { type: 'string', description: 'ข้อความปิดท้าย 1-2 ประโยค ชวนไปทำแบบทดสอบ' },
    },
    required: ['headline', 'emoji', 'intro', 'estimated_minutes', 'objectives', 'sections', 'quick_checks', 'key_terms', 'key_points', 'closing'],
};

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const isStringArray = (v) => Array.isArray(v) && v.every(x => typeof x === 'string');

// ตรวจเนื้อหาที่ AI สร้าง (ใช้ทั้งตอนได้จาก AI และตอนอ่านจาก cache) — คืนข้อความ error หรือ null
// cache รูปแบบเก่าจะไม่ผ่าน แล้วถูกสร้างใหม่อัตโนมัติ
const styledContentError = (data) => {
    if (!data || typeof data !== 'object') return 'ไม่ใช่ object';
    if (!isNonEmptyString(data.headline) || !isNonEmptyString(data.intro)) return 'ไม่มี headline/intro';
    if (!isStringArray(data.objectives) || !isStringArray(data.key_points)) return 'objectives/key_points ไม่ถูกต้อง';
    if (!Array.isArray(data.sections) || data.sections.length < 2) return 'sections น้อยเกินไป';
    if (data.sections.some(s => !BLOCK_TYPES.includes(s?.type) || !isNonEmptyString(s.title) || !isNonEmptyString(s.content))) {
        return 'section ไม่ครบหรือชนิดไม่ถูกต้อง';
    }
    if (!Array.isArray(data.quick_checks) || data.quick_checks.some(q =>
        !isNonEmptyString(q?.question) || !isStringArray(q.choices) || q.choices.length < 2 ||
        !Number.isInteger(q.answer_index) || q.answer_index < 0 || q.answer_index >= q.choices.length)) {
        return 'quick_checks ไม่ถูกต้อง';
    }
    if (!Array.isArray(data.key_terms) || data.key_terms.some(t => !isNonEmptyString(t?.term) || !isNonEmptyString(t.meaning))) {
        return 'key_terms ไม่ถูกต้อง';
    }
    return null;
};

const buildStylePrompt = (styleType, originalText) => `คุณคือนักออกแบบการเรียนรู้ระดับมืออาชีพ ที่เขียนบทเรียนออนไลน์ภาษาไทยได้สนุก อ่านง่าย และจำได้จริง
จงเปลี่ยนเนื้อหาต้นฉบับด้านล่างให้เป็นบทเรียนที่น่าเรียน ตามสไตล์นี้:

${STYLE_GUIDES[styleType]}

หลักการเขียนที่ต้องทำทุกสไตล์:
1. ความถูกต้องมาก่อน: ครอบคลุมเนื้อหาสำคัญทั้งหมดของต้นฉบับ ห้ามแต่งข้อเท็จจริงที่ต้นฉบับไม่มี (ตัวอย่าง/การเปรียบเทียบที่แต่งขึ้นเพื่ออธิบายทำได้)
2. ห้ามเขียนเป็นก้อนข้อความยาว: ย่อหน้าละ 1-3 ประโยค ใช้ bullet, **ตัวหนา**กับคำสำคัญ และตาราง Markdown เมื่อเปรียบเทียบหลายสิ่ง
3. เปิดเรื่องด้วยคำถามหรือสถานการณ์ที่ทำให้ผู้เรียนอยากรู้ ไม่ใช่ประโยคนิยามแห้งๆ
4. ใช้ชนิดบล็อกให้หลากหลายอย่างน้อย 4 ชนิด:
   concept = อธิบายแนวคิดหลัก | example = ตัวอย่างจริง | analogy = เปรียบเทียบกับสิ่งใกล้ตัว
   steps = ขั้นตอน/ลำดับ (ใช้ list มีเลข) | tip = เคล็ดลับ | warning = จุดที่มักเข้าใจผิด
   story = เรื่องเล่าสั้น | mission = ภารกิจ/ด่าน | fact = รู้หรือไม่? ข้อมูลน่าสนใจ
5. ทุกบล็อกมีอีโมจิที่เข้ากับหัวข้อ และ highlight เป็นประโยคเด็ดที่ควรจำ (ถ้ามี)
6. quick_checks ถามความเข้าใจ ไม่ใช่ถามจำคำ และวางไว้หลังบล็อกที่เกี่ยวข้อง (choices ไม่ต้องใส่ ก. ข. หรือ A. B. นำหน้า)
7. key_terms คือศัพท์สำคัญพร้อมความหมายภาษาง่าย
8. ภาษาไทยเป็นธรรมชาติ ไม่แปลตรงตัว ไม่ใช้คำฟุ่มเฟือย

เนื้อหาต้นฉบับ:
"""
${originalText}
"""`;

// งานสร้างเนื้อหาที่กำลังทำอยู่ (กันนักเรียนหลายคนเปิดพร้อมกันแล้ว AI สร้างซ้ำ)
const inflight = new Map();

/**
 * สร้างเนื้อหาเวอร์ชันใหม่ 1 เวอร์ชันแล้วบันทึกลง cache
 * ถ้ามีงานเดียวกันกำลังทำอยู่ จะรอผลของงานนั้นแทนการเรียก AI ซ้ำ
 */
const generateVersion = (moduleId, styleType, originalText) => {
    const key = `${moduleId}:${styleType}`;
    if (inflight.has(key)) return inflight.get(key);

    const job = (async () => {
        console.log(`🤖 AI กำลังสร้างเนื้อหาใหม่: Module ${moduleId}, Style ${styleType}`);
        const data = await generateJson({
            prompt: buildStylePrompt(styleType, originalText),
            schema: STYLED_CONTENT_SCHEMA,
            temperature: 0.8, // เพิ่มความคิดสร้างสรรค์ให้แต่ละเวอร์ชันแตกต่างกัน
            validate: styledContentError,
        });
        const body = JSON.stringify(data);

        // ครูอาจแก้เนื้อหาระหว่างที่ AI กำลังสร้าง — ถ้าต้นฉบับเปลี่ยนแล้ว ไม่บันทึกเนื้อหาเก่าลง cache
        const [still] = await db.query("SELECT 1 FROM modules WHERE id = ? AND original_content = ?", [moduleId, originalText]);
        if (still.length === 0) return body;

        try {
            await db.query(
                `INSERT INTO content_styles (module_id, style_type, version_number, content_body)
                 SELECT ?, ?, COALESCE(MAX(version_number), 0) + 1, ?
                 FROM content_styles WHERE module_id = ? AND style_type = ?
                 HAVING COUNT(*) < ?`,
                [moduleId, styleType, body, moduleId, styleType, MAX_VERSIONS]
            );
        } catch (error) {
            // อีก server บันทึกเวอร์ชันเลขเดียวกันไปก่อน — ข้ามได้ เนื้อหานี้ยังส่งให้ผู้ใช้ได้
            if (error.code !== 'ER_DUP_ENTRY') throw error;
        }
        return body;
    })().finally(() => inflight.delete(key));

    inflight.set(key, job);
    return job;
};

/**
 * เนื้อหาบทเรียนตามสไตล์ (คืนเป็น JSON string)
 * - มี cache แล้ว: สุ่ม 1 เวอร์ชันส่งทันที และถ้ายังไม่ครบ MAX_VERSIONS จะสร้างเวอร์ชันใหม่เพิ่มเบื้องหลัง
 * - ยังไม่มี cache: รอ AI สร้างเวอร์ชันแรก
 * - cache ที่เสีย (JSON ผิดรูปแบบ) จะถูกลบทิ้งแล้วสร้างใหม่
 */
const getStyledContent = async (moduleId, styleType, originalText) => {
    if (!STYLE_GUIDES[styleType]) throw new Error(`Unknown style: ${styleType}`);

    const [rows] = await db.query(
        "SELECT id, content_body FROM content_styles WHERE module_id = ? AND style_type = ?",
        [moduleId, styleType]
    );

    const valid = [];
    for (const row of rows) {
        let data;
        try { data = JSON.parse(row.content_body); } catch { data = null; }
        if (styledContentError(data)) {
            console.warn(`🧹 ลบ cache ที่เสีย: content_styles.id=${row.id}`);
            await db.query("DELETE FROM content_styles WHERE id = ?", [row.id]);
        } else {
            valid.push(row.content_body);
        }
    }

    if (valid.length === 0) return generateVersion(moduleId, styleType, originalText);

    if (valid.length < MAX_VERSIONS) {
        generateVersion(moduleId, styleType, originalText)
            .catch(error => console.warn(`⚠️ สร้างเวอร์ชันเพิ่มเบื้องหลังไม่สำเร็จ: ${error.message}`));
    }
    console.log(`📦 ใช้เนื้อหาจาก Cache: Module ${moduleId}, Style ${styleType} (${valid.length} เวอร์ชัน)`);
    return valid[Math.floor(Math.random() * valid.length)];
};

// ---------------------------------------------------------------
// 2-3. ข้อสอบ (ผลเป็น "ร่าง" ให้ครูตรวจก่อนบันทึก)
// ---------------------------------------------------------------

const QUIZ_LIST_SCHEMA = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            question: { type: 'string' },
            option_a: { type: 'string' },
            option_b: { type: 'string' },
            option_c: { type: 'string' },
            option_d: { type: 'string' },
            correct_answer: { type: 'string', enum: ['a', 'b', 'c', 'd'] },
        },
        required: ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'],
    },
};

const quizListError = (data) => (Array.isArray(data) ? null : 'ไม่ใช่ array');

/**
 * 2. แยกข้อสอบจากข้อความที่ครูวางมา
 */
const parseQuizWithAI = async (rawText) => {
    console.log("🤖 AI กำลังวิเคราะห์ข้อสอบจาก Raw Text...");
    return generateJson({
        prompt: `จงแยกข้อสอบปรนัยทุกข้อจากข้อความต่อไปนี้ออกมาเป็นรายการ
- คัดลอกคำถามและตัวเลือกตามต้นฉบับ (ตัดเลขข้อ และตัวอักษรนำหน้าตัวเลือก เช่น ก. ข. A) ออก)
- ตัวเลือกที่ 1-4 ให้เป็น option_a ถึง option_d ตามลำดับ (ก=a, ข=b, ค=c, ง=d)
- correct_answer ให้ใช้เฉลยจากข้อความ ถ้าข้อความไม่มีเฉลย ให้เลือกคำตอบที่ถูกต้องที่สุด
- ถ้าไม่พบข้อสอบเลย ให้ตอบเป็น array ว่าง

ข้อความ:
"""
${rawText}
"""`,
        schema: QUIZ_LIST_SCHEMA,
        temperature: 0.2, // ต่ำเพื่อให้คัดลอกตามต้นฉบับ ไม่แต่งเพิ่ม
        validate: quizListError,
    });
};

/**
 * 3. ให้ AI ออกข้อสอบปรนัยจากเนื้อหาบทเรียน
 */
const generateQuizFromContent = async (content, count) => {
    console.log(`🤖 AI กำลังออกข้อสอบ ${count} ข้อจากเนื้อหาบทเรียน...`);
    return generateJson({
        prompt: `คุณคือครูผู้เชี่ยวชาญด้านการวัดผล
จงออกข้อสอบปรนัย 4 ตัวเลือก จำนวน ${count} ข้อ เป็นภาษาไทย จากเนื้อหาบทเรียนต่อไปนี้

เงื่อนไข:
1. ถามเฉพาะสิ่งที่อยู่ในเนื้อหา ห้ามถามเรื่องที่เนื้อหาไม่ได้กล่าวถึง
2. มีคำตอบถูกเพียงข้อเดียว ตัวเลือกที่ผิดต้องดูสมเหตุสมผล
3. กระจายตำแหน่งคำตอบที่ถูก (a, b, c, d) ให้หลากหลาย
4. ไม่ใช้ตัวเลือกแบบ "ถูกทุกข้อ" หรือ "ไม่มีข้อใดถูก"

เนื้อหาบทเรียน:
"""
${content}
"""`,
        schema: QUIZ_LIST_SCHEMA,
        temperature: 0.4,
        validate: (data) => quizListError(data) || (data.length === 0 ? 'ไม่มีข้อสอบ' : null),
    });
};

module.exports = { getStyledContent, parseQuizWithAI, generateQuizFromContent, styledContentError, MODELS };
