# 🚀 AI-Powered Personalized LMS

ระบบจัดการการเรียนรู้ที่ครูอัปโหลดเนื้อหาเพียงครั้งเดียว แล้วผู้เรียนเลือก "สไตล์การนำเสนอ" ที่ชอบได้ โดยมี AI (Google Gemini) ปรับรูปแบบเนื้อหาให้

**Tech Stack:** Next.js 16 + Tailwind CSS 4 · Node.js + Express 5 · MySQL/MariaDB · Google Gemini

---

## 📊 สถานะการพัฒนา

| ระยะ | งาน | สถานะ |
|---|---|---|
| 0 | วางรากฐาน: โครงสร้างโปรเจกต์, package.json, schema, env | ✅ เสร็จ |
| 1 | ระบบผู้ใช้: Register/Login (JWT), แยกสิทธิ์ครู/นักเรียน | ✅ เสร็จ |
| 2 | CRUD วิชา/โมดูล/ข้อสอบ, หน้าครู, หน้าทำข้อสอบ, เก็บคะแนน, Dashboard | ⏳ |
| 3 | ความเสถียรของ AI: ตรวจ JSON, cache หลายเวอร์ชัน, จำกัดความยาวเนื้อหา | ⏳ |
| 4 | ความปลอดภัยและพร้อมใช้งานจริง: validation, rate limit, CORS, tests | ⏳ |

### มีแล้วตอนนี้
- สมัครสมาชิก (นักเรียน) / เข้าสู่ระบบ / ออกจากระบบ ด้วย JWT ใน httpOnly cookie
- แยกสิทธิ์ครู/นักเรียน ทั้งฝั่ง API และหน้าเว็บ (นักเรียนจะไม่ได้รับเฉลยข้อสอบ)
- นำเข้าเนื้อหาจาก PDF / Word (.docx) / URL (API)
- นำเข้าข้อสอบด้วย AI จากข้อความดิบ และสร้างข้อสอบเอง (API)
- นักเรียนดูรายการโมดูล และเลือกสไตล์เนื้อหา 4 แบบ (เพื่อนสอนเพื่อน, สรุป, ตัวอย่าง, เกม) พร้อม cache ผลจาก AI

---

## 🏗️ โครงสร้างโปรเจกต์

```text
LMSIT/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── app.js           # จุดเริ่มต้นของ Server
│   │   ├── config/db.js     # MySQL connection pool
│   │   ├── controllers/     # Logic ของแต่ละ API
│   │   ├── middleware/      # Multer (อัปโหลดไฟล์)
│   │   ├── routes/          # API Endpoints
│   │   └── services/        # AI (Gemini) และ Parser (PDF/Docx/URL)
│   └── .env.example
├── frontend/                # Next.js (App Router) + Tailwind
│   ├── src/app/             # หน้า login, register, student/*, teacher
│   ├── src/components/      # Navbar, AuthForm
│   ├── src/lib/             # apiFetch และ TypeScript types
│   ├── src/proxy.ts         # กันหน้าที่ต้อง login และพาไปหน้าตาม role
│   └── .env.example
└── database/
    ├── schema.sql           # สร้างฐานข้อมูลและตาราง
    └── seed.sql             # ข้อมูลตัวอย่าง
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

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env     # แล้วแก้ค่า JWT_SECRET, DB_* และ GEMINI_API_KEY
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
| GET | `/api/courses` | login | รายการโมดูลทั้งหมด |
| GET | `/api/courses/modules/:moduleId` | login | ข้อมูลโมดูล |
| GET | `/api/courses/modules/:moduleId/content?style=summary` | login | เนื้อหาที่ AI ปรับสไตล์ (`peer_to_peer`, `summary`, `example_based`, `gamified`) |
| GET | `/api/courses/modules/:moduleId/quizzes` | login | ข้อสอบของโมดูล |
| POST | `/api/courses/upload-module` | ครู | นำเข้าเนื้อหา (form-data: `courseId`, `title`, `file` หรือ `url`) |
| POST | `/api/courses/import-smart-quiz` | ครู | ให้ AI แยกข้อสอบจากข้อความ (`moduleId`, `rawText`) |
| POST | `/api/courses/create-quiz` | ครู | สร้างข้อสอบเอง (`moduleId`, `questions[]`) |

> ⚠️ ยังไม่ได้ปิดช่องโหว่ด้านความปลอดภัยที่เหลือ (ระยะ 4) เช่น การตรวจค่า style, SSRF ในการดึง URL, ขนาดไฟล์อัปโหลด — ยังไม่ควรเปิดใช้งานจริงบนอินเทอร์เน็ต
