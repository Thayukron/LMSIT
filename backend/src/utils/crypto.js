// เข้ารหัส/ถอดรหัสข้อมูลลับ (เช่น API key ของครู) ด้วย AES-256-GCM ก่อนเก็บลงฐานข้อมูล
const crypto = require('crypto');

// กุญแจเข้ารหัส: ใช้ AI_KEY_SECRET ถ้ามี ไม่งั้นใช้ JWT_SECRET
// ⚠️ ถ้าเปลี่ยนค่านี้ภายหลัง key ที่เก็บไว้เดิมจะถอดรหัสไม่ได้ (ครูต้องใส่ key ใหม่)
const secretKey = () => crypto
    .createHash('sha256')
    .update(process.env.AI_KEY_SECRET || process.env.JWT_SECRET || '')
    .digest();

// คืนค่าเป็น "iv.tag.ciphertext" (base64)
const encrypt = (plainText) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', secretKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map(b => b.toString('base64')).join('.');
};

// คืนข้อความเดิม หรือ null ถ้าถอดไม่ได้ (ข้อมูลเสีย/กุญแจเปลี่ยน)
const decrypt = (payload) => {
    try {
        const [iv, tag, data] = String(payload).split('.').map(p => Buffer.from(p, 'base64'));
        const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(), iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch {
        return null;
    }
};

module.exports = { encrypt, decrypt };
