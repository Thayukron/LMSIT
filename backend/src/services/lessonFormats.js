// backend/src/services/lessonFormats.js
// รูปแบบเนื้อหาที่ AI สร้างให้ผู้เรียนเลือก — แต่ละสไตล์มี schema (บังคับรูปแบบคำตอบ AI), ตัวตรวจผล และ prompt
// ⚠️ id ของสไตล์ต้องตรงกับ LEARNING_STYLES ใน frontend/src/lib/visual.ts

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const isStringArray = (v) => Array.isArray(v) && v.every(x => typeof x === 'string');

// ---------- ส่วนที่ใช้ร่วมกัน ----------

const QUICK_CHECK_SCHEMA = {
    type: 'object',
    properties: {
        after_section: { type: 'integer', description: 'แสดงหลังบล็อก/ตอนที่เท่าไร (เริ่มที่ 0)' },
        question: { type: 'string' },
        choices: { type: 'array', items: { type: 'string' }, description: '3-4 ตัวเลือก ไม่ต้องใส่ ก. ข. หรือ A. B. นำหน้า' },
        answer_index: { type: 'integer', description: 'ตำแหน่งคำตอบที่ถูกใน choices (เริ่มที่ 0)' },
        explanation: { type: 'string', description: 'อธิบายสั้นๆ ว่าทำไมคำตอบนี้ถูก' },
    },
    required: ['after_section', 'question', 'choices', 'answer_index', 'explanation'],
};

const quickChecksError = (checks) => {
    if (!Array.isArray(checks)) return 'quick_checks ไม่ใช่ array';
    const bad = checks.some(q => !isNonEmptyString(q?.question) || !isStringArray(q.choices) || q.choices.length < 2 ||
        !Number.isInteger(q.answer_index) || q.answer_index < 0 || q.answer_index >= q.choices.length);
    return bad ? 'quick_checks ไม่ถูกต้อง' : null;
};

// ส่วนหัวที่ทุกรูปแบบมี
const HEADER_PROPS = {
    headline: { type: 'string', description: 'ชื่อบทเรียนที่ดึงดูด ไม่เกิน 60 ตัวอักษร' },
    emoji: { type: 'string', description: 'อีโมจิ 1 ตัวที่แทนบทเรียนนี้' },
    intro: { type: 'string', description: 'คำเกริ่น 1-3 ประโยค ชวนให้อยากเรียนต่อ' },
    estimated_minutes: { type: 'integer', description: 'เวลาเรียนโดยประมาณ (นาที)' },
};
const HEADER_REQUIRED = ['headline', 'emoji', 'intro', 'estimated_minutes'];

const headerError = (d) => {
    if (!d || typeof d !== 'object') return 'ไม่ใช่ object';
    if (!isNonEmptyString(d.headline) || !isNonEmptyString(d.intro)) return 'ไม่มี headline/intro';
    return null;
};

const BASE_RULES = `หลักการที่ต้องทำเสมอ:
1. ความถูกต้องมาก่อน: ครอบคลุมเนื้อหาสำคัญของต้นฉบับ ห้ามแต่งข้อเท็จจริงที่ต้นฉบับไม่มี (ตัวอย่าง/ตัวละคร/สถานการณ์ที่แต่งเพื่ออธิบายทำได้)
2. ภาษาไทยเป็นธรรมชาติ อ่านสนุก ประโยคสั้น ไม่ใช้คำฟุ่มเฟือย ใช้ **ตัวหนา** กับคำสำคัญ
3. ตัวเลือกคำถามไม่ต้องใส่ ก. ข. หรือ A. B. นำหน้า`;

const sourceBlock = (text) => `เนื้อหาต้นฉบับ:\n"""\n${text}\n"""`;

// ---------- 1. บทเรียนแบบบล็อก (lesson) ----------

const BLOCK_TYPES = ['concept', 'example', 'analogy', 'steps', 'tip', 'warning', 'story', 'mission', 'fact'];

