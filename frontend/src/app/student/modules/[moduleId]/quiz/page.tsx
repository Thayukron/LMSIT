"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import type { AnswerKey, AttemptResult, AttemptSummary, ModuleDetail, Quiz } from '@/lib/types';
import { ANSWER_KEYS, OPTION_FIELD } from '@/lib/quiz';
import PageShell from '@/components/PageShell';
import Spinner from '@/components/Spinner';
import AttemptReview, { formatThaiDateTime } from '@/components/AttemptReview';
import { cardClass, primaryButton, secondaryButton, errorBox } from '@/lib/ui';

export default function StudentQuizPage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const [moduleInfo, setModuleInfo] = useState<ModuleDetail | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
    const [history, setHistory] = useState<AttemptSummary[]>([]);
    const [answers, setAnswers] = useState<Record<number, AnswerKey>>({});
    const [result, setResult] = useState<AttemptResult | null>(null);
    const [loadError, setLoadError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadHistory = useCallback(() => {
        apiFetch<AttemptSummary[]>(`/api/modules/${moduleId}/attempts`).then(setHistory).catch(console.error);
    }, [moduleId]);

    useEffect(() => {
        Promise.all([
            apiFetch<ModuleDetail>(`/api/modules/${moduleId}`),
            apiFetch<Quiz[]>(`/api/modules/${moduleId}/quizzes`),
        ])
            .then(([m, q]) => { setModuleInfo(m); setQuizzes(q); })
            .catch(err => setLoadError(err.message));
        loadHistory();
    }, [moduleId, loadHistory]);

    if (loadError) {
        return <PageShell title="เกิดข้อผิดพลาด" back={{ href: '/student/dashboard', label: 'ห้องเรียนของฉัน' }}><p className="text-red-600">{loadError}</p></PageShell>;
    }
    if (!moduleInfo || !quizzes) return <Spinner />;

    const back = { href: `/student/modules/${moduleInfo.id}`, label: `กลับไปบทเรียน: ${moduleInfo.title}` };
    const answeredCount = quizzes.filter(q => answers[q.id]).length;
    const isPreview = moduleInfo.can_edit; // ครูเจ้าของวิชาลองทำ = โหมดดูตัวอย่าง

    const submit = async () => {
        const unanswered = quizzes.length - answeredCount;
        if (unanswered > 0 && !window.confirm(`ยังไม่ได้ตอบ ${unanswered} ข้อ (นับเป็นผิด)\nต้องการส่งคำตอบเลยหรือไม่?`)) return;
        setSubmitError('');
        setSubmitting(true);
        try {
            const res = await apiFetch<AttemptResult>(`/api/modules/${moduleInfo.id}/attempts`, {
                method: 'POST',
                body: JSON.stringify({ answers }),
            });
            setResult(res);
            loadHistory();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setSubmitError(err instanceof ApiError ? err.message : 'ส่งคำตอบไม่สำเร็จ');
        } finally {
            setSubmitting(false);
        }
    };

    const retry = () => {
        setAnswers({});
        setResult(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- ผลสอบหลังส่งคำตอบ ---
    if (result) {
        return (
            <PageShell title={`ผลสอบ: ${moduleInfo.title}`} back={back}>
                {result.saved === false && (
                    <p className={`${cardClass} mb-6 text-amber-700 bg-amber-50`}>โหมดดูตัวอย่าง: ผลสอบนี้ไม่ถูกบันทึก</p>
                )}
                <AttemptReview result={result} />
                <div className="flex flex-wrap gap-2 mt-8">
                    <button onClick={retry} className={primaryButton}>ทำข้อสอบอีกครั้ง</button>
                    <Link href={`/student/modules/${moduleInfo.id}`} className={secondaryButton}>ทบทวนบทเรียน</Link>
                    <Link href={`/student/courses/${moduleInfo.course_id}`} className={secondaryButton}>ไปบทเรียนอื่น</Link>
                </div>
            </PageShell>
        );
    }

    // --- หน้าทำข้อสอบ ---
    return (
        <PageShell title={`แบบทดสอบ: ${moduleInfo.title}`} back={back}>
            {quizzes.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-lg italic">บทเรียนนี้ยังไม่มีข้อสอบ</p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                        {isPreview && (
                            <p className={`${cardClass} mb-6 text-amber-700 bg-amber-50`}>
                                คุณเป็นผู้สอนวิชานี้: ทำข้อสอบได้ในโหมดดูตัวอย่าง คะแนนจะไม่ถูกบันทึก
                            </p>
                        )}
                        <ol className="space-y-4">
                            {quizzes.map((q, i) => (
                                <li key={q.id} className={cardClass}>
                                    <fieldset>
                                        <legend className="font-bold text-gray-900 mb-4 break-words whitespace-pre-line">
                                            <span className="text-indigo-300 mr-2">ข้อ {i + 1}</span>{q.question}
                                        </legend>
                                        <div className="grid sm:grid-cols-2 gap-2">
                                            {ANSWER_KEYS.map(k => {
                                                const checked = answers[q.id] === k;
                                                return (
                                                    <label key={k} className={`flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer border-2 transition ${checked
                                                        ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}>
                                                        <input type="radio" name={`q-${q.id}`} value={k} checked={checked}
                                                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: k }))}
                                                            className="mt-1 w-4 h-4 accent-indigo-600 shrink-0" />
                                                        <span className="font-bold text-gray-500 shrink-0">{k.toUpperCase()}.</span>
                                                        <span className="flex-1 min-w-0 break-words">{q[OPTION_FIELD[k]]}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </fieldset>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <aside className="lg:col-span-1">
                        <div className={`${cardClass} lg:sticky lg:top-24 space-y-4`}>
                            <div>
                                <p className="text-sm text-gray-500">ตอบแล้ว</p>
                                <p className="text-3xl font-black">{answeredCount}<span className="text-lg text-gray-400"> / {quizzes.length}</span></p>
                                <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden" role="progressbar"
                                    aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={quizzes.length} aria-label="ความคืบหน้าการตอบ">
                                    <div className="h-full bg-indigo-600 transition-all" style={{ width: `${(answeredCount / quizzes.length) * 100}%` }} />
                                </div>
                            </div>
                            {submitError && <p role="alert" className={errorBox}>{submitError}</p>}
                            <button onClick={submit} disabled={submitting || answeredCount === 0} className={`${primaryButton} w-full`}>
                                {submitting ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
                            </button>

                            {history.length > 0 && (
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-sm font-bold text-gray-700 mb-2">ประวัติการสอบ</p>
                                    <ul className="space-y-1 text-sm">
                                        {history.slice(0, 5).map(h => (
                                            <li key={h.id}>
                                                <Link href={`/student/attempts/${h.id}`} className="flex justify-between gap-2 hover:text-indigo-600">
                                                    <span className="text-gray-400 truncate">{formatThaiDateTime(h.created_at)}</span>
                                                    <span className={`font-bold shrink-0 ${h.passed ? 'text-green-700' : 'text-amber-700'}`}>{h.score}/{h.total}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </PageShell>
    );
}
