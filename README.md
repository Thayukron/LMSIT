# 🚀 AI-Powered Personalized LMS (Next.js + Node.js + MySQL)

ระบบจัดการการเรียนรู้อัจฉริยะที่ช่วยให้ครูผู้สอนสามารถอัปโหลดเนื้อหาเพียงครั้งเดียว แต่ผู้เรียนสามารถเลือก "สไตล์การนำเสนอ" ที่ตัวเองชอบได้ โดยมี AI (GPT-4o) เป็นผู้ช่วยปรับเปลี่ยนรูปแบบเนื้อหา

## 🌟 ฟีเจอร์หลัก (Key Features)

### สำหรับครู (Teacher Role)
- **Course Management:** สร้างวิชาและหน่วยการเรียนรู้ (Modules)
- **Content Import:** รองรับการอัปโหลดเนื้อหาผ่าน PDF, Word, Text และ URL
- **Quiz Creator:** ระบบสร้างข้อสอบปรนัย (Multiple Choice)
- **Progress Tracking:** ดูคะแนนและความก้าวหน้าของผู้เรียนรายบุคคล

### สำหรับผู้เรียน (Student Role)
- **Personalized Content:** เลือกสไตล์เนื้อหาได้ 5 แบบ (เพื่อนสอนเพื่อน, สรุป, ตัวอย่าง, ถาม-ตอบ, เกม)
- **AI Content Caching:** ระบบสุ่มเนื้อหาจาก Cache 3 เวอร์ชั่นต่อ 1 สไตล์ (ลดการใช้ API และเพิ่มความหลากหลาย)
- **Interactive Quiz:** ทำข้อสอบชุดเดียวกันไม่ว่าจะเลือกเรียนสไตล์ไหน
- **Dashboard:** แสดงความก้าวหน้าในการเรียนและคะแนนที่ทำได้

---

## 🏗️ โครงสร้างไฟล์ (Project Structure)

```text
/
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── config/         # การตั้งค่า Database (MySQL) และ OpenAI
│   │   ├── controllers/    # ส่วนควบคุม Logic (Auth, Content, Quiz)
│   │   ├── middleware/     # การจัดการไฟล์ (Multer) และ Auth Guard
│   │   ├── models/         # Database Schema (Sequelize/Prisma)
│   │   ├── services/       # AI Engine (OpenAI), Parser (PDF/Docx/URL)
│   │   └── routes/         # API Endpoints
│   └── .env                # เก็บ API Keys และ DB Config
│
├── frontend/               # Next.js + Tailwind CSS
│   ├── src/
│   │   ├── app/            # App Router (Pages: /teacher, /student)
│   │   ├── components/     # UI Components (QuizCard, StyleSelector, ProgressBar)
│   │   ├── hooks/          # API Calling logic
│   │   └── store/          # State management (Zustand/Context)
│   └── tailwind.config.js
└── database/
    └── schema.sql          # ไฟล์สำหรับ Init ฐานข้อมูล MySQL

คู่หูเขียนโค้ด
จัดไปครับ! การทำไฟล์ README.md ที่ชัดเจนจะเปรียบเสมือนแผนที่นำทาง (Roadmap) ให้กับโปรเจ็กต์ของเรา ผมจะร่างโครงสร้างทั้งหมดโดยรวมฟีเจอร์ที่คุณต้องการ (AI Caching, Multi-style content, Quiz System) ไว้ในนี้เลยครับ

📄 แฟ้มโครงการ: README.md
Markdown
# 🚀 AI-Powered Personalized LMS (Next.js + Node.js + MySQL)

ระบบจัดการการเรียนรู้อัจฉริยะที่ช่วยให้ครูผู้สอนสามารถอัปโหลดเนื้อหาเพียงครั้งเดียว แต่ผู้เรียนสามารถเลือก "สไตล์การนำเสนอ" ที่ตัวเองชอบได้ โดยมี AI (GPT-4o) เป็นผู้ช่วยปรับเปลี่ยนรูปแบบเนื้อหา

## 🌟 ฟีเจอร์หลัก (Key Features)

### สำหรับครู (Teacher Role)
- **Course Management:** สร้างวิชาและหน่วยการเรียนรู้ (Modules)
- **Content Import:** รองรับการอัปโหลดเนื้อหาผ่าน PDF, Word, Text และ URL
- **Quiz Creator:** ระบบสร้างข้อสอบปรนัย (Multiple Choice)
- **Progress Tracking:** ดูคะแนนและความก้าวหน้าของผู้เรียนรายบุคคล

### สำหรับผู้เรียน (Student Role)
- **Personalized Content:** เลือกสไตล์เนื้อหาได้ 5 แบบ (เพื่อนสอนเพื่อน, สรุป, ตัวอย่าง, ถาม-ตอบ, เกม)
- **AI Content Caching:** ระบบสุ่มเนื้อหาจาก Cache 3 เวอร์ชั่นต่อ 1 สไตล์ (ลดการใช้ API และเพิ่มความหลากหลาย)
- **Interactive Quiz:** ทำข้อสอบชุดเดียวกันไม่ว่าจะเลือกเรียนสไตล์ไหน
- **Dashboard:** แสดงความก้าวหน้าในการเรียนและคะแนนที่ทำได้

---

## 🏗️ โครงสร้างไฟล์ (Project Structure)

```text
/
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── config/         # การตั้งค่า Database (MySQL) และ OpenAI
│   │   ├── controllers/    # ส่วนควบคุม Logic (Auth, Content, Quiz)
│   │   ├── middleware/     # การจัดการไฟล์ (Multer) และ Auth Guard
│   │   ├── models/         # Database Schema (Sequelize/Prisma)
│   │   ├── services/       # AI Engine (OpenAI), Parser (PDF/Docx/URL)
│   │   └── routes/         # API Endpoints
│   └── .env                # เก็บ API Keys และ DB Config
│
├── frontend/               # Next.js + Tailwind CSS
│   ├── src/
│   │   ├── app/            # App Router (Pages: /teacher, /student)
│   │   ├── components/     # UI Components (QuizCard, StyleSelector, ProgressBar)
│   │   ├── hooks/          # API Calling logic
│   │   └── store/          # State management (Zustand/Context)
│   └── tailwind.config.js
└── database/
    └── schema.sql          # ไฟล์สำหรับ Init ฐานข้อมูล MySQL


🗄️ โครงสร้างฐานข้อมูล (Database Schema)
users: เก็บข้อมูลผู้ใช้งาน (Roles: TEACHER, STUDENT)

courses: ข้อมูลวิชาหลัก

modules: หน่วยการเรียนรู้ (เก็บเนื้อหาหลัก original_text)

content_cache: เก็บเนื้อหาที่ AI เจน (module_id, style_type, version_number, body_text)

quizzes: โจทย์ข้อสอบ (module_id, question, options_json, correct_answer)

user_progress: ประวัติการเรียนและคะแนนสอบ

🛠️ เทคโนโลยีที่ใช้ (Tech Stack)
Frontend: Next.js 14+, Tailwind CSS, Lucide React (Icons)

Backend: Node.js, Express

Database: MySQL

AI Integration: OpenAI API (Model: gpt-4o)

Libraries:

pdf-parse (สำหรับอ่าน PDF)

mammoth (สำหรับอ่าน Word)

cheerio (สำหรับดึงเนื้อหาจาก URL)"# LMSIT" 
