"use client";
import React, { useId } from 'react';
import type { QuizDraft } from '@/lib/types';
import { ANSWER_KEYS, OPTION_FIELD } from '@/lib/quiz';
import { inputClass, labelClass } from '@/lib/ui';

interface QuestionEditorProps {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    error?: string | null;
}

// ฟอร์มข้อสอบ 1 ข้อ: คำถาม + ตัวเลือก a-d + เลือกเฉลยด้วยปุ่มวงกลมหน้าตัวเลือก
export default function QuestionEditor({ value, onChange, error }: QuestionEditorProps) {
    const id = useId();
    const set = (patch: Partial<QuizDraft>) => onChange({ ...value, ...patch });

    return (
        <div className="space-y-3">
            <div>
                <label htmlFor={`${id}-q`} className={labelClass}>คำถาม</label>
                <textarea id={`${id}-q`} className={inputClass} rows={2} value={value.question}
                    onChange={e => set({ question: e.target.value })} maxLength={2000} />
            </div>
            <fieldset>
                <legend className={labelClass}>ตัวเลือก (กดวงกลมหน้าคำตอบที่ถูก)</legend>
                <div className="space-y-2">
                    {ANSWER_KEYS.map(k => {
                        const field = OPTION_FIELD[k];
                        const isCorrect = value.correct_answer === k;
                        return (
                            <div key={k} className={`flex items-center gap-3 rounded-xl pl-3 ${isCorrect ? 'bg-green-50' : ''}`}>
                                <input type="radio" name={`${id}-answer`} checked={isCorrect} onChange={() => set({ correct_answer: k })}
                                    aria-label={`ตัวเลือก ${k.toUpperCase()} เป็นคำตอบที่ถูก`} className="w-5 h-5 accent-green-600 shrink-0" />
                                <span className="font-bold text-gray-500 w-4 shrink-0">{k.toUpperCase()}</span>
                                <input className={inputClass} value={value[field]} onChange={e => set({ [field]: e.target.value })}
                                    aria-label={`ตัวเลือก ${k.toUpperCase()}`} maxLength={2000} />
                            </div>
                        );
                    })}
                </div>
            </fieldset>
            {error && <p className="text-sm text-red-600">⚠ {error}</p>}
        </div>
    );
}
