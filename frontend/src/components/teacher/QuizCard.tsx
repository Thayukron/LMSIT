"use client";
import React, { useState } from 'react';
import { Pencil, Trash2, Check } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { Quiz, QuizDraft } from '@/lib/types';
import { ANSWER_KEYS, OPTION_FIELD, toDraft, draftError } from '@/lib/quiz';
import { cardClass, primaryButton, secondaryButton, errorBox } from '@/lib/ui';
import QuestionEditor from '@/components/teacher/QuestionEditor';

interface QuizCardProps {
    quiz: Quiz;
    index: number;
    onChanged: () => void;
}

// ข้อสอบที่บันทึกแล้ว 1 ข้อ: ดูเฉลย / แก้ไขในที่ / ลบ
export default function QuizCard({ quiz, index, onChanged }: QuizCardProps) {
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

    return (
        <li className={cardClass}>
            <div className="flex items-start gap-3 mb-3">
                <span className="text-lg font-black text-indigo-300 shrink-0">ข้อ {index + 1}</span>
                {!editing && <p className="font-bold text-gray-900 flex-1 min-w-0 break-words whitespace-pre-line">{quiz.question}</p>}
                {editing && <span className="flex-1" />}
                {!editing && (
                    <div className="flex shrink-0">
                        <button onClick={() => { setDraft(toDraft(quiz)); setEditing(true); }} disabled={busy}
                            className="p-2 text-gray-400 hover:text-indigo-600" aria-label={`แก้ไขข้อ ${index + 1}`} title="แก้ไข">
                            <Pencil size={18} />
                        </button>
                        <button onClick={remove} disabled={busy}
                            className="p-2 text-gray-400 hover:text-red-600" aria-label={`ลบข้อ ${index + 1}`} title="ลบ">
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            </div>

            {editing ? (
                <div className="space-y-4">
                    <QuestionEditor value={draft} onChange={setDraft} />
                    {error && <p role="alert" className={errorBox}>{error}</p>}
                    <div className="flex gap-2">
                        <button onClick={save} disabled={busy} className={primaryButton}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                        <button onClick={() => { setEditing(false); setError(''); }} disabled={busy} className={secondaryButton}>ยกเลิก</button>
                    </div>
                </div>
            ) : (
                <>
                    <ul className="grid sm:grid-cols-2 gap-2">
                        {ANSWER_KEYS.map(k => {
                            const isCorrect = quiz.correct_answer === k;
                            return (
                                <li key={k} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${isCorrect ? 'bg-green-50 text-green-800 font-bold' : 'bg-gray-50 text-gray-600'}`}>
                                    <span className="shrink-0">{k.toUpperCase()}.</span>
                                    <span className="flex-1 min-w-0 break-words">{quiz[OPTION_FIELD[k]]}</span>
                                    {isCorrect && <Check size={16} className="shrink-0 mt-0.5" aria-label="คำตอบที่ถูก" />}
                                </li>
                            );
                        })}
                    </ul>
                    {error && <p role="alert" className={`${errorBox} mt-3`}>{error}</p>}
                </>
            )}
        </li>
    );
}
