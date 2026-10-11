// backend/src/services/aiKey.service.js
// จัดการ API key ของ AI รายวิชา: ครูเจ้าของวิชาใส่ key ของตัวเอง ระบบเข้ารหัสเก็บไว้
const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

// อนุญาตให้ใช้ key ส่วนกลาง (GEMINI_API_KEY ใน .env) เมื่อวิชายังไม่มี key ของตัวเองหรือไม่
const sharedKeyAllowed = () => process.env.ALLOW_SHARED_AI_KEY === 'true' && !!process.env.GEMINI_API_KEY;

// error ที่ controller ใช้บอกผู้ใช้ว่ายังไม่ได้ตั้งค่า AI
class AiKeyMissingError extends Error {
    constructor() {
        super('AI key is not configured for this course');
        this.code = 'AI_KEY_MISSING';
    }
}

/**
 * หา API key ที่ใช้กับวิชานี้: key ของวิชาก่อน ถ้าไม่มีและอนุญาตจึงใช้ key ส่วนกลาง
 * คืน string หรือ null (ยังไม่ได้ตั้งค่า)
 */
const getCourseApiKey = async (courseId) => {
    const [rows] = await db.query("SELECT ai_api_key_enc FROM courses WHERE id = ?", [courseId]);
    const encrypted = rows[0]?.ai_api_key_enc;
    if (encrypted) {
        const key = decrypt(encrypted);
        if (key) return key;
        console.warn(`⚠️ ถอดรหัส API key ของวิชา ${courseId} ไม่ได้ (AI_KEY_SECRET/JWT_SECRET อาจถูกเปลี่ยน)`);
    }
    return sharedKeyAllowed() ? process.env.GEMINI_API_KEY : null;
};

// สถานะ key ของวิชา (ไม่เปิดเผยตัว key) ใช้แสดงในหน้าตั้งค่า/ตัดสินใจฝั่งหน้าเว็บ
const getCourseKeyStatus = (courseRow) => ({
    has_key: !!courseRow.ai_api_key_enc,
    hint: courseRow.ai_api_key_hint || null,
    updated_at: courseRow.ai_api_key_updated_at || null,
    shared_fallback: sharedKeyAllowed(),
    ai_ready: !!courseRow.ai_api_key_enc || sharedKeyAllowed(),
});

/**
 * ตรวจว่า key ใช้กับ Gemini ได้จริง (เรียกรายชื่อ model — ไม่เสียค่าใช้จ่าย)
 * คืน null ถ้าใช้ได้ หรือข้อความ error
 */
const validateApiKey = async (apiKey) => {
    try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
            headers: { 'x-goog-api-key': apiKey },
            signal: AbortSignal.timeout(15000),
        });
        if (res.ok) return null;
        if ([400, 401, 403].includes(res.status)) return 'API key ไม่ถูกต้อง หรือยังไม่ได้เปิดใช้ Gemini API';
        return `ตรวจสอบ API key ไม่สำเร็จ (HTTP ${res.status}) กรุณาลองใหม่`;
    } catch {
        return 'เชื่อมต่อ Google เพื่อตรวจสอบ API key ไม่ได้ กรุณาลองใหม่';
    }
};

const saveCourseApiKey = (courseId, apiKey) => db.query(
    "UPDATE courses SET ai_api_key_enc = ?, ai_api_key_hint = ?, ai_api_key_updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [encrypt(apiKey), `••••${apiKey.slice(-4)}`, courseId]
);

const clearCourseApiKey = (courseId) => db.query(
    "UPDATE courses SET ai_api_key_enc = NULL, ai_api_key_hint = NULL, ai_api_key_updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [courseId]
);

module.exports = {
    AiKeyMissingError, getCourseApiKey, getCourseKeyStatus, validateApiKey, saveCourseApiKey, clearCourseApiKey, sharedKeyAllowed,
};