const LESSON_SCHEMA = {
    type: 'object',
    properties: {
        ...HEADER_PROPS,
        objectives: { type: 'array', items: { type: 'string' }, description: 'เรียนจบแล้วจะทำอะไรได้ 2-4 ข้อ' },
        sections: {
            type: 'array',
            description: '4-8 บล็อก ใช้ชนิดบล็อกให้หลากหลาย',
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: BLOCK_TYPES },
                    emoji: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string', description: 'Markdown: ย่อหน้าสั้น, **ตัวหนา**, bullet, ตาราง ได้' },
                    highlight: { type: 'string', description: 'ประโยคเด็ด 1 ประโยคที่ควรจำจากบล็อกนี้ (ไม่บังคับ)' },
                },
                required: ['type', 'emoji', 'title', 'content'],
            },
        },
        quick_checks: { type: 'array', description: 'คำถามเช็กความเข้าใจระหว่างอ่าน 2-3 ข้อ', items: QUICK_CHECK_SCHEMA },
        key_terms: {
            type: 'array',
            items: { type: 'object', properties: { term: { type: 'string' }, meaning: { type: 'string' } }, required: ['term', 'meaning'] },
        },
        key_points: { type: 'array', items: { type: 'string' }, description: 'สรุปสิ่งที่ต้องจำ 3-5 ข้อ' },
        closing: { type: 'string', description: 'ข้อความปิดท้าย 1-2 ประโยค ชวนไปทำแบบทดสอบ' },
    },
    required: [...HEADER_REQUIRED, 'objectives', 'sections', 'quick_checks', 'key_terms', 'key_points', 'closing'],
};

const lessonError = (d) => headerError(d)
    || (!isStringArray(d.objectives) || !isStringArray(d.key_points) ? 'objectives/key_points ไม่ถูกต้อง' : null)
    || (!Array.isArray(d.sections) || d.sections.length < 2 ? 'sections น้อยเกินไป' : null)
    || (d.sections.some(s => !BLOCK_TYPES.includes(s?.type) || !isNonEmptyString(s.title) || !isNonEmptyString(s.content)) ? 'section ไม่ถูกต้อง' : null)
    || quickChecksError(d.quick_checks)
    || (!Array.isArray(d.key_terms) || d.key_terms.some(t => !isNonEmptyString(t?.term) || !isNonEmptyString(t.meaning)) ? 'key_terms ไม่ถูกต้อง' : null);

const lessonPrompt = (guide) => (text) => `คุณคือนักออกแบบการเรียนรู้มืออาชีพ ที่เขียนบทเรียนออนไลน์ภาษาไทยได้สนุก อ่านง่าย และจำได้จริง
จงเปลี่ยนเนื้อหาต้นฉบับให้เป็นบทเรียนตามสไตล์นี้:

${guide}

${BASE_RULES}
4. ห้ามเขียนเป็นก้อนข้อความยาว: ย่อหน้าละ 1-3 ประโยค ใช้ bullet และตาราง Markdown เมื่อเปรียบเทียบหลายสิ่ง
5. เปิดเรื่องด้วยคำถามหรือสถานการณ์ที่ทำให้อยากรู้ ไม่ใช่ประโยคนิยามแห้งๆ
6. ใช้ชนิดบล็อกให้หลากหลายอย่างน้อย 4 ชนิด:
   concept = แนวคิดหลัก | example = ตัวอย่างจริง | analogy = เปรียบเทียบกับสิ่งใกล้ตัว | steps = ขั้นตอน (list มีเลข)
   tip = เคล็ดลับ | warning = จุดที่มักเข้าใจผิด | story = เรื่องเล่าสั้น | mission = ภารกิจ/ด่าน | fact = รู้หรือไม่?
7. ทุกบล็อกมีอีโมจิที่เข้ากับหัวข้อ และ highlight เป็นประโยคเด็ดที่ควรจำ (ถ้ามี)
8. quick_checks ถามความเข้าใจ ไม่ใช่ถามจำคำ และวางไว้หลังบล็อกที่เกี่ยวข้อง

${sourceBlock(text)}`;

