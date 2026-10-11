# 🚀 AI-Powered Personalized LMS

ระบบจัดการการเรียนรู้ที่ครูอัปโหลดเนื้อหาเพียงครั้งเดียว แล้วผู้เรียนเลือก "สไตล์การนำเสนอ" ที่ชอบได้ โดยมี AI (Google Gemini) ปรับรูปแบบเนื้อหาให้

**Tech Stack:** Next.js 16 + Tailwind CSS 4 · Node.js + Express 5 · MySQL/MariaDB · Google Gemini

---

## 📊 สถานะการพัฒนา

| ระยะ | งาน | สถานะ |
|---|---|---|
| 0 | วางรากฐาน: โครงสร้างโปรเจกต์, package.json, schema, env | ✅ เสร็จ |
| 1 | ระบบผู้ใช้: Register/Login (JWT), แยกสิทธิ์ครู/นักเรียน | ✅ เสร็จ |
| 2 | CRUD วิชา/บทเรียน, จัดการข้อสอบ, ระบบสอบ + เก็บคะแนน, Dashboard ความก้าวหน้า | ✅ เสร็จ |
| 3 | ความเสถียรของ AI: SDK ใหม่, สลับ model อัตโนมัติ, JSON schema + ตรวจผล, cache 3 เวอร์ชัน, กันสร้างซ้ำ | ✅ เสร็จ |
| 4 | ความปลอดภัยและพร้อมใช้งานจริง: validation, rate limit, CORS, tests | ⏳ |

### มีแล้วตอนนี้
- **ดีไซน์:** หน้าแรก (landing), หน้า login แบบแบ่งจอ, ระบบดีไซน์กลาง (`frontend/src/components/ui.tsx`, ฟอนต์ Anuphan + Prompt), รองรับมือถือ — เปลี่ยนชื่อแบรนด์ได้ที่ `frontend/src/lib/brand.ts`
- **บทเรียนจาก AI:** บล็อกเนื้อหา 9 ชนิด (แนวคิด, ตัวอย่าง, เปรียบเทียบ, ขั้นตอน, เคล็ดลับ, ข้อควรระวัง, เรื่องเล่า, ภารกิจ, รู้หรือไม่) + เป้าหมายการเรียน + คำถามเช็กความเข้าใจระหว่างอ่าน + คำศัพท์ + สรุป
- สมัครสมาชิก (นักเรียน) / เข้าสู่ระบบ / ออกจากระบบ ด้วย JWT ใน httpOnly cookie
- แยกสิทธิ์ครู/นักเรียน ทั้งฝั่ง API และหน้าเว็บ (นักเรียนจะไม่ได้รับเฉลยข้อสอบ)
- **ครู:** สร้าง/แก้ไข/ลบวิชาของตัวเอง, เพิ่มบทเรียนจากไฟล์ (PDF, Word .docx, .txt ไม่เกิน 10MB) / URL / พิมพ์เอง, แก้ไขเนื้อหาบทเรียน (ล้าง cache ของ AI อัตโนมัติ)
- **นักเรียน:** ดูรายวิชา → รายการบทเรียน → เลือกสไตล์เนื้อหา 4 แบบ (เพื่อนสอนเพื่อน, สรุป, ตัวอย่าง, เกม)
- **AI:** เก็บเนื้อหาแต่ละสไตล์ไว้สูงสุด 3 เวอร์ชันแล้วสุ่มแสดง (สร้างเวอร์ชันเพิ่มเบื้องหลัง), นักเรียนหลายคนเปิดพร้อมกันเรียก AI ครั้งเดียว, ตรวจผลจาก AI ก่อนเก็บ (cache ที่เสียจะถูกสร้างใหม่อัตโนมัติ), ถ้า model ไม่ว่างจะสลับไป model สำรองเอง
- **สอบ:** ทำแบบทดสอบท้ายบทเรียน ตรวจคะแนนฝั่ง server (เกณฑ์ผ่าน 60%) ดูเฉลยหลังส่ง สอบซ้ำได้ และดูประวัติการสอบย้อนหลัง — ผลสอบเก็บสำเนาข้อสอบ ณ ตอนสอบ ครูแก้ข้อสอบภายหลังได้โดยผลเดิมไม่เปลี่ยน (ครูลองทำได้ในโหมดดูตัวอย่าง ไม่บันทึกคะแนน)
- **ความก้าวหน้า (นักเรียน):** แถบความคืบหน้าแต่ละวิชา (เข้าเรียนแล้ว / สอบผ่าน) และสถานะ + คะแนนสูงสุดของแต่ละบท
- **รายงาน (ครู):** สรุปรายบทเรียน (เข้าเรียน/สอบ/ผ่าน/คะแนนเฉลี่ย), ตารางนักเรียน × บทเรียน กดดูคำตอบรายคนได้, สถิติรายข้อ (% ตอบถูก, จำนวนที่เลือกแต่ละตัวเลือก, เตือนข้อที่ตอบผิดเยอะ)
- **ข้อสอบ (ครู):** เพิ่ม/แก้ไข/ลบรายข้อ, ให้ AI ออกข้อสอบจากเนื้อหาบทเรียน หรือแยกข้อสอบจากข้อความที่วาง — ผลจาก AI เป็น "ร่าง" ให้ครูตรวจแก้ก่อนบันทึกเสมอ

