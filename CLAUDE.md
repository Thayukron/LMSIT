# CLAUDE.md — บันทึกโปรเจกต์ LMSIT

ไฟล์นี้ Claude Code อ่านอัตโนมัติทุกครั้งที่เริ่มแชตใหม่ในโฟลเดอร์นี้ ใช้เก็บ "สิ่งที่ต้องรู้ก่อนทำงานต่อ"
(ไม่ใช่ประวัติแชตทั้งหมด) — **อัปเดตส่วน "สถานะ" และ "งานที่ค้าง" ทุกครั้งที่ทำงานเสร็จแต่ละรอบ**

## เจ้าของโปรเจกต์และวิธีทำงานร่วมกัน
- สื่อสารเป็น **ภาษาไทย** ทั้งคำตอบ, ข้อความใน UI และคอมเมนต์ในโค้ด
- ชอบให้ **วิเคราะห์/รายงาน/แนะนำก่อน** แล้วค่อยลงมือ และทำ **ทีละขั้น** สรุปผลทุกขั้น
- Repo: https://github.com/Thayukron/LMSIT (branch `main`) — เจ้าของอนุญาตให้ commit + push ผลงานแต่ละขั้น
- ⚠️ ห้าม commit `backend/.env` / `frontend/.env.local` และตรวจด้วย `git grep --cached -E "AIzaSy[A-Za-z0-9_-]{30,}"` ก่อน commit ทุกครั้ง
- ไอเดียอนาคต (ยังไม่ทำ): เสนอระบบให้ **กรมพัฒนาฝีมือแรงงาน** — วิดีโอห้ามข้าม, ตรวจการออกจากหน้าจอ, ใบประกาศ (ดูหัวข้อ "งานที่ค้าง")

## ระบบคืออะไร
LMS ที่ครูอัปโหลดเนื้อหาครั้งเดียว แล้ว AI (Google Gemini) เปลี่ยนเป็นบทเรียน **10 สไตล์** ให้นักเรียนเลือกเรียนแบบที่ชอบ
มีแบบทดสอบ, ประวัติผลสอบ, Dashboard ความก้าวหน้า และรายงานสำหรับครู

**Stack:** Next.js 16 (App Router, React 19, Tailwind 4) · Express 5 · MySQL/MariaDB (XAMPP) · `@google/genai`

```
backend/src/
  app.js                    # จุดเริ่ม server, ต้องมี JWT_SECRET ≥ 32 ตัว
  controllers/              # auth, course, module, quiz, attempt, progress
  services/ai.service.js    # เรียก Gemini: สลับ model, cooldown โควตา, cache เนื้อหา, กันสร้างซ้ำ
  services/lessonFormats.js # ทะเบียน 10 สไตล์: schema + validator + prompt ของแต่ละรูปแบบ
  services/aiKey.service.js # API key รายวิชา (เข้ารหัส), validate กับ Google
  utils/                    # access (สิทธิ์เจ้าของ), quiz (ตรวจข้อสอบ, PASS_PERCENT=60), crypto (AES-256-GCM)
frontend/src/
  app/                      # landing (/), login, register, student/*, teacher/*
  components/ui.tsx         # ชุดคอมโพเนนต์กลาง (Button, Card, Badge, Alert, ProgressRing ...)
  components/lesson/*       # ตัวแสดงเนื้อหาแต่ละรูปแบบ (LessonReader, StoryReader, ChatReader, FlashcardDeck, MindMapView, PracticeGames)
  lib/brand.ts              # ชื่อแบรนด์ + ธีมสี (DEFAULT_THEME)
  lib/visual.ts             # LEARNING_STYLES (ต้องตรงกับ lessonFormats.js), สีปกวิชา
  proxy.ts                  # (= middleware เดิม) กันหน้าที่ต้อง login, พาไปหน้าตาม role
database/schema.sql + seed.sql + migrations/00X_*.sql
```

