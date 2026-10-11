// D:\LMS\backend\src\services\ai.service.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// ใช้ Gemini 3 Flash ตามสิทธิ์ Paid Tier ของคุณ เพื่อความรวดเร็วและแม่นยำที่สุด
const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash" 
});

/**
 * 1. แปลงเนื้อหาบทเรียนตามสไตล์ที่เลือก
 */
const getStyledContent = async (moduleId, styleType, originalText) => {
    try {
        // --- ส่วนเช็ค Cache (สำคัญมาก: ป้องกันการเจนซ้ำ) ---
        const [cached] = await db.query(
            "SELECT content_body FROM content_styles WHERE module_id = ? AND style_type = ?",
            [moduleId, styleType]
        );

        if (cached.length > 0) {
            console.log(`📦 ใช้เนื้อหาจาก Cache: Module ${moduleId}, Style ${styleType}`);
            return cached[0].content_body;
        }

        console.log(`🤖 AI กำลังสร้างเนื้อหาใหม่: Module ${moduleId}, Style ${styleType}`);

        const prompt = `คุณคือผู้เชี่ยวชาญด้านการศึกษา (Learning Designer) 
        จงแปลงเนื้อหาที่กำหนดให้เป็นรูปแบบ JSON ภาษาไทย 
        ตามสไตล์การเรียนรู้แบบ: ${styleType}
        
        เนื้อหาต้นฉบับ: ${originalText}

        เงื่อนไขการตอบกลับ:
        1. ตอบเป็น JSON ที่ถูกต้องตามโครงสร้างด้านล่างเท่านั้น
        2. ส่วน "content" ใน sections ให้ใช้รูปแบบ Markdown (ถ้ามีหัวข้อย่อยหรือเน้นคำ)
        3. "image_keyword" ต้องเป็นคำค้นหาภาษาอังกฤษสั้นๆ ที่สื่อถึงเนื้อหานั้นเพื่อนำไปดึงรูปจาก Unsplash

        โครงสร้าง JSON:
        {
          "headline": "ชื่อบทเรียนที่น่าดึงดูด",
          "intro": "คำนำสั้นๆ ที่สรุปภาพรวม",
          "sections": [
            { 
              "title": "หัวข้อหลักของส่วนนี้", 
              "content": "เนื้อหาเชิงลึกที่ปรับตามสไตล์แล้ว", 
              "image_keyword": "tech, education, business, etc." 
            }
          ],
          "key_points": ["ประเด็นสำคัญที่ 1", "ประเด็นสำคัญที่ 2"]
        }`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.8 // เพิ่มความคิดสร้างสรรค์ให้แต่ละสไตล์แตกต่างกัน
            }
        });

        const aiResponse = result.response.text();
        
        // บันทึกลง DB เพื่อใช้เป็น Cache ในครั้งหน้า
        await db.query(
            "INSERT INTO content_styles (module_id, style_type, content_body) VALUES (?, ?, ?)",
            [moduleId, styleType, aiResponse]
        );

        return aiResponse;
    } catch (error) {
        console.error("❌ Gemini getStyledContent Error:", error);
        throw error;
    }
};

/**
 * 2. ฟังก์ชันวิเคราะห์ข้อสอบ (ใช้ใน importSmartQuiz ของ Controller)
 */
const parseQuizWithAI = async (rawText) => {
    try {
        console.log("🤖 AI กำลังวิเคราะห์ข้อสอบจาก Raw Text...");
        
        const prompt = `จงสกัดข้อมูลข้อสอบจากเนื้อหาต่อไปนี้ให้เป็น JSON Array:
        
        เนื้อหา: ${rawText}

        โครงสร้างที่ต้องการ:
        [
          {
            "question": "คำถาม?",
            "option_a": "ตัวเลือก A",
            "option_b": "ตัวเลือก B",
            "option_c": "ตัวเลือก C",
            "option_d": "ตัวเลือก D",
            "correct_answer": "a" (ตอบเฉพาะ a, b, c หรือ d เท่านั้น)
          }
        ]`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.2 // ตั้งค่าให้ต่ำเพื่อให้ข้อมูลมีความแม่นยำสูง (ไม่มโนตัวเลือก)
            }
        });

        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("❌ Gemini parseQuizWithAI Error:", error);
        throw new Error("AI ไม่สามารถวิเคราะห์ข้อสอบได้");
    }
};

module.exports = { getStyledContent, parseQuizWithAI };