---

## 🏗️ โครงสร้างโปรเจกต์

```text
LMSIT/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── app.js           # จุดเริ่มต้นของ Server
│   │   ├── config/db.js     # MySQL connection pool
│   │   ├── controllers/     # Logic ของแต่ละ API
│   │   ├── middleware/      # ตรวจ login/role, อัปโหลดไฟล์ (Multer)
│   │   ├── routes/          # API Endpoints
│   │   ├── services/        # AI (Gemini) และ Parser (PDF/Docx/TXT/URL)
│   │   └── utils/           # ตรวจ ID และสิทธิ์เจ้าของวิชา
│   └── .env.example
├── frontend/                # Next.js (App Router) + Tailwind
│   ├── src/app/             # หน้า login, register, student/*, teacher/*
│   ├── src/components/      # Navbar, PageShell, AuthForm, teacher/*
│   ├── src/lib/             # apiFetch, TypeScript types, class ของ Tailwind ที่ใช้ซ้ำ
│   ├── src/proxy.ts         # กันหน้าที่ต้อง login และพาไปหน้าตาม role
│   └── .env.example
└── database/
    ├── schema.sql           # สร้างฐานข้อมูลและตาราง (ติดตั้งใหม่)
    ├── seed.sql             # ข้อมูลตัวอย่าง
    └── migrations/          # อัปเกรดฐานข้อมูลที่มีอยู่แล้ว
```

---

## ⚙️ วิธีติดตั้งและรัน

ต้องมี **Node.js 20+** และ **MySQL/MariaDB** (เช่น XAMPP)

### 1. ฐานข้อมูล
เปิด MySQL ใน XAMPP แล้วรัน:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql     # (ไม่บังคับ) ข้อมูลตัวอย่าง
```
หรือ Import สองไฟล์นี้ผ่าน phpMyAdmin

**มีฐานข้อมูลเดิมอยู่แล้ว?** อย่ารัน `seed.sql` ซ้ำ ให้รัน `schema.sql` (เพิ่มตารางที่ขาด) แล้วรันไฟล์ใน `database/migrations/` ที่ยังไม่เคยรันตามลำดับเลข แต่ละไฟล์รันครั้งเดียว

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env     # แล้วแก้ค่า JWT_SECRET, DB_* และ GEMINI_API_KEY (ขอ key ได้ที่ https://aistudio.google.com/apikey)
npm run dev              # รันที่ http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev              # เปิด http://localhost:3000
```

Frontend ส่งต่อทุก request `/api/*` ไปที่ Backend (`BACKEND_URL`) ผ่าน rewrites ของ Next.js หน้าเว็บกับ API จึงอยู่โดเมนเดียวกัน

### บัญชีทดลอง (จาก seed.sql)

| Role | อีเมล | รหัสผ่าน |
|---|---|---|
| ครู | `teacher@lmsit.local` | `teacher1234` |
| นักเรียน | `student@lmsit.local` | `student1234` |

> สมัครผ่านหน้าเว็บได้เฉพาะนักเรียน บัญชีครูให้เพิ่มในฐานข้อมูล (ระบบจัดการผู้ใช้จะมาในระยะถัดไป)