const LESSON_GUIDES = {
    peer_to_peer: `สไตล์ "เพื่อนติวเพื่อน"
- น้ำเสียง: รุ่นพี่ใจดีที่เก่งเรื่องนี้ มานั่งติวให้ตัวต่อตัว เป็นกันเองแต่สุภาพ มีมุกเบาๆ ได้
- ชอบเปรียบเทียบเรื่องยากกับของใกล้ตัว (มือถือ เกม ร้านกาแฟ) ใช้บล็อก analogy อย่างน้อย 1 บล็อก
- อธิบายศัพท์เทคนิคด้วยภาษาบ้านๆ และบอกว่า "จุดที่คนมักงง" คืออะไร`,
    summary: `สไตล์ "สรุปเน้นๆ"
- น้ำเสียง: โค้ชที่เคารพเวลาผู้เรียน กระชับ ตรงประเด็น
- แต่ละบล็อกสั้น ใช้ bullet และ **ตัวหนา** ไม่เกิน 4-6 บรรทัดต่อบล็อก
- เน้นบล็อก concept, steps, fact และ key_terms ให้ครบทุกคำนิยามสำคัญ`,
    example_based: `สไตล์ "เรียนจากเคสจริง"
- น้ำเสียง: ผู้เชี่ยวชาญที่เล่าประสบการณ์จากการทำงานจริง
- เปิดแต่ละหัวข้อด้วยสถานการณ์ที่จับต้องได้ (บล็อก example หรือ story) แล้วค่อยสรุปหลักการ (บล็อก concept)
- ตัวอย่างต้องเฉพาะเจาะจง มีชื่อคน สถานที่ ตัวเลข ให้เห็นภาพ`,
    gamified: `สไตล์ "ภารกิจผจญภัย"
- น้ำเสียง: ผู้บรรยายเกมผจญภัย ผู้เรียนคือ "ผู้กล้า" ที่ต้องผ่านด่าน เก็บไอเทมความรู้
- ตั้งชื่อบล็อกเป็นด่าน เช่น "ด่าน 1: ..." ใช้บล็อก mission เป็นหลัก แทรก story และ tip (เป็น "ไอเทมลับ")
- สนุกและมีพลัง แต่เนื้อหาความรู้ต้องถูกต้องครบถ้วน`,
    eli10: `สไตล์ "อธิบายแบบเด็ก 10 ขวบ"
- น้ำเสียง: ครูใจดีอธิบายให้เด็กประถมเข้าใจ ใช้คำง่ายที่สุด ประโยคสั้นมาก
- ทุกศัพท์ยากต้องแปลเป็นคำง่าย และเปรียบเทียบกับของเล่น ขนม การ์ตูน หรือชีวิตประจำวันของเด็ก
- ใช้บล็อก analogy และ example เยอะ หลีกเลี่ยงตารางและรายละเอียดเชิงเทคนิคที่ไม่จำเป็น`,
};

// ---------- 2. นิทาน (story) ----------

const STORY_SCHEMA = {
    type: 'object',
    properties: {
        ...HEADER_PROPS,
        characters: {
            type: 'array', description: 'ตัวละคร 2-4 ตัว',
            items: { type: 'object', properties: { name: { type: 'string' }, emoji: { type: 'string' }, description: { type: 'string' } }, required: ['name', 'emoji', 'description'] },
        },
        chapters: {
            type: 'array', description: 'นิทาน 3-6 ตอน',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    emoji: { type: 'string' },
                    scene: { type: 'string', description: 'เนื้อเรื่องตอนนี้ (Markdown) 2-5 ย่อหน้าสั้น มีบทพูดของตัวละครได้' },
                    lesson: { type: 'string', description: 'ความรู้ที่ได้จากตอนนี้ 1-2 ประโยค' },
                },
                required: ['title', 'emoji', 'scene', 'lesson'],
            },
        },
        quick_checks: { type: 'array', description: 'คำถามชวนคิดระหว่างเรื่อง 2-3 ข้อ (after_section = ลำดับตอน)', items: QUICK_CHECK_SCHEMA },
        moral: { type: 'string', description: 'ข้อคิด/บทสรุปความรู้ของนิทาน' },
        key_points: { type: 'array', items: { type: 'string' }, description: 'สิ่งที่ต้องจำ 3-5 ข้อ' },
    },
    required: [...HEADER_REQUIRED, 'characters', 'chapters', 'quick_checks', 'moral', 'key_points'],
};

