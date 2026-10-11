// backend/src/services/ai.service.js
const { GoogleGenAI } = require("@google/genai");
const db = require('../config/db');
const { STYLES } = require('./lessonFormats');
const { AiKeyMissingError } = require('./aiKey.service');

// ลำดับ model ที่จะลอง: ถ้าตัวแรกไม่ว่าง/โควตาหมด/ช้าเกินไป จะสลับไปตัวถัดไป
// Gemini แบบฟรีให้ ~20 ครั้ง/วัน "ต่อ model" — ใส่หลาย model = ได้โควตารวมมากขึ้น
// ตั้งค่าเองได้ใน .env: GEMINI_MODELS=gemini-3.5-flash,gemini-2.5-flash
const MODELS = (process.env.GEMINI_MODELS || 'gemini-3.5-flash,gemini-3.6-flash,gemini-2.5-flash,gemini-3.8-flash,gemini-3.5-flash-lite')
    .split(',').map(s => s.trim()).filter(Boolean);
const REQUEST_TIMEOUT_MS = 45000; // ต่อ model
const TOTAL_BUDGET_MS = 130000;   // รวมทุก model — ต้องน้อยกว่าเวลาที่ Next.js รอ Backend (150 วินาที)

// เก็บเนื้อหาแต่ละสไตล์ไว้สูงสุดกี่เวอร์ชัน (สุ่มแสดงให้หลากหลาย) — ค่าเริ่มต้น 1 เพื่อประหยัดโควตาของ key ฟรี
const MAX_VERSIONS = Math.min(3, Math.max(1, Number(process.env.AI_CACHE_VERSIONS) || 1));

// model ที่ใช้ไม่ได้ชั่วคราวต่อ key (โควตาหมด / ไม่มี model นี้) — ข้ามไปจนถึงเวลาที่กำหนด ไม่ต้องลองซ้ำให้เสียเวลา
const cooldowns = new Map(); // `${apiKey}|${model}` → timestamp ที่ลองใหม่ได้

// อ่านเวลาที่ Google บอกให้รอ (เช่น "retryDelay":"39723s") ไม่พบให้รอ 60 วินาที
const retryDelayMs = (error) => {
    const m = String(error?.message).match(/"retryDelay"\s*:\s*"(\d+)s"/);
    return m ? Number(m[1]) * 1000 : 60000;
};

// error เมื่อทุก model โควตาหมด — controller ใช้บอกผู้ใช้ให้ชัด
class AiQuotaError extends Error {
    constructor() { super('AI quota exceeded for all models'); this.code = 'AI_QUOTA'; }
}

// ตัวเชื่อมต่อ Gemini แยกตาม API key (ครูแต่ละวิชาใช้ key ของตัวเอง) — สร้างครั้งเดียวต่อ key แล้วใช้ซ้ำ
const clients = new Map();
const clientFor = (apiKey) => {
    if (!clients.has(apiKey)) {
        clients.set(apiKey, new GoogleGenAI({
            apiKey,
            // ไม่ให้ SDK ลองซ้ำเอง (ค่าเริ่มต้นลองซ้ำนานหลายนาที) — เราสลับ model เองแทน
            httpOptions: { timeout: REQUEST_TIMEOUT_MS, retryOptions: { attempts: 1 } },
        }));
    }
    return clients.get(apiKey);
};

// error ที่ลองกับ model อื่นแล้วอาจสำเร็จ (ไม่มี model นี้ / ไม่ว่าง / ล่ม / หมดเวลา / ตอบผิดรูปแบบ)
const isRetryable = (error) => {
    const status = Number(error?.status);
    return !status || [404, 408, 429].includes(status) || status >= 500;
};

/**
 * เรียก AI ให้ตอบเป็น JSON ตาม schema แล้วตรวจความถูกต้องด้วย validate()
 * ลองทีละ model ตามลำดับ จนกว่าจะได้ผลที่ใช้ได้
 */
