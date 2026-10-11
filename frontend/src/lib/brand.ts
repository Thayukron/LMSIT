// ชื่อแบรนด์ — แก้ที่นี่ที่เดียว แล้วจะเปลี่ยนทั้งระบบ
export const BRAND = {
    name: 'LMSIT',
    tagline: 'AI Smart Learning',
    description: 'แพลตฟอร์มการเรียนรู้ที่ AI ปรับบทเรียนให้เข้ากับสไตล์ของผู้เรียนแต่ละคน',
};

// ธีมสี (ค่าใน globals.css) — DEFAULT_THEME คือธีมเริ่มต้นของระบบ
export const THEMES = [
    { id: 'violet', name: 'ม่วงลาเวนเดอร์', colors: ['#6a35f1', '#d946ef'] },
    { id: 'ocean', name: 'น้ำเงินมหาสมุทร', colors: ['#2563eb', '#06b6d4'] },
    { id: 'emerald', name: 'เขียวมรกต', colors: ['#059669', '#14b8a6'] },
    { id: 'sunset', name: 'ส้มพระอาทิตย์ตก', colors: ['#ea580c', '#f43f5e'] },
    { id: 'rose', name: 'ชมพูกุหลาบ', colors: ['#e11d48', '#ec4899'] },
    { id: 'mono', name: 'ขาวดำมินิมอล', colors: ['#27272a', '#71717a'] },
] as const;

export type ThemeId = typeof THEMES[number]['id'];
export const DEFAULT_THEME: ThemeId = 'violet';
export const THEME_STORAGE_KEY = 'lmsit-theme';