---

## 🔌 API Endpoints (ปัจจุบัน)

| Method | Path | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| POST | `/api/auth/register` | - | สมัครสมาชิก (`name`, `email`, `password`) |
| POST | `/api/auth/login` | - | เข้าสู่ระบบ (login ผิดได้ 10 ครั้ง/15 นาที ต่ออีเมล) |
| POST | `/api/auth/logout` | - | ออกจากระบบ |
| GET | `/api/auth/me` | login | ข้อมูลผู้ใช้ปัจจุบัน |
| GET | `/api/courses` | login | รายการวิชา (`?mine=1` = เฉพาะวิชาที่ครูคนนี้สอน) |
| POST | `/api/courses` | ครู | สร้างวิชา (`title`, `description`) |
| GET | `/api/courses/:courseId` | login | รายละเอียดวิชา + รายการบทเรียน |
| PUT / DELETE | `/api/courses/:courseId` | ครูเจ้าของ | แก้ไข / ลบวิชา (ลบบทเรียนและข้อสอบตามไปด้วย) |
| POST | `/api/courses/:courseId/modules` | ครูเจ้าของ | เพิ่มบทเรียน (form-data: `title` + `file` หรือ `url` หรือ `text`) |
| GET | `/api/modules/:moduleId` | login | ข้อมูลบทเรียน (ครูเจ้าของได้เนื้อหาต้นฉบับด้วย) |
| PUT / DELETE | `/api/modules/:moduleId` | ครูเจ้าของ | แก้ไข (`title`, `original_content`) / ลบบทเรียน |
| GET | `/api/modules/:moduleId/content?style=summary` | login | เนื้อหาที่ AI ปรับสไตล์ (`peer_to_peer`, `summary`, `example_based`, `gamified`) |
| GET | `/api/modules/:moduleId/quizzes` | login | ข้อสอบ (เฉลยส่งให้เฉพาะครูเจ้าของ) |
| POST | `/api/modules/:moduleId/quizzes` | ครูเจ้าของ | บันทึกข้อสอบ (`questions[]`) — ถ้ามีข้อผิดจะไม่บันทึกเลยสักข้อ |
| POST | `/api/modules/:moduleId/quizzes/ai-generate` | ครูเจ้าของ | ให้ AI ออกข้อสอบจากเนื้อหาบทเรียน (`count` 1-20) → คืนร่าง ไม่บันทึก |
| POST | `/api/modules/:moduleId/quizzes/ai-parse` | ครูเจ้าของ | ให้ AI แยกข้อสอบจากข้อความ (`rawText`) → คืนร่าง ไม่บันทึก |
| PUT / DELETE | `/api/quizzes/:quizId` | ครูเจ้าของ | แก้ไข / ลบข้อสอบรายข้อ |
| POST | `/api/modules/:moduleId/attempts` | login | ส่งคำตอบ (`answers: { quizId: 'a' }`) → คะแนน + เฉลย (นักเรียนบันทึกผล, ครูไม่บันทึก) |
| GET | `/api/modules/:moduleId/attempts` | login | ประวัติการสอบของตัวเองในบทเรียนนี้ |
| GET | `/api/attempts/:attemptId` | เจ้าของผลสอบ / ครูเจ้าของวิชา | ผลสอบรายครั้งพร้อมเฉลย |
| GET | `/api/courses/:courseId/progress` | login | ความก้าวหน้าของฉันในวิชา (รายบท: เข้าเรียน, คะแนนสูงสุด, ผ่าน) |
| GET | `/api/courses/:courseId/report` | ครูเจ้าของ | รายงานผลการเรียนทั้งวิชา (สรุปรายบท + รายนักเรียน) |
| GET | `/api/modules/:moduleId/quiz-stats` | ครูเจ้าของ | สถิติการตอบรายข้อ |

> ⚠️ ยังมีช่องโหว่ที่ต้องปิดในระยะ 4 เช่น SSRF ในการดึงเนื้อหาจาก URL และ rate limit ของการสมัคร/เรียก AI — ยังไม่ควรเปิดใช้งานจริงบนอินเทอร์เน็ต