## การตัดสินใจสำคัญ (อย่าเปลี่ยนโดยไม่เข้าใจเหตุผล)
- **Auth:** JWT ใน httpOnly cookie; Frontend เรียก `/api/*` ที่โดเมนตัวเอง แล้ว Next.js **rewrites** ส่งต่อไป Backend (`BACKEND_URL`) จึงไม่ต้องเปิด CORS
- **Rate limit login นับต่ออีเมล ไม่ใช่ต่อ IP** — เพราะทุก request ผ่าน Next ก่อน backend เห็นทุกคนเป็น IP เดียว (Next ไม่ส่ง X-Forwarded-For ที่เชื่อถือได้)
- `next.config.ts`: `proxyClientMaxBodySize: 12mb` (Next ตัด body ที่ 10MB) และ `proxyTimeout: 150_000` (ค่าเริ่มต้น 30 วิ ไม่พอสำหรับ AI)
- **AI key รายวิชา:** ครูใส่ key ของตัวเองในหน้าจัดการวิชา (`PUT /api/courses/:id/ai-key`) ตรวจกับ Google ก่อนบันทึก, เข้ารหัสด้วย `AI_KEY_SECRET`, ไม่ส่ง key กลับหน้าเว็บ (แสดงแค่ `••••abcd`)
  `ALLOW_SHARED_AI_KEY=false` (ค่าเริ่มต้น) = ทุกวิชาต้องมี key เอง; เนื้อหาที่ cache แล้วเปิดได้แม้ไม่มี key
- **โควตา Gemini ฟรี ≈ 20 ครั้ง/วัน ต่อ model** → ใช้หลาย model (`GEMINI_MODELS`), จำ model ที่โควตาหมดแล้วข้ามจนถึง retryDelay, `AI_CACHE_VERSIONS=1` เป็นค่าเริ่มต้น
  error ที่แยกบอกผู้ใช้: `AI_KEY_MISSING` (503), `AI_QUOTA` (503), key ใช้ไม่ได้ `AI_KEY_INVALID` (502), AI ไม่ว่าง (502)
- **ห้ามใช้** `gemini-3-flash` (ไม่มีจริง), `gemini-2.5-flash-lite` (ปิดสำหรับผู้ใช้ใหม่), `gemini-3.7-flash` (ไม่ตอบ) — ตรวจรายชื่อจริงได้ด้วย `GET https://generativelanguage.googleapis.com/v1beta/models`
- **ผลจาก AI ต้องผ่าน validator เสมอ** (ทั้งตอนได้จาก AI และตอนอ่าน cache) cache ที่ไม่ผ่านจะถูกลบแล้วสร้างใหม่ → เปลี่ยน schema ได้โดย cache เก่าสร้างใหม่อัตโนมัติ
- AI ออกข้อสอบ/แยกข้อสอบ = **คืนเป็นร่าง** ให้ครูตรวจก่อนบันทึก ไม่บันทึกตรง
- ผลสอบเก็บ **สำเนาคำถาม/ตัวเลือก/เฉลย ณ วันสอบ** (`quiz_attempt_answers`) — ครูแก้/ลบข้อสอบภายหลังได้โดยผลเดิมไม่เปลี่ยน; ตรวจคะแนนฝั่ง server เท่านั้น; ครูลองทำ = โหมดดูตัวอย่าง ไม่บันทึก
- วิชามีเจ้าของ (`courses.teacher_id`) — แก้ไข/ดูเฉลย/รายงานได้เฉพาะเจ้าของ
- ธีมสี: CSS variables ต่อธีมใน `globals.css` (`--brand-*`, `--accent-*`, `--warm-*`) map เป็น Tailwind ผ่าน `@theme inline`; สีที่มีความหมาย (ชนิดบล็อก, สไตล์การเรียน) ไม่เปลี่ยนตามธีม
- ห้ามใส่แอนิเมชันวนไม่หยุด (`animate-float` ถูกลบเพราะเจ้าของบอกว่า "ไอคอนสั่น")

