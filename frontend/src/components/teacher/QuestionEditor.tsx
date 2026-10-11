"use client";
import React, { useId } from 'react';
import { Check } from 'lucide-react';
import type { QuizDraft } from '@/lib/types';
import { ANSWER_KEYS, OPTION_FIELD } from '@/lib/quiz';
import { Field, inputClass, cx } from '@/components/ui';

interface QuestionEditorProps {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    error?: string | null;
}

// ฟอร์มข้อสอบ 1 ข้อ: คำถาม + ตัวเลือก a-d + กดตัวอักษรหน้าตัวเลือกเพื่อตั้งเป็นเฉลย
export default function QuestionEditor({ value, onChange, error }: QuestionEditorProps) {
    const id = useId();
    const set = (patch: Partial<QuizDraft>) => onChange({ ...value, ...patch });

    return (
        <div className="space-y-4">
            <Field label="คำถาม" htmlFor={`${id}-q`}>
                <textarea id={`${id}-q`} className={inputClass} rows={2} value={value.question}
                    onChange={e => set({ question: e.target.value })} maxLength={2000} placeholder="พิมพ์คำถาม..." />
            </Field>
            <fieldset>
                <legend className="text-sm font-semibold text-slate-700 mb-1.5">ตัวเลือก <span className="font-normal text-slate-400">(กดตัวอักษรเพื่อตั้งเป็นคำตอบที่ถูก)</span></legend>
                <div className="space-y-2">
                    {ANSWER_KEYS.map(k => {
                        const field = OPTION_FIELD[k];
                        const isCorrect = value.correct_answer === k;
                        return (
                            <div key={k} className="flex items-center gap-2">
                                <button type="button" onClick={() => set({ correct_answer: k })} aria-pressed={isCorrect}
                                    aria-label={`ตั้งตัวเลือก ${k.toUpperCase()} เป็นคำตอบที่ถูก`}
                                    className={cx('w-11 h-11 rounded-xl font-bold flex items-center justify-center shrink-0 transition',
                                        isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600')}>
                                    {isCorrect ? <Check size={18} strokeWidth={3} /> : k.toUpperCase()}
                                </button>
                                <input className={cx(inputClass, isCorrect && 'ring-emerald-300 bg-emerald-50/40')} value={value[field]}
                                    onChange={e => set({ [field]: e.target.value })} aria-label={`ตัวเลือก ${k.toUpperCase()}`} maxLength={2000}
                                    placeholder={`ตัวเลือก ${k.toUpperCase()}`} />
                            </div>
                        );
                    })}
                </div>
            </fieldset>
            {error && <p className="text-sm font-semibold text-red-600">⚠ {error}</p>}
        </div>
    );
}