const storyError = (d) => headerError(d)
    || (!Array.isArray(d.characters) || d.characters.length === 0 || d.characters.some(c => !isNonEmptyString(c?.name)) ? 'characters ไม่ถูกต้อง' : null)
    || (!Array.isArray(d.chapters) || d.chapters.length < 2 || d.chapters.some(c => !isNonEmptyString(c?.title) || !isNonEmptyString(c.scene)) ? 'chapters ไม่ถูกต้อง' : null)
    || quickChecksError(d.quick_checks)
    || (!isStringArray(d.key_points) ? 'key_points ไม่ถูกต้อง' : null);

const storyPrompt = (text) => `คุณคือนักเขียนนิทานเพื่อการศึกษา ที่ทำให้ความรู้ยากๆ กลายเป็นเรื่องเล่าที่ติดหู
จงเขียน "นิทาน" ภาษาไทยที่สอนเนื้อหาต้นฉบับทั้งหมดผ่านการผจญภัยของตัวละคร

รูปแบบ:
- สร้างตัวละคร 2-4 ตัวที่มีบุคลิกชัดเจน (เช่น เด็กขี้สงสัย กับผู้รู้) ตั้งชื่อไทยที่จำง่าย
- แบ่งเป็น 3-6 ตอน แต่ละตอนตัวละครเจอปัญหาหรือคำถาม แล้วค้นพบความรู้ 1 เรื่องจากต้นฉบับ
- มีบทพูดของตัวละคร (ใช้ **ชื่อ:** "ข้อความ") ฉากที่เห็นภาพ และจังหวะลุ้นให้อยากอ่านตอนต่อไป
- ท้ายแต่ละตอนสรุปความรู้ที่ได้ใน lesson และจบเรื่องด้วยข้อคิดที่เชื่อมกับเนื้อหา

${BASE_RULES}

${sourceBlock(text)}`;

// ---------- 3. การ์ตูนแชต (chat) ----------

const CHAT_SCHEMA = {
    type: 'object',
    properties: {
        ...HEADER_PROPS,
        characters: {
            type: 'array', description: 'ผู้ร่วมแชต 2-3 คน',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', enum: ['a', 'b', 'c'] },
                    name: { type: 'string' },
                    emoji: { type: 'string' },
                    role: { type: 'string', description: 'เช่น ครู, นักเรียนขี้สงสัย' },
                },
                required: ['id', 'name', 'emoji', 'role'],
            },
        },
        messages: {
            type: 'array', description: 'ข้อความในแชต 14-30 ข้อความ',
            items: {
                type: 'object',
                properties: {
                    speaker: { type: 'string', enum: ['a', 'b', 'c'] },
                    kind: { type: 'string', enum: ['text', 'tip', 'question', 'example'], description: 'tip = สรุปสำคัญ, question = ถามชวนคิด, example = ยกตัวอย่าง' },
                    text: { type: 'string', description: 'ข้อความสั้น 1-3 ประโยค ใช้ **ตัวหนา** และอีโมจิได้' },
                },
                required: ['speaker', 'kind', 'text'],
            },
        },
        key_points: { type: 'array', items: { type: 'string' }, description: 'สรุปท้ายแชต 3-5 ข้อ' },
    },
    required: [...HEADER_REQUIRED, 'characters', 'messages', 'key_points'],
};

