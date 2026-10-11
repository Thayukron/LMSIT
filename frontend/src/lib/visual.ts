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

// สไตล์การเรียน (id ต้องตรงกับ ALLOWED_STYLES ฝั่ง Backend)
export const LEARNING_STYLES = [
    {
        id: 'peer_to_peer',
        name: 'เพื่อนติวเพื่อน',
        en: 'Peer Talk',
        emoji: '🤝',
        description: 'รุ่นพี่ใจดีมานั่งติวให้ ภาษาเป็นกันเอง เปรียบเทียบกับเรื่องใกล้ตัว',
        tags: ['เข้าใจง่าย', 'เป็นกันเอง'],
        gradient: 'from-sky-400 to-cyan-500',
        soft: 'bg-sky-50 text-sky-700',
    },
    {
        id: 'summary',
        name: 'สรุปเน้นๆ',
        en: 'The Essence',
        emoji: '🎯',
        description: 'ตรงประเด็น ประหยัดเวลา เหมาะกับทบทวนก่อนสอบ',
        tags: ['กระชับ', 'อ่านเร็ว'],
        gradient: 'from-violet-500 to-purple-600',
        soft: 'bg-violet-50 text-violet-700',
    },
    {
        id: 'example_based',
        name: 'เรียนจากเคสจริง',
        en: 'Real Case',
        emoji: '💡',
        description: 'เห็นภาพจากสถานการณ์จริง แล้วค่อยสรุปเป็นหลักการ',
        tags: ['เห็นภาพ', 'ใช้ได้จริง'],
        gradient: 'from-amber-400 to-orange-500',
        soft: 'bg-amber-50 text-amber-700',
    },
    {
        id: 'gamified',
        name: 'ภารกิจผจญภัย',
        en: 'Quest Mode',
        emoji: '🎮',
        description: 'เรียนเป็นด่าน เก็บไอเทมความรู้ ผ่านภารกิจไปทีละขั้น',
        tags: ['สนุก', 'ท้าทาย'],
        gradient: 'from-pink-500 to-fuchsia-600',
        soft: 'bg-pink-50 text-pink-700',
    },
] as const;

export type LearningStyleId = typeof LEARNING_STYLES[number]['id'];
export const findStyle = (id: string) => LEARNING_STYLES.find(s => s.id === id);
