import React from 'react';
import { Check, X, Minus } from 'lucide-react';
import type { AttemptResult } from '@/lib/types';
import { ANSWER_KEYS, OPTION_FIELD } from '@/lib/quiz';
import { Card, ProgressRing, cx } from '@/components/ui';

// วันที่/เวลาแบบไทย เช่น "11 ต.ค. 2569 14:30"
export const formatThaiDateTime = (iso: string) =>
    new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

// สรุปคะแนน: วงแหวนเปอร์เซ็นต์ + จำนวนถูก/ผิด/ไม่ตอบ
export function ScoreSummary({ result }: { result: AttemptResult }) {
    const wrong = result.answers.filter(a => !a.is_correct && a.selected_answer !== null).length;
    const blank = result.answers.filter(a => a.selected_answer === null).length;
    return (
        <Card className={cx('relative overflow-hidden p-8 sm:p-10 text-center', result.passed && 'ring-emerald-200')}>
            <div className={cx('absolute inset-x-0 top-0 h-40 bg-gradient-to-b', result.passed ? 'from-emerald-50' : 'from-amber-50')} aria-hidden="true" />
            <div className="relative">
                <div className="text-5xl animate-pop" aria-hidden="true">{result.passed ? '🎉' : '💪'}</div>
                <h2 className="mt-3 text-3xl font-bold text-ink">{result.passed ? 'ยินดีด้วย คุณสอบผ่าน!' : 'ยังไม่ผ่าน แต่ใกล้แล้ว!'}</h2>
                <p className="mt-2 text-slate-500">
                    {result.passed ? 'ความรู้แน่นมาก ไปบทถัดไปได้เลย' : `ต้องได้อย่างน้อย ${result.pass_percent}% ทบทวนข้อที่ผิดแล้วลองใหม่อีกครั้ง`}
                </p>
                <div className="mt-8 flex justify-center">
                    <ProgressRing percent={result.percent} size={168} stroke={14} tone={result.passed ? 'green' : 'amber'}>
                        <span className="text-4xl font-extrabold font-display text-ink">{result.percent}%</span>
                        <span className="text-sm text-slate-500">{result.score} / {result.total} ข้อ</span>
                    </ProgressRing>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-3 max-w-md mx-auto">
                    <div className="rounded-2xl bg-emerald-50 py-3"><div className="text-2xl font-bold text-emerald-600">{result.score}</div><div className="text-xs text-emerald-700">ถูก</div></div>
                    <div className="rounded-2xl bg-rose-50 py-3"><div className="text-2xl font-bold text-rose-600">{wrong}</div><div className="text-xs text-rose-700">ผิด</div></div>
                    <div className="rounded-2xl bg-slate-100 py-3"><div className="text-2xl font-bold text-slate-600">{blank}</div><div className="text-xs text-slate-500">ไม่ได้ตอบ</div></div>
                </div>
                {result.created_at && <p className="mt-6 text-xs text-slate-400">สอบเมื่อ {formatThaiDateTime(result.created_at)}</p>}
            </div>
        </Card>
    );
}

// เฉลยรายข้อ (ข้อที่เลือกถูก = เขียว, เลือกผิด = แดง, เฉลยที่ถูก = กรอบเขียว)
export default function AttemptReview({ result }: { result: AttemptResult }) {
    return (
        <div className="space-y-8">
            <ScoreSummary result={result} />
            <section>
                <h2 className="text-2xl font-bold text-ink mb-4">เฉลยรายข้อ</h2>
                <ol className="space-y-4">
                    {result.answers.map((a, i) => (
                        <li key={i}>
                            <Card className="p-6">
                                <div className="flex items-start gap-3">
                                    <span className={cx('w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0',
                                        a.is_correct ? 'bg-emerald-500' : a.selected_answer === null ? 'bg-slate-400' : 'bg-rose-500')}
                                        aria-label={a.is_correct ? 'ตอบถูก' : a.selected_answer === null ? 'ไม่ได้ตอบ' : 'ตอบผิด'}>
                                        {a.is_correct ? <Check size={16} strokeWidth={3} /> : a.selected_answer === null ? <Minus size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-slate-400">ข้อ {i + 1}</div>
                                        <p className="font-bold text-ink break-words whitespace-pre-line leading-7">{a.question}</p>
                                    </div>
                                </div>
                                <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                                    {ANSWER_KEYS.map(k => {
                                        const isCorrect = a.correct_answer === k;
                                        const isSelected = a.selected_answer === k;
                                        return (
                                            <li key={k} className={cx('flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm',
                                                isSelected && isCorrect && 'bg-emerald-50 text-emerald-800 font-semibold ring-2 ring-emerald-400',
                                                isSelected && !isCorrect && 'bg-rose-50 text-rose-700 font-semibold ring-2 ring-rose-300',
                                                !isSelected && isCorrect && 'ring-2 ring-emerald-400 text-emerald-800 font-semibold',
                                                !isSelected && !isCorrect && 'bg-slate-50 text-slate-500')}>
                                                <span className="font-bold shrink-0">{k.toUpperCase()}.</span>
                                                <span className="flex-1 min-w-0 break-words">{a[OPTION_FIELD[k]]}</span>
                                                {isSelected && <span className="text-xs shrink-0">คำตอบของคุณ</span>}
                                                {!isSelected && isCorrect && <span className="text-xs shrink-0">เฉลย</span>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Card>
                        </li>
                    ))}
                </ol>
            </section>
        </div>
    );
}