const chatError = (d) => {
    const base = headerError(d);
    if (base) return base;
    if (!Array.isArray(d.characters) || d.characters.length < 2) return 'characters น้อยเกินไป';
    const ids = new Set(d.characters.map(c => c?.id));
    if (ids.size !== d.characters.length || d.characters.some(c => !isNonEmptyString(c.name))) return 'characters ไม่ถูกต้อง';
    if (!Array.isArray(d.messages) || d.messages.length < 6) return 'messages น้อยเกินไป';
    if (d.messages.some(m => !ids.has(m?.speaker) || !isNonEmptyString(m.text))) return 'messages ไม่ถูกต้อง';
    return isStringArray(d.key_points) ? null : 'key_points ไม่ถูกต้อง';
};

const chatPrompt = (text) => `คุณคือนักเขียนบทการ์ตูนเพื่อการศึกษา
จงเขียน "บทสนทนาในแชต" ภาษาไทยแบบแชตกลุ่มในแอปส่งข้อความ ที่สอนเนื้อหาต้นฉบับทั้งหมด

รูปแบบ:
- ผู้ร่วมแชต 2-3 คน เช่น ครูใจดี (a) กับนักเรียนขี้สงสัย (b) และเพื่อนจอมป่วน (c) ตั้งชื่อไทยและอีโมจิประจำตัว
- นักเรียนถามคำถามที่คนทั่วไปสงสัยจริงๆ ครูตอบสั้นๆ ทีละประเด็น มีการเปรียบเทียบและยกตัวอย่าง
- ข้อความละ 1-3 ประโยคเหมือนแชตจริง ใช้อีโมจิพอประมาณ มีมุกเบาๆ ได้
- ใช้ kind: tip กับข้อความที่สรุปความรู้สำคัญ, question กับคำถามชวนคิด, example กับการยกตัวอย่าง
- ครอบคลุมเนื้อหาทั้งหมดตามลำดับที่เข้าใจง่าย

${BASE_RULES}

${sourceBlock(text)}`;

// ---------- 4. แฟลชการ์ด (flashcards) ----------

const FLASHCARDS_SCHEMA = {
    type: 'object',
    properties: {
        ...HEADER_PROPS,
        cards: {
            type: 'array', description: 'แฟลชการ์ด 8-15 ใบ',
            items: {
                type: 'object',
                properties: {
                    emoji: { type: 'string' },
                    front: { type: 'string', description: 'ด้านหน้า: คำถามหรือคำศัพท์สั้นๆ' },
                    back: { type: 'string', description: 'ด้านหลัง: คำตอบ/คำอธิบายกระชับ 1-3 ประโยค' },
                    hint: { type: 'string', description: 'คำใบ้สั้นๆ (ไม่บังคับ)' },
                },
                required: ['emoji', 'front', 'back'],
            },
        },
    },
    required: [...HEADER_REQUIRED, 'cards'],
};

const flashcardsError = (d) => headerError(d)
    || (!Array.isArray(d.cards) || d.cards.length < 4 ? 'cards น้อยเกินไป' : null)
    || (d.cards.some(c => !isNonEmptyString(c?.front) || !isNonEmptyString(c.back)) ? 'cards ไม่ถูกต้อง' : null);

const flashcardsPrompt = (text) => `คุณคือติวเตอร์ที่ทำแฟลชการ์ดช่วยจำได้เก่ง
จงสร้างแฟลชการ์ดภาษาไทย 8-15 ใบ ที่ครอบคลุมทุกความรู้สำคัญในเนื้อหาต้นฉบับ

รูปแบบ:
- ด้านหน้าเป็นคำถามสั้นหรือคำศัพท์ (เช่น "ฮาร์ดแวร์คืออะไร?" หรือ "CPU")
- ด้านหลังตอบกระชับ จำง่าย ใช้ **ตัวหนา** กับคำสำคัญ อาจมีเทคนิคช่วยจำ
- ผสมทั้งคำนิยาม การเปรียบเทียบ "ต่างกันอย่างไร" และ "ยกตัวอย่าง"
- hint เป็นคำใบ้ที่ช่วยนึกออกโดยไม่บอกคำตอบตรงๆ

${BASE_RULES}

${sourceBlock(text)}`;

// ---------- 5. ผังภาพ (mindmap) ----------

