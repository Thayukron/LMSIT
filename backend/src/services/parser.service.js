const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const axios = require('axios');

/**
 * ดึงข้อความจากไฟล์ที่อัปโหลด (multer) ตามนามสกุลไฟล์
 */
const parseFile = async (file) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext === '.pdf') {
        const parser = new PDFParse({ data: file.buffer });
        try {
            const result = await parser.getText();
            // pdf-parse v2 ใส่บรรทัด "-- 1 of 3 --" คั่นแต่ละหน้า ไม่ใช่เนื้อหาจริง จึงตัดออก
            return result.text.replace(/^-- \d+ of \d+ --$/gm, '');
        } finally {
            await parser.destroy();
        }
    }
    if (ext === '.docx') {
        const data = await mammoth.extractRawText({ buffer: file.buffer });
        return data.value;
    }
    if (ext === '.txt') {
        return file.buffer.toString('utf8');
    }
    throw new Error(`Unsupported file type: ${ext}`);
};

/**
 * ดึงข้อความจากหน้าเว็บ
 * TODO (ระยะ 4): ป้องกัน SSRF — ห้ามดึง URL ที่ชี้ไปเครือข่ายภายใน
 */
const parseUrl = async (url) => {
    const { data } = await axios.get(url, {
        timeout: 15000,
        maxContentLength: 5 * 1024 * 1024,
        responseType: 'text',
    });
    const $ = cheerio.load(data);
    $('script, style, noscript').remove();
    // ดึงเฉพาะส่วนที่เป็นเนื้อหา (อาจต้องปรับตามโครงสร้างเว็บ)
    return $('article, main, .content').text() || $('body').text();
};

// ความยาวเนื้อหาบทเรียนสูงสุด (ตัวอักษร)
const MAX_CONTENT_LENGTH = 200000;

// รวมช่องว่าง/บรรทัดว่างที่ซ้ำกันให้อ่านง่ายขึ้น
// (แปลง \r\n เป็น \n ก่อน เพราะข้อความจาก form และไฟล์ของ Windows ขึ้นบรรทัดด้วย \r\n)
const cleanText = (text) => text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

module.exports = { parseFile, parseUrl, cleanText, MAX_CONTENT_LENGTH };
