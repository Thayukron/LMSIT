import React from 'react';
import { Check, X } from 'lucide-react';
import type { AttemptResult } from '@/lib/types';
import { ANSWER_KEYS, OPTION_FIELD } from '@/lib/quiz';
import { cardClass } from '@/lib/ui';

// วันที่/เวลาแบบไทย เช่น "11 ต.ค. 2569 14:30"
export const formatThaiDateTime = (iso: string) =>
    new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

// สรุปคะแนน + เฉลยรายข้อ (ข้อที่เลือกถูก = เขียว, เลือกผิด = แดง, เฉลยที่ถูก = กรอบเขียว)
export default function AttemptReview({ result }: { result: AttemptResult }) {
    return (
        <div className="space-y-6">
            <div className={`${cardClass} text-center ${result.passed ? 'bg-green-50' : 'bg-amber-50'}`}>
                <p className="text-6xl font-black text-gray-900">
                    {result.score}<span className="text-3xl text-gray-400"> / {result.total}</span>
                </p>
                <p className="text-xl font-bold mt-2">{result.percent}%</p>
                <p className={`text-2xl font-black mt-4 ${result.passed ? 'text-green-700' : 'text-amber-700'}`}>
                    {result.passed ? '🎉 ผ่าน' : 'ยังไม่ผ่าน'}
                </p>
                <p className="text-sm text-gray-500 mt-1">เกณฑ์ผ่าน {result.pass_percent}%</p>
                {result.created_at && <p className="text-xs text-gray-400 mt-2">สอบเมื่อ {formatThaiDateTime(result.created_at)}</p>}
            </div>

            <ol className="space-y-4">
                {result.answers.map((a, i) => (
                    <li key={i} className={cardClass}>
                        <div className="flex items-start gap-3 mb-3">
                            <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white ${a.is_correct ? 'bg-green-600' : 'bg-red-500'}`}
                                aria-label={a.is_correct ? 'ตอบถูก' : 'ตอบผิด'}>
                                {a.is_correct ? <Check size={16} /> : <X size={16} />}
                            </span>
                            <p className="font-bold text-gray-900 flex-1 min-w-0 break-words whitespace-pre-line">
                                <span className="text-indigo-300 mr-2">ข้อ {i + 1}</span>{a.question}
                            </p>
                        </div>
                        <ul className="grid sm:grid-cols-2 gap-2">
                            {ANSWER_KEYS.map(k => {
                                const isCorrect = a.correct_answer === k;
                                const isSelected = a.selected_answer === k;
                                const style = isSelected
                                    ? (isCorrect ? 'bg-green-100 text-green-800 font-bold' : 'bg-red-100 text-red-800 font-bold')
                                    : isCorrect ? 'ring-2 ring-green-500 text-green-800 font-bold' : 'bg-gray-50 text-gray-600';
                                return (
                                    <li key={k} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${style}`}>
                                        <span className="shrink-0">{k.toUpperCase()}.</span>
                                        <span className="flex-1 min-w-0 break-words">{a[OPTION_FIELD[k]]}</span>
                                        {isSelected && <span className="shrink-0 text-xs">(คำตอบของคุณ)</span>}
                                        {!isSelected && isCorrect && <span className="shrink-0 text-xs">(เฉลย)</span>}
                                    </li>
                                );
                            })}
                        </ul>
                        {a.selected_answer === null && <p className="text-sm text-red-600 mt-2">ไม่ได้ตอบข้อนี้</p>}
                    </li>
                ))}
            </ol>
        </div>
    );
}