const MINDMAP_SCHEMA = {
    type: 'object',
    properties: {
        ...HEADER_PROPS,
        center: {
            type: 'object',
            properties: { label: { type: 'string', description: 'หัวข้อหลักตรงกลาง สั้นๆ' }, emoji: { type: 'string' } },
            required: ['label', 'emoji'],
        },
        branches: {
            type: 'array', description: 'กิ่งหลัก 3-6 กิ่ง',
            items: {
                type: 'object',
                properties: {
                    label: { type: 'string', description: 'ชื่อกิ่ง 1-4 คำ' },
                    emoji: { type: 'string' },
                    note: { type: 'string', description: 'คำอธิบายกิ่งนี้ 1-2 ประโยค' },
                    children: {
                        type: 'array', description: 'กิ่งย่อย 2-5 กิ่ง',
                        items: {
                            type: 'object',
                            properties: { label: { type: 'string' }, note: { type: 'string', description: 'อธิบาย 1 ประโยค' } },
                            required: ['label', 'note'],
                        },
                    },
                },
                required: ['label', 'emoji', 'note', 'children'],
            },
        },
        key_points: { type: 'array', items: { type: 'string' }, description: 'ภาพรวมที่ควรจำ 3-5 ข้อ' },
    },
    required: [...HEADER_REQUIRED, 'center', 'branches', 'key_points'],
};

const mindmapError = (d) => headerError(d)
    || (!isNonEmptyString(d.center?.label) ? 'ไม่มี center' : null)
    || (!Array.isArray(d.branches) || d.branches.length < 2 ? 'branches น้อยเกินไป' : null)
    || (d.branches.some(b => !isNonEmptyString(b?.label) || !Array.isArray(b.children) || b.children.some(c => !isNonEmptyString(c?.label))) ? 'branches ไม่ถูกต้อง' : null)
    || (!isStringArray(d.key_points) ? 'key_points ไม่ถูกต้อง' : null);

const mindmapPrompt = (text) => `คุณคือผู้เชี่ยวชาญการสรุปความรู้เป็นแผนผังความคิด (Mind Map)
จงสรุปเนื้อหาต้นฉบับเป็นผังภาพภาษาไทย ที่เห็นภาพรวมและความเชื่อมโยงในครั้งเดียว

รูปแบบ:
- center คือหัวข้อหลักของบทเรียน
- กิ่งหลัก 3-6 กิ่ง แต่ละกิ่งคือหมวดความรู้ใหญ่ มีอีโมจิและคำอธิบายสั้น
- แต่ละกิ่งมีกิ่งย่อย 2-5 กิ่ง เป็นรายละเอียด/ตัวอย่าง พร้อมคำอธิบาย 1 ประโยค
- label สั้น กระชับ (1-4 คำ) ส่วนรายละเอียดใส่ใน note

${BASE_RULES}

${sourceBlock(text)}`;

// ---------- 6. เกมฝึกฝน (practice): จับคู่ + เรียงลำดับ + เติมคำ ----------

const PRACTICE_SCHEMA = {
    type: 'object',
    properties: {
        ...HEADER_PROPS,
        matching: {
            type: 'object',
            properties: {
                instructions: { type: 'string' },
                pairs: {
                    type: 'array', description: 'คู่ที่ต้องจับ 4-6 คู่',
                    items: { type: 'object', properties: { term: { type: 'string' }, match: { type: 'string' } }, required: ['term', 'match'] },
                },
            },
            required: ['instructions', 'pairs'],
        },
        ordering: {
            type: 'object',
            properties: {
                instructions: { type: 'string', description: 'เช่น เรียงขั้นตอนการทำงานของคอมพิวเตอร์' },
                items: { type: 'array', items: { type: 'string' }, description: '4-6 รายการ เรียงตามลำดับที่ถูกต้อง' },
            },
            required: ['instructions', 'items'],
        },
        fill_blanks: {
            type: 'array', description: 'ประโยคเติมคำ 3-5 ข้อ',
            items: {
                type: 'object',
                properties: {
                    sentence: { type: 'string', description: 'ประโยคที่มีช่องว่าง ___ หนึ่งจุด' },
                    answer: { type: 'string' },
                    choices: { type: 'array', items: { type: 'string' }, description: '3-4 ตัวเลือก ต้องมี answer อยู่ด้วย' },
                    explanation: { type: 'string' },
                },
                required: ['sentence', 'answer', 'choices', 'explanation'],
            },
        },
    },
    required: [...HEADER_REQUIRED, 'matching', 'ordering', 'fill_blanks'],
};

