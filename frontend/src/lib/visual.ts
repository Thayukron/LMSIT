// ข้อมูลด้านภาพที่ใช้ร่วมกันหลายหน้า: สีปกวิชา และรายละเอียดสไตล์การเรียน

// สีปกวิชา — ไล่เฉดจากสีของธีมที่เลือก (เปลี่ยนตามธีม) เลือกแบบจาก id ให้แต่ละวิชาต่างกันเล็กน้อย
const COVERS = [
    { gradient: 'from-brand-600 via-brand-500 to-accent-500', emoji: '🚀' },
    { gradient: 'from-accent-500 to-brand-600', emoji: '💡' },
    { gradient: 'from-brand-700 to-brand-400', emoji: '🎯' },
    { gradient: 'from-brand-500 via-accent-500 to-warm-400', emoji: '🔥' },
    { gradient: 'from-accent-600 via-accent-400 to-warm-300', emoji: '🌿' },
    { gradient: 'from-brand-800 via-brand-600 to-accent-500', emoji: '🌊' },
];

export const courseCover = (id: number) => COVERS[Math.abs(id) % COVERS.length];

// สไตล์การเรียน — id ต้องตรงกับ backend/src/services/lessonFormats.js
// kind = หน้าตาที่ใช้แสดงเนื้อหา, group = หมวดในหน้าเลือกสไตล์
export type StyleKind = 'lesson' | 'story' | 'chat' | 'flashcards' | 'mindmap' | 'practice';

export const STYLE_GROUPS = [
    { id: 'read', name: 'อ่านแบบที่ใช่', description: 'บทเรียนแบบอ่าน ปรับภาษาและวิธีอธิบายให้เข้ากับคุณ' },
    { id: 'story', name: 'เรียนผ่านเรื่องราว', description: 'ความรู้ที่ซ่อนอยู่ในนิทานและบทสนทนา' },
    { id: 'practice', name: 'ฝึกและทบทวน', description: 'ลงมือเล่น จำแม่น เห็นภาพรวม' },
] as const;

export const LEARNING_STYLES = [
    {
        id: 'peer_to_peer', kind: 'lesson', group: 'read',
        name: 'เพื่อนติวเพื่อน', en: 'Peer Talk', emoji: '🤝',
        description: 'รุ่นพี่ใจดีมานั่งติวให้ ภาษาเป็นกันเอง เปรียบเทียบกับเรื่องใกล้ตัว',
        tags: ['เข้าใจง่าย', 'เป็นกันเอง'], gradient: 'from-sky-400 to-cyan-500', soft: 'bg-sky-50 text-sky-700',
    },
    {
        id: 'summary', kind: 'lesson', group: 'read',
        name: 'สรุปเน้นๆ', en: 'The Essence', emoji: '🎯',
        description: 'ตรงประเด็น ประหยัดเวลา เหมาะกับทบทวนก่อนสอบ',
        tags: ['กระชับ', 'อ่านเร็ว'], gradient: 'from-violet-500 to-purple-600', soft: 'bg-violet-50 text-violet-700',
    },
    {
        id: 'example_based', kind: 'lesson', group: 'read',
        name: 'เรียนจากเคสจริง', en: 'Real Case', emoji: '💡',
        description: 'เห็นภาพจากสถานการณ์จริง แล้วค่อยสรุปเป็นหลักการ',
        tags: ['เห็นภาพ', 'ใช้ได้จริง'], gradient: 'from-amber-400 to-orange-500', soft: 'bg-amber-50 text-amber-700',
    },
    {
        id: 'gamified', kind: 'lesson', group: 'read',
        name: 'ภารกิจผจญภัย', en: 'Quest Mode', emoji: '🎮',
        description: 'เรียนเป็นด่าน เก็บไอเทมความรู้ ผ่านภารกิจไปทีละขั้น',
        tags: ['สนุก', 'ท้าทาย'], gradient: 'from-pink-500 to-fuchsia-600', soft: 'bg-pink-50 text-pink-700',
    },
    {
        id: 'eli10', kind: 'lesson', group: 'read',
        name: 'อธิบายแบบเด็ก 10 ขวบ', en: 'Explain Like 10', emoji: '🧸',
        description: 'ภาษาง่ายที่สุด เปรียบกับของเล่นและขนม เหมาะกับคนเริ่มจากศูนย์',
        tags: ['ง่ายสุด', 'เริ่มจากศูนย์'], gradient: 'from-lime-400 to-green-500', soft: 'bg-lime-50 text-lime-700',
    },
    {
        id: 'story', kind: 'story', group: 'story',
        name: 'นิทานความรู้', en: 'Story Time', emoji: '📖',
        description: 'ตามตัวละครผจญภัยทีละตอน ค้นพบความรู้ไปพร้อมกับเรื่องราว',
        tags: ['อ่านเพลิน', 'จำง่าย'], gradient: 'from-rose-400 to-red-500', soft: 'bg-rose-50 text-rose-700',
    },
    {
        id: 'chat', kind: 'chat', group: 'story',
        name: 'การ์ตูนแชต', en: 'Chat Comic', emoji: '💬',
        description: 'อ่านบทสนทนาแบบแชตระหว่างครูกับนักเรียนขี้สงสัย',
        tags: ['สั้นๆ', 'เหมือนแชตจริง'], gradient: 'from-emerald-400 to-teal-500', soft: 'bg-emerald-50 text-emerald-700',
    },
    {
        id: 'flashcards', kind: 'flashcards', group: 'practice',
        name: 'แฟลชการ์ด', en: 'Flashcards', emoji: '🃏',
        description: 'พลิกการ์ดถาม-ตอบ ทดสอบตัวเองว่าจำได้แค่ไหน',
        tags: ['ท่องจำ', 'ทบทวน'], gradient: 'from-indigo-400 to-blue-600', soft: 'bg-indigo-50 text-indigo-700',
    },
    {
        id: 'mindmap', kind: 'mindmap', group: 'practice',
        name: 'ผังความคิด', en: 'Mind Map', emoji: '🧠',
        description: 'เห็นภาพรวมทั้งบทในหน้าเดียว แตกกิ่งเป็นหมวดหมู่',
        tags: ['ภาพรวม', 'เชื่อมโยง'], gradient: 'from-cyan-400 to-sky-600', soft: 'bg-cyan-50 text-cyan-700',
    },
    {
        id: 'practice', kind: 'practice', group: 'practice',
        name: 'เกมฝึกฝน', en: 'Practice Games', emoji: '🧩',
        description: 'จับคู่ เรียงลำดับ เติมคำ ฝึกให้แม่นก่อนสอบจริง',
        tags: ['ลงมือทำ', 'สนุก'], gradient: 'from-orange-400 to-amber-500', soft: 'bg-orange-50 text-orange-700',
    },
] as const;

export type LearningStyle = typeof LEARNING_STYLES[number];
export type LearningStyleId = LearningStyle['id'];
export const findStyle = (id: string) => LEARNING_STYLES.find(s => s.id === id);