## กับดักที่เคยเจอ
- **Next 16 + `cacheComponents`**: หน้า client ที่ใช้ `useParams()`/`usePathname()` ใน route ที่มี `[param]` ต้องมี `loading.tsx` (Suspense) และคอมโพเนนต์ใน layout ที่ใช้ `usePathname()` ต้องครอบ `<Suspense>`; ห้าม `new Date()` ระหว่าง prerender
- Next 16: `middleware` เปลี่ยนชื่อเป็น `proxy.ts`; ดูเอกสารจริงที่ `frontend/node_modules/next/dist/docs/` ก่อนใช้ API ใหม่
- **แก้โค้ดผ่าน bash heredoc/`sed` แล้ว `\` หาย** (เช่น regex `\s` กลายเป็น `s`) → ใช้ Edit tool หรือเขียนสคริปต์เป็นไฟล์ แล้วตรวจซ้ำทุกครั้ง
- `mysql` CLI บน Git Bash แสดง/รับภาษาไทยเพี้ยน → ทดสอบภาษาไทยผ่าน Node หรืออ่าน `HEX()`
- FormData/ไฟล์จาก Windows ขึ้นบรรทัดด้วย `\r\n` (`cleanText` แปลงให้แล้ว)
- `node --watch` ไม่รีสตาร์ตเมื่อแก้ `.env` → ต้องรีสตาร์ต backend เอง
- ฟอนต์ Prompt/Anuphan เป็นแบบไม่มีหัว "น" ดูเหมือน "u" → ตัวอักษรย่อในรูปโปรไฟล์ใช้ Tahoma/Leelawadee UI

## วิธีรัน (dev)
1. MySQL (XAMPP) → `database/schema.sql` + `seed.sql` (ฐานข้อมูลเดิม: รัน `migrations/` ที่ยังไม่เคยรันตามลำดับ)
2. `backend/.env` จาก `.env.example` (JWT_SECRET, AI_KEY_SECRET, DB_*) → `cd backend && npm run dev` (พอร์ต 5000)
3. `cd frontend && npm run dev` (พอร์ต 3000) — บัญชีทดลอง `teacher@lmsit.local / teacher1234`, `student@lmsit.local / student1234`
4. ครูต้องตั้ง Gemini API key ในหน้าจัดการวิชา → "ตั้งค่า AI" ก่อน AI จะสร้างเนื้อหาใหม่ได้

## วิธีทดสอบที่ใช้มาตลอด (ยังไม่มี automated test ใน repo)
- ฐานข้อมูลทดสอบแยก: รัน `mysqld` ของ XAMPP ด้วย datadir ชั่วคราวที่พอร์ต 3399 (ไม่แตะฐานข้อมูลจริงของเจ้าของ)
- backend/frontend ชุดทดสอบที่พอร์ต 5099/3099, สคริปต์ E2E เป็น Node `fetch` (ผ่าน 152+ กรณี: auth, CRUD, ข้อสอบ, ผลสอบ, รายงาน, AI)
- จำลอง AI: preload `node -r fake-ai.js` แทน `require.cache` ของ `ai.service.js`
- ตรวจหน้าตาจริง: Edge headless + Chrome DevTools Protocol ถ่ายภาพหน้าจอทุกหน้า (desktop 1440 + mobile 390) แล้วดูภาพก่อนส่งงาน
- ➜ ระยะ 4 ควรย้ายสคริปต์เหล่านี้เข้า repo เป็น `npm test`

## สถานะ (อัปเดตล่าสุด 2026-10-11)
- ✅ ระยะ 0 วางรากฐาน · ✅ ระยะ 1 ระบบผู้ใช้ · ✅ ระยะ 2 วิชา/บทเรียน/ข้อสอบ/สอบ/Dashboard · ✅ ระยะ 3 ความเสถียรของ AI
- ✅ ออกแบบ UI ใหม่ทั้งระบบ + ธีมสี 6 แบบ
- ✅ รูปแบบการเรียนใหม่: เด็ก 10 ขวบ, นิทาน, การ์ตูนแชต, แฟลชการ์ด, ผังความคิด, เกมฝึกฝน (จับคู่/เรียงลำดับ/เติมคำ) — รวม 10 สไตล์ใน 3 หมวด
- ✅ API key ของ AI รายวิชา (migration 006)

## งานที่ค้าง (เรียงตามที่ตกลงกับเจ้าของ)
1. 🎧 **พอดแคสต์** — Gemini เขียนบท 2 พิธีกร + Gemini TTS (model `*-tts` มีใน key) ต้องมีที่เก็บไฟล์เสียง; ทดลองคุณภาพเสียงไทยก่อน
2. ภาพประกอบจาก AI (model `*-image`) / ให้ครูแนบวิดีโอ YouTube
3. AI ติวเตอร์ถามตอบจากเนื้อหาบทเรียน
4. แบบทดสอบ "คุณเรียนรู้แบบไหน?" แนะนำสไตล์ + XP/streak/เหรียญ
5. **ระยะ 4 ความปลอดภัย:** SSRF ใน `parseUrl` (ห้าม URL เครือข่ายภายใน), rate limit การเรียก AI ต่อผู้ใช้ และการสมัคร, automated tests, คู่มือ deploy
6. ไอเดีย กพร.: วิดีโอห้ามข้าม (บันทึกเวลาดูฝั่ง server), ตรวจการสลับแท็บ, คำถามแทรกในวิดีโอ, ใบประกาศ + QR ตรวจสอบ, PDPA
