const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const axios = require('axios');

const parseContent = async (source, type) => {
    try {
        if (type === 'pdf') {
            const data = await pdf(source.buffer); // source คือ buffer จาก multer
            return data.text;
        } 
        else if (type === 'docx') {
            const data = await mammoth.extractRawText({ buffer: source.buffer });
            return data.value;
        } 
        else if (type === 'url') {
            const { data } = await axios.get(source);
            const $ = cheerio.load(data);
            // ดึงเฉพาะส่วนที่เป็นเนื้อหา (อาจต้องปรับตามโครงสร้างเว็บ)
            return $('article, main, .content').text() || $('body').text();
        } 
        else {
            return source.toString(); // กรณีเป็น Text ธรรมดา
        }
    } catch (error) {
        console.error("Parsing Error:", error);
        throw new Error("Failed to extract content");
    }
};

module.exports = { parseContent };