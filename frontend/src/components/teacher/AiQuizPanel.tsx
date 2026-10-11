"use client";
import React, { useState } from 'react';
import { Sparkles, ClipboardPaste, Wand2 } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { QuizDraft } from '@/lib/types';
import { toDraft } from '@/lib/quiz';
import { Alert, Button, Field, inputClass, cx } from '@/components/ui';

type Mode = 'generate' | 'parse';

// ให้ AI ช่วยทำข้อสอบ: ออกข้อสอบจากเนื้อหาบทเรียน หรือแยกข้อสอบจากข้อความที่วาง
// ผลลัพธ์เป็น "ร่าง" ส่งต่อให้ครูตรวจก่อนบันทึก
export default function AiQuizPanel({ moduleId, onDrafts }: { moduleId: number; onDrafts: (drafts: QuizDraft[]) => void }) {
    const [mode, setMode] = useState<Mode>('generate');
    const [count, setCount] = useState(5);
    const [rawText, setRawText] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const run = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const { questions } = await apiFetch<{ questions: QuizDraft[] }>(
                `/api/modules/${moduleId}/quizzes/${mode === 'generate' ? 'ai-generate' : 'ai-parse'}`,
                { method: 'POST', body: JSON.stringify(mode === 'generate' ? { count } : { rawText }) }
            );
            onDrafts(questions.map(toDraft));
            if (mode === 'parse') setRawText('');
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'AI ทำงานไม่สำเร็จ');
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={run} className="space-y-5">
            <div role="tablist" aria-label="วิธีใช้ AI" className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
                {([['generate', <Wand2 key="g" size={15} />, 'ออกข้อสอบใหม่'], ['parse', <ClipboardPaste key="p" size={15} />, 'จากข้อสอบเดิม']] as const).map(([id, icon, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)}
                        className={cx('flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition',
                            mode === id ? 'bg-white text-brand-700 shadow-soft' : 'text-slate-500 hover:text-slate-700')}>
                        {icon} {label}
                    </button>
                ))}
            </div>

            {mode === 'generate' ? (
                <Field label="จำนวนข้อ" htmlFor="ai-count" hint="AI จะออกข้อสอบจากเนื้อหาต้นฉบับของบทเรียนนี้">
                    <div className="flex items-center gap-2">
                        {[3, 5, 10].map(n => (
                            <button key={n} type="button" onClick={() => setCount(n)}
                                className={cx('h-11 px-3 rounded-xl text-sm font-semibold ring-1 transition whitespace-nowrap shrink-0', count === n ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white ring-slate-200 text-slate-600 hover:ring-brand-300')}>
                                {n} ข้อ
                            </button>
                        ))}
                        <input id="ai-count" type="number" min={1} max={20} className={`${inputClass} w-20 min-w-0`} value={count}
                            onChange={e => setCount(Number(e.target.value))} required aria-label="จำนวนข้อ (1-20)" />
                    </div>
                </Field>
            ) : (
                <Field label="วางข้อสอบที่มีอยู่แล้ว" htmlFor="ai-raw" hint="รูปแบบไหนก็ได้ เช่น คัดลอกจาก Word — ถ้ามีบรรทัดเฉลย AI จะใช้ตามนั้น">
                    <textarea id="ai-raw" className={inputClass} rows={8} value={rawText} onChange={e => setRawText(e.target.value)} required
                        placeholder={'1. ข้อใดเป็นฮาร์ดแวร์\nก. Windows  ข. CPU  ค. Word  ง. Chrome\nเฉลย ข'} />
                </Field>
            )}

            {error && <Alert>{error}</Alert>}
            <Button type="submit" disabled={busy} className="w-full">
                <Sparkles size={17} className={busy ? 'animate-spin' : ''} /> {busy ? 'AI กำลังทำงาน... (5-30 วินาที)' : 'ให้ AI สร้างร่างข้อสอบ'}
            </Button>
        </form>
    );
}
