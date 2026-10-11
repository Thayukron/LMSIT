// backend/src/controllers/course.controller.js
const db = require('../config/db');
const aiService = require('../services/ai.service');
const { parseContent } = require('../services/parser.service');

/**
 * 1. นำเข้าเนื้อหาหลัก (Admin)
 */
exports.uploadModuleContent = async (req, res) => {
    try {
        const { courseId, title, url } = req.body;
        let extractedText = "";

        if (req.file) {
            const type = req.file.originalname.endsWith('.pdf') ? 'pdf' : 'docx';
            extractedText = await parseContent(req.file, type);
        } else if (url) {
            extractedText = await parseContent(url, 'url');
        } else {
            return res.status(400).json({ message: "กรุณาอัปโหลดไฟล์หรือระบุ URL" });
        }

        const [result] = await db.query(
            "INSERT INTO modules (course_id, title, original_content) VALUES (?, ?, ?)",
            [courseId, title, extractedText]
        );

        res.status(201).json({ message: "นำเข้าเนื้อหาสำเร็จ!", moduleId: result.insertId });
    } catch (error) {
        console.error("🔥 Upload Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการนำเข้าเนื้อหา" });
    }
};

/**
 * 2. นำเข้าข้อสอบอัจฉริยะ (Smart Quiz)
 */
exports.importSmartQuiz = async (req, res) => {
    try {
        const { moduleId, rawText } = req.body;
        const quizData = await aiService.parseQuizWithAI(rawText); 
        
        if (!quizData || !Array.isArray(quizData)) {
            throw new Error("รูปแบบข้อมูลจาก AI ไม่ถูกต้อง");
        }

        const values = quizData.map(q => [
            parseInt(moduleId),
            q.question, 
            q.option_a, 
            q.option_b, 
            q.option_c, 
            q.option_d, 
            q.correct_answer
        ]);

        if (values.length > 0) {
            const query = "INSERT INTO quizzes (module_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES ?";
            await db.query(query, [values]); 
        }

        res.status(200).json({ success: true, message: `นำเข้าข้อสอบสำเร็จ ${quizData.length} ข้อ!` });
    } catch (error) {
        console.error("🔥 Import Quiz Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 3. ดึงเนื้อหาแบบเลือกสไตล์ (Student)
 */
exports.getModuleContentByStyle = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { style } = req.query;

        const [modules] = await db.query("SELECT * FROM modules WHERE id = ?", [moduleId]);
        if (modules.length === 0) return res.status(404).json({ message: "ไม่พบเนื้อหา" });

        const originalText = modules[0].original_content;
        const styledContent = await aiService.getStyledContent(moduleId, style, originalText);

        res.json({
            success: true,
            title: modules[0].title,
            content: styledContent,
            styleType: style
        });
    } catch (error) {
        console.error("🔥 Style Content Error:", error);
        res.status(500).json({ message: "ไม่สามารถสร้างเนื้อหาในสไตล์นี้ได้" });
    }
};

/**
 * 4. การจัดการรายวิชาสำหรับ Dashboard
 */

// ดึงรายวิชาทั้งหมดมาโชว์ที่หน้า Dashboard
exports.getAllModules = async (req, res) => {
    try {
        // ดึงเฉพาะ id และ title เพื่อป้องกัน Error 500 จากคอลัมน์ description ที่ไม่มีใน DB
        const [rows] = await db.query("SELECT id, title FROM modules ORDER BY id DESC");
        res.json(rows);
    } catch (error) {
        console.error("🔥 Database Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ดึงรายละเอียด Module เดียว
exports.getModuleById = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM modules WHERE id = ?", [req.params.moduleId]);
        if (rows.length === 0) return res.status(404).json({ message: "Module not found" });
        res.json(rows[0]);
    } catch (error) {
        console.error("🔥 Fetch Error:", error);
        res.status(500).json({ message: "Error fetching module details" });
    }
};

/**
 * 5. การจัดการข้อสอบ
 */

exports.getModuleQuizzes = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const [quizzes] = await db.query("SELECT * FROM quizzes WHERE module_id = ?", [moduleId]);
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: "ดึงข้อสอบไม่สำเร็จ" });
    }
};

exports.createQuiz = async (req, res) => {
    try {
        const { moduleId, questions } = req.body;
        const values = questions.map(q => [
            moduleId, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer
        ]);
        await db.query("INSERT INTO quizzes (module_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES ?", [values]);
        res.status(201).json({ message: "บันทึกข้อสอบสำเร็จ!" });
    } catch (error) {
        res.status(500).json({ message: "ไม่สามารถบันทึกข้อสอบได้" });
    }
};