const practiceError = (d) => {
    const base = headerError(d);
    if (base) return base;
    const pairs = d.matching?.pairs;
    if (!Array.isArray(pairs) || pairs.length < 3 || pairs.some(p => !isNonEmptyString(p?.term) || !isNonEmptyString(p.match))) return 'matching ไม่ถูกต้อง';
    if (new Set(pairs.map(p => p.term)).size !== pairs.length || new Set(pairs.map(p => p.match)).size !== pairs.length) return 'matching มีรายการซ้ำ';
    const items = d.ordering?.items;
    if (!isStringArray(items) || items.length < 3 || new Set(items).size !== items.length) return 'ordering ไม่ถูกต้อง';
    if (!Array.isArray(d.fill_blanks) || d.fill_blanks.length === 0) return 'ไม่มี fill_blanks';
    const badBlank = d.fill_blanks.some(f => !isNonEmptyString(f?.sentence) || !f.sentence.includes('___') ||
        !isNonEmptyString(f.answer) || !isStringArray(f.choices) || !f.choices.includes(f.answer));
    return badBlank ? 'fill_blanks ไม่ถูกต้อง' : null;
};

const practicePrompt = (text) => `คุณคือนักออกแบบเกมการเรียนรู้
จงสร้างเกมฝึกฝนภาษาไทย 3 แบบจากเนื้อหาต้นฉบับ:

1. matching (จับคู่): 4-6 คู่ เช่น คำศัพท์ ↔ ความหมาย หรือ สิ่งของ ↔ ประเภท (ทั้งสองฝั่งต้องไม่ซ้ำกัน และสั้นกระชับ)
2. ordering (เรียงลำดับ): 4-6 รายการ เรียงตามลำดับที่ถูกต้อง เช่น ขั้นตอนการทำงาน ลำดับเหตุการณ์
   ถ้าเนื้อหาไม่มีลำดับตามธรรมชาติ ให้เรียง "จากพื้นฐานไปซับซ้อน" หรือ "จากใหญ่ไปเล็ก" และบอกเกณฑ์ใน instructions
3. fill_blanks (เติมคำ): 3-5 ประโยคสำคัญจากเนื้อหา เว้นคำสำคัญเป็น ___ หนึ่งจุด ตัวเลือก 3-4 ตัวที่ดูสมเหตุสมผล

${BASE_RULES}

${sourceBlock(text)}`;

// ---------- ทะเบียนสไตล์ ----------

const STYLES = {
    ...Object.fromEntries(Object.entries(LESSON_GUIDES).map(([id, guide]) => [id, {
        kind: 'lesson', schema: LESSON_SCHEMA, validate: lessonError, prompt: lessonPrompt(guide), temperature: 0.8,
    }])),
    story: { kind: 'story', schema: STORY_SCHEMA, validate: storyError, prompt: storyPrompt, temperature: 0.9 },
    chat: { kind: 'chat', schema: CHAT_SCHEMA, validate: chatError, prompt: chatPrompt, temperature: 0.9 },
    flashcards: { kind: 'flashcards', schema: FLASHCARDS_SCHEMA, validate: flashcardsError, prompt: flashcardsPrompt, temperature: 0.5 },
    mindmap: { kind: 'mindmap', schema: MINDMAP_SCHEMA, validate: mindmapError, prompt: mindmapPrompt, temperature: 0.4 },
    practice: { kind: 'practice', schema: PRACTICE_SCHEMA, validate: practiceError, prompt: practicePrompt, temperature: 0.5 },
};

const STYLE_IDS = Object.keys(STYLES);

module.exports = { STYLES, STYLE_IDS };
