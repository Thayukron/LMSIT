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
    peer_to_peer: 'เพื่อนสอนเพื่อน: ใช้ภาษาพูดเป็นกันเองเหมือนรุ่นพี่อธิบายให้รุ่นน้องฟัง เปรียบเทียบกับเรื่องใกล้ตัว อธิบายศัพท์ยากด้วยคำง่ายๆ',
    summary: 'สรุปเน้นๆ: กระชับที่สุด ใช้ bullet point เน้นเฉพาะประเด็นสำคัญและคำนิยาม ตัดส่วนที่ไม่จำเป็นออก',
    example_based: 'เรียนจากตัวอย่างจริง: ทุกหัวข้อต้องมีตัวอย่างหรือกรณีศึกษาจากชีวิตจริง/การทำงานจริง แล้วค่อยสรุปหลักการ',
    gamified: 'ภารกิจเกม: เล่าเนื้อหาเป็นด่านหรือภารกิจ ผู้เรียนเป็นตัวละครที่ต้องเก็บความรู้เพื่อผ่านแต่ละด่าน สนุกแต่เนื้อหาต้องถูกต้องครบถ้วน',
};

const STYLED_CONTENT_SCHEMA = {
    type: 'object',
    properties: {
        headline: { type: 'string', description: 'ชื่อบทเรียนที่น่าดึงดูด' },
        intro: { type: 'string', description: 'คำนำสั้นๆ ที่สรุปภาพรวม' },
        sections: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    content: { type: 'string', description: 'เนื้อหาในรูปแบบ Markdown' },
                    image_keyword: { type: 'string', description: 'คำค้นรูปภาพภาษาอังกฤษสั้นๆ' },
                },
                required: ['title', 'content'],
            },
        },
        key_points: { type: 'array', items: { type: 'string' } },
    },
    required: ['headline', 'intro', 'sections', 'key_points'],
};

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';

// ตรวจเนื้อหาที่ AI สร้าง (ใช้ทั้งตอนได้จาก AI และตอนอ่านจาก cache) — คืนข้อความ error หรือ null
const styledContentError = (data) => {
    if (!data || typeof data !== 'object') return 'ไม่ใช่ object';
    if (!isNonEmptyString(data.headline)) return 'ไม่มี headline';
    if (typeof data.intro !== 'string') return 'ไม่มี intro';
    if (!Array.isArray(data.sections) || data.sections.length === 0) return 'ไม่มี sections';
    if (data.sections.some(s => !isNonEmptyString(s?.title) || !isNonEmptyString(s?.content))) return 'section ไม่ครบ';
    if (!Array.isArray(data.key_points) || data.key_points.some(p => typeof p !== 'string')) return 'key_points ไม่ถูกต้อง';
    return null;
};

const buildStylePrompt = (styleType, originalText) => `คุณคือผู้เชี่ยวชาญด้านการออกแบบการเรียนรู้ (Learning Designer)
จงเรียบเรียงเนื้อหาบทเรียนต่อไปนี้ใหม่เป็นภาษาไทย ตามสไตล์การเรียน:
${STYLE_GUIDES[styleType]}

เงื่อนไข:
1. ต้องครอบคลุมเนื้อหาสำคัญทั้งหมดของต้นฉบับ และห้ามเพิ่มข้อเท็จจริงที่ต้นฉบับไม่มี
2. ส่วน "content" ของแต่ละ section ใช้ Markdown ได้ (หัวข้อย่อย ตัวหนา รายการ)
3. "image_keyword" เป็นคำค้นภาษาอังกฤษสั้นๆ ที่สื่อถึงเนื้อหาส่วนนั้น
4. "key_points" คือประเด็นสำคัญ 3-6 ข้อ

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
