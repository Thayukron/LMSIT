import type { AnswerKey, QuizDraft } from '@/lib/types';

export const ANSWER_KEYS: AnswerKey[] = ['a', 'b', 'c', 'd'];
export const OPTION_FIELD = { a: 'option_a', b: 'option_b', c: 'option_c', d: 'option_d' } as const;

export const emptyDraft = (): QuizDraft => ({
    question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '',
});

// แปลงข้อมูลที่ได้จาก API ให้เป็นร่างที่แก้ไขได้ (เฉลยที่ไม่ใช่ a-d จะถูกล้างให้ครูเลือกใหม่)
export const toDraft = (q: Partial<Record<keyof QuizDraft, string>>): QuizDraft => {
    const answer = String(q.correct_answer ?? '').toLowerCase();
    return {
        question: q.question ?? '',
        option_a: q.option_a ?? '',
        option_b: q.option_b ?? '',
        option_c: q.option_c ?? '',
        option_d: q.option_d ?? '',
        correct_answer: (ANSWER_KEYS as string[]).includes(answer) ? answer as AnswerKey : '',
    };
};

// ตรวจข้อสอบ 1 ข้อแบบเดียวกับ Backend — คืนข้อความ error หรือ null
export const draftError = (q: QuizDraft): string | null => {
    if (!q.question.trim()) return 'ยังไม่มีคำถาม';
    if (ANSWER_KEYS.some(k => !q[OPTION_FIELD[k]].trim())) return 'ตัวเลือก a-d ยังไม่ครบ';
    if (!q.correct_answer) return 'ยังไม่ได้เลือกเฉลย';
    return null;
};
