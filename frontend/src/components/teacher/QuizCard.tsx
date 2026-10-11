"use client";
import React, { useState } from 'react';
import { Pencil, Trash2, Check, TrendingDown } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { Quiz, QuizDraft, QuizStat } from '@/lib/types';
import { ANSWER_KEYS, OPTION_FIELD, toDraft, draftError } from '@/lib/quiz';
import { Alert, Badge, Button, Card, cx } from '@/components/ui';
import QuestionEditor from '@/components/teacher/QuestionEditor';

interface QuizCardProps {
    quiz: Quiz;
    index: number;
    onChanged: () => void;
    stats?: QuizStat; // สถิติการตอบของนักเรียน (ถ้ามีคนสอบแล้ว)
}

// ข้อสอบที่บันทึกแล้ว 1 ข้อ: ดูเฉลย + สถิติ / แก้ไขในที่ / ลบ
export default function QuizCard({ quiz, index, onChanged, stats }: QuizCardProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<QuizDraft>(() => toDraft(quiz));
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const save = async () => {
        const invalid = draftError(draft);
        if (invalid) return setError(invalid);
        setBusy(true); setError('');
        try {
            await apiFetch(`/api/quizzes/${quiz.id}`, { method: 'PUT', body: JSON.stringify(draft) });
            setEditing(false);
            onChanged();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ');
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!window.confirm(`ลบข้อสอบข้อที่ ${index + 1}?`)) return;
        setBusy(true);
        try {
            await apiFetch(`/api/quizzes/${quiz.id}`, { method: 'DELETE' });
            onChanged();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'ลบไม่สำเร็จ');
            setBusy(false);
        }
    };

    const hard = stats && stats.answered > 0 && stats.correct_percent < 40;
    const maxChoice = stats ? Math.max(1, ...ANSWER_KEYS.map(k => stats.choices[k])) : 1;

    return (
        <li>
            <Card className={cx('p-5 sm:p-6', hard && 'ring-rose-200')}>
                <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 font-bold font-display flex items-center justify-center shrink-0">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                        {!editing && <p className="font-bold text-ink break-words whitespace-pre-line leading-7 pt-1">{quiz.question}</p>}
                        {stats && stats.answered > 0 && !editing && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge tone={hard ? 'red' : stats.correct_percent < 70 ? 'amber' : 'green'}>
                                    ตอบถูก {stats.correct_percent}% ({stats.correct}/{stats.answered})
                                </Badge>
                                {hard && <Badge tone="red"><TrendingDown size={12} /> นักเรียนผิดเยอะ ควรทบทวน</Badge>}
                            </div>
                        )}
                    </div>
                    {!editing && (
                        <div className="flex shrink-0 -mr-1">
                            <button onClick={() => { setDraft(toDraft(quiz)); setEditing(true); }} disabled={busy}
                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label={`แก้ไขข้อ ${index + 1}`} title="แก้ไข"><Pencil size={17} /></button>
                            <button onClick={remove} disabled={busy}
                                className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`ลบข้อ ${index + 1}`} title="ลบ"><Trash2 size={17} /></button>
                        </div>
                    )}
                </div>

                {editing ? (
                    <div className="mt-4 space-y-4">
                        <QuestionEditor value={draft} onChange={setDraft} />
                        {error && <Alert>{error}</Alert>}
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => { setEditing(false); setError(''); }} disabled={busy}>ยกเลิก</Button>
                            <Button onClick={save} disabled={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                            {ANSWER_KEYS.map(k => {
                                const isCorrect = quiz.correct_answer === k;
                                const picks = stats?.choices[k] ?? 0;
                                return (
                                    <li key={k} className={cx('relative overflow-hidden flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm',
                                        isCorrect ? 'bg-emerald-50 text-emerald-800 font-semibold ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-600')}>
                                        {/* แถบแสดงสัดส่วนคนที่เลือกตัวเลือกนี้ */}
                                        {stats && stats.answered > 0 && (
                                            <span className={cx('absolute inset-y-0 left-0', isCorrect ? 'bg-emerald-100' : 'bg-slate-200/60')}
                                                style={{ width: `${(picks / maxChoice) * 100}%` }} aria-hidden="true" />
                                        )}
                                        <span className="relative font-bold shrink-0">{k.toUpperCase()}.</span>
                                        <span className="relative flex-1 min-w-0 break-words">{quiz[OPTION_FIELD[k]]}</span>
                                        {stats && stats.answered > 0 && <span className="relative text-xs opacity-70 shrink-0">{picks} คน</span>}
                                        {isCorrect && <Check size={16} className="relative shrink-0 mt-0.5" aria-label="คำตอบที่ถูก" />}
                                    </li>
                                );
                            })}
                        </ul>
                        {error && <Alert className="mt-3">{error}</Alert>}
                    </>
                )}
            </Card>
        </li>
    );
}
