const path = require('path');
const multer = require('multer');

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

const upload = multer({
    storage: multer.memoryStorage(), // เก็บไฟล์ใน Memory ชั่วคราวเพื่อส่งไป Parse ต่อ
    limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: 1, fieldSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        }
        cb(null, true);
    },
});

/**
 * รับไฟล์เดียวจาก field ที่กำหนด และแปลง error ของ multer เป็นข้อความที่ผู้ใช้อ่านเข้าใจ (400)
 */
const uploadSingle = (field) => (req, res, next) => {
    upload.single(field)(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: `ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE_MB}MB)` });
        }
        if (err.code === 'LIMIT_FIELD_VALUE') {
            return res.status(400).json({ message: "เนื้อหาที่พิมพ์ยาวเกินไป" });
        }
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: "รองรับเฉพาะไฟล์ .pdf, .docx และ .txt" });
        }
        next(err);
    });
};

module.exports = { uploadSingle };
