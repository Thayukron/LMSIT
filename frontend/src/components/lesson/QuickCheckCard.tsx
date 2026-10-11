"use client";
import React, { useState } from 'react';
import { Brain, Check, X, RotateCcw } from 'lucide-react';
import type { QuickCheck } from '@/lib/types';
import { cx } from '@/components/ui';
import InlineMarkdown from '@/components/lesson/InlineMarkdown';

// AI บางครั้งใส่ "ก." หรือ "A)" นำหน้าตัวเลือกมาเอง — ตัดออกเพราะเราแสดงตัวอักษรให้แล้ว
const stripChoicePrefix = (choice: string) => choice.replace(/^\s*(?:[ก-ง]|[A-Da-d])\s*[.)]\s*/, '');

// คำถามเช็กความเข้าใจระหว่างอ่าน (ไม่เก็บคะแนน) — กดตอบแล้วเห็นเฉลยและคำอธิบายทันที
export default function QuickCheckCard({ check }: { check: QuickCheck }) {
    const [picked, setPicked] = useState<number | null>(null);
    const answered = picked !== null;
    const correct = picked === check.answer_index;

    return (
        <aside className="rounded-3xl bg-gradient-to-br from-brand-600 to-fuchsia-600 p-[2px] shadow-lift">
            <div className="rounded-[calc(1.5rem-2px)] bg-white p-6 sm:p-8">
                <div className="flex items-center gap-2 text-brand-700 text-sm font-bold">
                    <span className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center"><Brain size={17} /></span>
                    เช็กความเข้าใจ
                </div>
                <p className="mt-4 text-lg font-bold text-ink leading-relaxed"><InlineMarkdown>{check.question}</InlineMarkdown></p>
                <div className="mt-5 grid sm:grid-cols-2 gap-3">
                    {check.choices.map((choice, i) => {
                        const isAnswer = i === check.answer_index;
                        const isPicked = i === picked;
                        return (
                            <button key={i} type="button" disabled={answered} onClick={() => setPicked(i)}
                                className={cx('flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-medium ring-2 transition-all',
                                    !answered && 'ring-slate-200 hover:ring-brand-400 hover:bg-brand-50/50 hover:-translate-y-0.5',
                                    answered && isAnswer && 'ring-emerald-400 bg-emerald-50 text-emerald-800',
                                    answered && isPicked && !isAnswer && 'ring-rose-300 bg-rose-50 text-rose-700',
                                    answered && !isPicked && !isAnswer && 'ring-slate-100 text-slate-400')}>
                                <span className={cx('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                                    answered && isAnswer ? 'bg-emerald-500 text-white' : answered && isPicked ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500')}>
                                    {answered && isAnswer ? <Check size={15} strokeWidth={3} /> : answered && isPicked ? <X size={15} strokeWidth={3} /> : String.fromCharCode(65 + i)}
                                </span>
                                <span className="min-w-0"><InlineMarkdown>{stripChoicePrefix(choice)}</InlineMarkdown></span>
                            </button>
                        );
                    })}
                </div>
                {answered && (
                    <div className={cx('mt-5 rounded-2xl p-4 animate-pop', correct ? 'bg-emerald-50' : 'bg-amber-50')} role="status">
                        <div className={cx('font-bold', correct ? 'text-emerald-700' : 'text-amber-700')}>
                            {correct ? '🎉 ถูกต้อง! เก่งมาก' : '💪 เกือบแล้ว! มาดูเหตุผลกัน'}
                        </div>
                        <p className="mt-1 text-slate-700 leading-7"><InlineMarkdown>{check.explanation}</InlineMarkdown></p>
                        {!correct && (
                            <button type="button" onClick={() => setPicked(null)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                                <RotateCcw size={14} /> ลองตอบใหม่
                            </button>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
