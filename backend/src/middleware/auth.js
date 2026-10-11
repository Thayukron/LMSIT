const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'token';

/**
 * ตรวจว่าผู้ใช้ login แล้ว (อ่าน JWT จาก httpOnly cookie)
 * ถ้าผ่าน จะใส่ข้อมูลผู้ใช้ไว้ที่ req.user = { id, name, role }
 */
const requireAuth = (req, res, next) => {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
        return res.status(401).json({ message: "กรุณาเข้าสู่ระบบ" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.id, name: payload.name, role: payload.role };
        next();
    } catch {
        return res.status(401).json({ message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
    }
};

/**
 * จำกัดสิทธิ์ตาม role (ต้องใช้หลัง requireAuth)
 * ตัวอย่าง: router.post('/x', requireAuth, requireRole('TEACHER'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "คุณไม่มีสิทธิ์ใช้งานส่วนนี้" });
    }
    next();
};

module.exports = { requireAuth, requireRole, COOKIE_NAME };
