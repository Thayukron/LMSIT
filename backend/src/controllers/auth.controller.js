// backend/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { COOKIE_NAME } = require('../middleware/auth');

const TOKEN_TTL_DAYS = 7;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ใช้เทียบรหัสผ่านตอนไม่พบอีเมล เพื่อให้เวลาตอบกลับใกล้เคียงกัน (กันการเดาว่าอีเมลไหนมีในระบบ)
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

const toPublicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

const setAuthCookie = (res, user) => {
    const token = jwt.sign(
        { id: user.id, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: `${TOKEN_TTL_DAYS}d` }
    );
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true, // JavaScript ฝั่งหน้าเว็บอ่านไม่ได้ ป้องกันการขโมย token ผ่าน XSS
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    });
};

/**
 * 1. สมัครสมาชิก (สมัครเองได้เฉพาะนักเรียน บัญชีครูต้องสร้างโดยผู้ดูแลระบบ)
 */
exports.register = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!name || name.length > 100) {
            return res.status(400).json({ message: "กรุณากรอกชื่อ (ไม่เกิน 100 ตัวอักษร)" });
        }
        if (!EMAIL_PATTERN.test(email) || email.length > 255) {
            return res.status(400).json({ message: "รูปแบบอีเมลไม่ถูกต้อง" });
        }
        // bcrypt ใช้ได้สูงสุด 72 bytes
        if (password.length < 8 || Buffer.byteLength(password) > 72) {
            return res.status(400).json({ message: "รหัสผ่านต้องมีความยาว 8-72 ตัวอักษร" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'STUDENT')",
            [name, email, passwordHash]
        );

        const user = { id: result.insertId, name, email, role: 'STUDENT' };
        setAuthCookie(res, user);
        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ!", user: toPublicUser(user) });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
        }
        console.error("🔥 Register Error:", error);
        res.status(500).json({ message: "สมัครสมาชิกไม่สำเร็จ" });
    }
};

/**
 * 2. เข้าสู่ระบบ
 */
exports.login = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = rows[0];
        const passwordOk = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

        if (!user || !passwordOk) {
            return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        setAuthCookie(res, user);
        res.json({ message: "เข้าสู่ระบบสำเร็จ!", user: toPublicUser(user) });
    } catch (error) {
        console.error("🔥 Login Error:", error);
        res.status(500).json({ message: "เข้าสู่ระบบไม่สำเร็จ" });
    }
};

/**
 * 3. ออกจากระบบ
 */
exports.logout = (req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
    res.json({ message: "ออกจากระบบแล้ว" });
};

/**
 * 4. ข้อมูลผู้ใช้ที่ login อยู่
 */
exports.me = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name, email, role FROM users WHERE id = ?", [req.user.id]);
        if (rows.length === 0) return res.status(401).json({ message: "ไม่พบบัญชีผู้ใช้" });
        res.json({ user: toPublicUser(rows[0]) });
    } catch (error) {
        console.error("🔥 Me Error:", error);
        res.status(500).json({ message: "ดึงข้อมูลผู้ใช้ไม่สำเร็จ" });
    }
};