const generateJson = async ({ apiKey, prompt, schema, temperature, validate }) => {
    if (!apiKey) throw new AiKeyMissingError();
    const deadline = Date.now() + TOTAL_BUDGET_MS;
    let lastError;
    let quotaOnly = true; // ทุก model ที่ล้มเหลวเป็นเพราะโควตาหมด/พักอยู่ใช่ไหม
    for (const model of MODELS) {
        const cooldownKey = `${apiKey}|${model}`;
        if ((cooldowns.get(cooldownKey) ?? 0) > Date.now()) continue; // พักอยู่ (โควตาหมด) ข้ามไป
        const remaining = deadline - Date.now();
        if (remaining < 5000) break; // เวลาไม่พอสำหรับ model ถัดไป
        const started = Date.now();
        try {
            const response = await clientFor(apiKey).models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json', responseJsonSchema: schema, temperature,
                    httpOptions: { timeout: Math.min(REQUEST_TIMEOUT_MS, remaining) },
                },
            });
            const data = JSON.parse(response.text);
            const invalid = validate(data);
            if (invalid) throw Object.assign(new Error(`AI ตอบผิดรูปแบบ: ${invalid}`), { status: 0 });
            console.log(`🤖 ${model} ตอบสำเร็จใน ${Date.now() - started}ms`);
            return data;
        } catch (error) {
            lastError = error;
            const status = Number(error.status);
            console.warn(`⚠️ ${model} ใช้ไม่ได้ (${error.status || error.name}: ${String(error.message).slice(0, 120)})`);
            if (status === 429) cooldowns.set(cooldownKey, Date.now() + retryDelayMs(error));
            else if (status === 404) cooldowns.set(cooldownKey, Date.now() + 24 * 3600 * 1000); // ไม่มี model นี้สำหรับ key นี้
            if (status !== 429 && status !== 404) quotaOnly = false;
            if (!isRetryable(error)) throw error; // เช่น API key ผิด (401/403) หรือคำขอผิด (400) — ลอง model อื่นก็ไม่ช่วย
        }
    }
    // ไม่มี model ไหนใช้ได้เพราะโควตาหมดทั้งหมด (หรือพักอยู่ทั้งหมด)
    if (quotaOnly) throw new AiQuotaError();
    throw lastError;
};

// ---------------------------------------------------------------
// 1. เนื้อหาบทเรียนตามสไตล์การเรียน (รูปแบบทั้งหมดอยู่ใน lessonFormats.js)
// ---------------------------------------------------------------

// ตรวจเนื้อหาของสไตล์นั้นๆ (ใช้ทั้งตอนได้จาก AI และตอนอ่านจาก cache) — คืนข้อความ error หรือ null
const styledContentError = (styleType, data) => STYLES[styleType].validate(data);

// งานสร้างเนื้อหาที่กำลังทำอยู่ (กันนักเรียนหลายคนเปิดพร้อมกันแล้ว AI สร้างซ้ำ)
const inflight = new Map();

/**
 * สร้างเนื้อหาเวอร์ชันใหม่ 1 เวอร์ชันแล้วบันทึกลง cache
 * ถ้ามีงานเดียวกันกำลังทำอยู่ จะรอผลของงานนั้นแทนการเรียก AI ซ้ำ
 */
const generateVersion = (moduleId, styleType, originalText, apiKey) => {
    const key = `${moduleId}:${styleType}`;
    if (inflight.has(key)) return inflight.get(key);

    const job = (async () => {
        console.log(`🤖 AI กำลังสร้างเนื้อหาใหม่: Module ${moduleId}, Style ${styleType}`);
        const style = STYLES[styleType];
        const data = await generateJson({
            apiKey,
            prompt: style.prompt(originalText),
            schema: style.schema,
            temperature: style.temperature, // ค่าสูง = แต่ละเวอร์ชันแตกต่างกันมากขึ้น
            validate: style.validate,
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
 * - apiKey = key ของวิชา (null ถ้ายังไม่ได้ตั้งค่า: ยังเปิด cache ได้ แต่สร้างใหม่ไม่ได้)
 */
const getStyledContent = async (moduleId, styleType, originalText, apiKey) => {
    if (!STYLES[styleType]) throw new Error(`Unknown style: ${styleType}`);

    const [rows] = await db.query(
        "SELECT id, content_body FROM content_styles WHERE module_id = ? AND style_type = ?",
        [moduleId, styleType]
    );

    const valid = [];
    for (const row of rows) {
        let data;
        try { data = JSON.parse(row.content_body); } catch { data = null; }
        if (styledContentError(styleType, data)) {
            console.warn(`🧹 ลบ cache ที่เสีย: content_styles.id=${row.id}`);
            await db.query("DELETE FROM content_styles WHERE id = ?", [row.id]);
        } else {
            valid.push(row.content_body);
        }
    }

    if (valid.length === 0) return generateVersion(moduleId, styleType, originalText, apiKey);

    if (valid.length < MAX_VERSIONS && apiKey) {
        generateVersion(moduleId, styleType, originalText, apiKey)
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
const parseQuizWithAI = async (rawText, apiKey) => {
    console.log("🤖 AI กำลังวิเคราะห์ข้อสอบจาก Raw Text...");
    return generateJson({
        apiKey,
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
const generateQuizFromContent = async (content, count, apiKey) => {
    console.log(`🤖 AI กำลังออกข้อสอบ ${count} ข้อจากเนื้อหาบทเรียน...`);
    return generateJson({
        apiKey,
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

module.exports = { getStyledContent, parseQuizWithAI, generateQuizFromContent, styledContentError, MODELS, MAX_VERSIONS };
