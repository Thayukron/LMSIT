"use client";
import React, { useState } from 'react';
import { Sparkles, ClipboardPaste } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { QuizDraft } from '@/lib/types';
import { toDraft } from '@/lib/quiz';
import { inputClass, labelClass, primaryButton, errorBox } from '@/lib/ui';

type Mode = 'generate' | 'parse';

interface AiQuizPanelProps {
    moduleId: number;
    onDrafts: (drafts: QuizDraft[]) => void;
}

// ให้ AI ช่วยทำข้อสอบ: ออกข้อสอบจากเนื้อหาบทเรียน หรือแยกข้อสอบจากข้อความที่วาง
// ผลลัพธ์เป็น "ร่าง" ส่งต่อให้ครูตรวจก่อนบันทึก
export default function AiQuizPanel({ moduleId, onDrafts }: AiQuizPanelProps) {
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

    const tabClass = (active: boolean) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`;

    return (
        <form onSubmit={run} className="space-y-4">
            <div role="tablist" aria-label="วิธีใช้ AI" className="flex flex-wrap gap-2">
                <button type="button" role="tab" aria-selected={mode === 'generate'} onClick={() => setMode('generate')} className={tabClass(mode === 'generate')}>
                    <Sparkles size={16} /> ออกข้อสอบจากเนื้อหา
                </button>
                <button type="button" role="tab" aria-selected={mode === 'parse'} onClick={() => setMode('parse')} className={tabClass(mode === 'parse')}>
                    <ClipboardPaste size={16} /> แยกจากข้อความที่วาง
                </button>
            </div>

            {mode === 'generate' ? (
                <div>
                    <label htmlFor="ai-count" className={labelClass}>จำนวนข้อ (1-20)</label>
                    <input id="ai-count" type="number" min={1} max={20} className={`${inputClass} max-w-32`}
                        value={count} onChange={e => setCount(Number(e.target.value))} required />
                    <p className="text-xs text-gray-400 mt-1">AI จะออกข้อสอบจากเนื้อหาต้นฉบับของบทเรียนนี้</p>
                </div>
            ) : (
                <div>
                    <label htmlFor="ai-raw" className={labelClass}>วางข้อสอบที่มีอยู่แล้ว (รูปแบบไหนก็ได้ เช่น คัดลอกจาก Word)</label>
                    <textarea id="ai-raw" className={inputClass} rows={8} value={rawText} onChange={e => setRawText(e.target.value)} required
                        placeholder={'1. ข้อใดเป็นฮาร์ดแวร์\nก. Windows  ข. CPU  ค. Word  ง. Chrome\nเฉลย ข'} />
                </div>
            )}

            {error && <p role="alert" className={errorBox}>{error}</p>}
            <button type="submit" disabled={busy} className={`${primaryButton} flex items-center gap-2`}>
                <Sparkles size={16} /> {busy ? 'AI กำลังทำงาน...' : 'ให้ AI สร้างร่างข้อสอบ'}
            </button>
        </form>
    );
}
