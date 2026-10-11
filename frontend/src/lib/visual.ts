// ข้อมูลด้านภาพที่ใช้ร่วมกันหลายหน้า: สีปกวิชา และรายละเอียดสไตล์การเรียน

// สีปกวิชา — เลือกจาก id ให้แต่ละวิชามีสีประจำตัวคงที่
const COVERS = [
    { gradient: 'from-violet-500 via-fuchsia-500 to-pink-500', emoji: '🚀' },
    { gradient: 'from-sky-500 via-cyan-500 to-teal-400', emoji: '🌊' },
    { gradient: 'from-amber-400 via-orange-500 to-rose-500', emoji: '🔥' },
    { gradient: 'from-emerald-400 via-teal-500 to-cyan-600', emoji: '🌿' },
    { gradient: 'from-indigo-500 via-blue-500 to-sky-400', emoji: '💡' },
    { gradient: 'from-rose-400 via-pink-500 to-purple-600', emoji: '🎯' },
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
        gradient: 'from-violet-500 to-brand-600',
        soft: 'bg-brand-50 text-brand-700',
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
