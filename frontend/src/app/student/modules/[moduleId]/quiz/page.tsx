"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronLeft, ClipboardCheck, History, RotateCcw, BookOpen, Send } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { AnswerKey, AttemptResult, AttemptSummary, ModuleDetail, Quiz } from '@/lib/types';
import { ANSWER_KEYS, OPTION_FIELD } from '@/lib/quiz';
import { Alert, Badge, Button, Card, EmptyState, PageLoader, ProgressBar, cx } from '@/components/ui';
import AttemptReview, { formatThaiDateTime } from '@/components/AttemptReview';

export default function QuizPage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const [moduleInfo, setModuleInfo] = useState<ModuleDetail | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
    const [history, setHistory] = useState<AttemptSummary[]>([]);
    const [started, setStarted] = useState(false);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<number, AnswerKey>>({});
    const [result, setResult] = useState<AttemptResult | null>(null);
    const [loadError, setLoadError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadHistory = useCallback(() => {
        apiFetch<AttemptSummary[]>(`/api/modules/${moduleId}/attempts`).then(setHistory).catch(console.error);
    }, [moduleId]);

    useEffect(() => {
        Promise.all([apiFetch<ModuleDetail>(`/api/modules/${moduleId}`), apiFetch<Quiz[]>(`/api/modules/${moduleId}/quizzes`)])
            .then(([m, q]) => { setModuleInfo(m); setQuizzes(q); })
            .catch(err => setLoadError(err.message));
        loadHistory();
    }, [moduleId, loadHistory]);

    const total = quizzes?.length ?? 0;
    const question = quizzes?.[current];

    const choose = useCallback((key: AnswerKey) => {
        if (!question) return;
        setAnswers(prev => ({ ...prev, [question.id]: key }));
    }, [question]);

    // ปุ่มลัด: A-D เลือกคำตอบ, ←/→ เปลี่ยนข้อ
    useEffect(() => {
        if (!started || result) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            const k = e.key.toLowerCase();
            if (['a', 'b', 'c', 'd'].includes(k)) choose(k as AnswerKey);
            if (e.key === 'ArrowRight') setCurrent(c => Math.min(c + 1, total - 1));
            if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [started, result, total, choose]);

    if (loadError) return <Alert>{loadError}</Alert>;
    if (!moduleInfo || !quizzes) return <PageLoader />;

    const answeredCount = quizzes.filter(q => answers[q.id]).length;
    const isPreview = moduleInfo.can_edit;
    const best = history.reduce<AttemptSummary | null>((b, h) => (!b || h.percent > b.percent ? h : b), null);

    const submit = async () => {
        const unanswered = total - answeredCount;
        if (unanswered > 0 && !window.confirm(`ยังไม่ได้ตอบ ${unanswered} ข้อ (นับเป็นผิด)\nต้องการส่งคำตอบเลยหรือไม่?`)) return;
        setSubmitError('');
        setSubmitting(true);
        try {
            const res = await apiFetch<AttemptResult>(`/api/modules/${moduleInfo.id}/attempts`, { method: 'POST', body: JSON.stringify({ answers }) });
            setResult(res);
            loadHistory();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setSubmitError(err instanceof ApiError ? err.message : 'ส่งคำตอบไม่สำเร็จ');
        } finally {
            setSubmitting(false);
        }
    };

    const restart = () => { setAnswers({}); setResult(null); setCurrent(0); setStarted(true); window.scrollTo({ top: 0 }); };
    const backLink = (
        <Link href={`/student/modules/${moduleInfo.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink">
            <ArrowLeft size={16} /> {moduleInfo.title}
        </Link>
    );

    // ---------- ผลสอบ ----------
    if (result) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {backLink}
                {result.saved === false && <Alert tone="warning">โหมดดูตัวอย่างของผู้สอน: ผลสอบนี้ไม่ถูกบันทึก</Alert>}
                <AttemptReview result={result} />
                <div className="sticky bottom-4 flex flex-wrap justify-center gap-3 rounded-2xl bg-white/80 backdrop-blur p-3 ring-1 ring-slate-200 shadow-lift">
                    <Button onClick={restart}><RotateCcw size={18} /> ทำอีกครั้ง</Button>
                    <Button href={`/student/modules/${moduleInfo.id}`} variant="secondary"><BookOpen size={18} /> ทบทวนบทเรียน</Button>
                    <Button href={`/student/courses/${moduleInfo.course_id}`} variant="ghost">ไปบทถัดไป <ArrowRight size={18} /></Button>
                </div>
            </div>
        );
    }

    // ---------- หน้าเริ่มสอบ ----------
    if (!started || !question) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {backLink}
                {total === 0 ? (
                    <EmptyState icon={<ClipboardCheck size={28} />} title="บทเรียนนี้ยังไม่มีแบบทดสอบ" description="ครูกำลังเตรียมข้อสอบ ระหว่างนี้ทบทวนบทเรียนไปก่อนได้เลย"
                        action={<Button href={`/student/modules/${moduleInfo.id}`} variant="secondary">กลับไปบทเรียน</Button>} />
                ) : (
                    <>
                        <Card className="relative overflow-hidden p-8 sm:p-12 text-center animate-fade-up">
                            <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-brand-50 to-transparent" aria-hidden="true" />
                            <div className="relative">
                                <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lift animate-float">
                                    <ClipboardCheck size={36} />
                                </div>
                                <div className="mt-6 text-sm font-semibold text-brand-600">แบบทดสอบท้ายบทเรียน</div>
                                <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-ink">{moduleInfo.title}</h1>
                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    <Badge tone="brand">{total} ข้อ</Badge>
                                    <Badge tone="green">เกณฑ์ผ่าน 60%</Badge>
                                    <Badge tone="slate">ไม่จำกัดเวลา</Badge>
                                    {best && <Badge tone="amber">คะแนนดีที่สุด {best.percent}%</Badge>}
                                </div>
                                {isPreview && <Alert tone="warning" className="mt-6 text-left">คุณเป็นผู้สอนวิชานี้: ทำได้ในโหมดดูตัวอย่าง คะแนนจะไม่ถูกบันทึก</Alert>}
                                <Button onClick={() => setStarted(true)} size="lg" className="mt-8">เริ่มทำแบบทดสอบ <ArrowRight size={18} /></Button>
                                <p className="mt-3 text-xs text-slate-400">เคล็ดลับ: กดปุ่ม A B C D บนคีย์บอร์ดเพื่อตอบได้เลย</p>
                            </div>
                        </Card>
                        {history.length > 0 && (
                            <Card className="p-6">
                                <h2 className="flex items-center gap-2 font-bold text-ink mb-3"><History size={18} className="text-slate-400" /> ประวัติการสอบ</h2>
                                <ul className="divide-y divide-slate-100">
                                    {history.slice(0, 6).map(h => (
                                        <li key={h.id}>
                                            <Link href={`/student/attempts/${h.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-brand-700">
                                                <span className="text-sm text-slate-500">{formatThaiDateTime(h.created_at)}</span>
                                                <span className="flex items-center gap-2">
                                                    <span className="font-bold">{h.score}/{h.total}</span>
                                                    <Badge tone={h.passed ? 'green' : 'amber'}>{h.passed ? 'ผ่าน' : 'ไม่ผ่าน'} · {h.percent}%</Badge>
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </>
                )}
            </div>
        );
    }

    // ---------- ทำข้อสอบ (ทีละข้อ) ----------
    const selected = answers[question.id];
    const isLast = current === total - 1;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
                {backLink}
                <span className="text-sm font-semibold text-slate-500">ตอบแล้ว {answeredCount}/{total}</span>
            </div>
            <ProgressBar value={current + 1} max={total} label="ความคืบหน้าการทำข้อสอบ" className="h-2.5" />

            <Card key={question.id} className="mt-6 p-6 sm:p-10 animate-fade-up">
                <div className="flex items-center justify-between">
                    <Badge tone="brand">ข้อ {current + 1} จาก {total}</Badge>
                    {isPreview && <Badge tone="amber">โหมดดูตัวอย่าง</Badge>}
                </div>
                <h1 className="mt-5 text-xl sm:text-2xl font-bold text-ink leading-relaxed whitespace-pre-line break-words">{question.question}</h1>
                <div className="mt-8 grid gap-3" role="radiogroup" aria-label={`ตัวเลือกข้อ ${current + 1}`}>
                    {ANSWER_KEYS.map(k => {
                        const isSelected = selected === k;
                        return (
                            <button key={k} type="button" role="radio" aria-checked={isSelected} onClick={() => choose(k)}
                                className={cx('group flex items-center gap-4 rounded-2xl px-5 py-4 text-left ring-2 transition-all',
                                    isSelected ? 'ring-brand-500 bg-brand-50 shadow-[0_8px_24px_-12px_rgb(106_53_241/0.5)]' : 'ring-slate-200 hover:ring-brand-300 hover:bg-slate-50')}>
                                <span className={cx('w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition',
                                    isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-700')}>
                                    {k.toUpperCase()}
                                </span>
                                <span className={cx('text-base min-w-0 break-words', isSelected ? 'font-semibold text-ink' : 'text-slate-700')}>{question[OPTION_FIELD[k]]}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-10 flex items-center justify-between gap-3">
                    <Button variant="ghost" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}><ChevronLeft size={18} /> ก่อนหน้า</Button>
                    {isLast
                        ? <Button onClick={submit} disabled={submitting || answeredCount === 0} size="lg"><Send size={18} /> {submitting ? 'กำลังส่ง...' : 'ส่งคำตอบ'}</Button>
                        : <Button onClick={() => setCurrent(c => c + 1)}>ข้อถัดไป <ArrowRight size={18} /></Button>}
                </div>
                {submitError && <Alert className="mt-4">{submitError}</Alert>}
            </Card>

            {/* ตารางข้อ: กระโดดไปข้อไหนก็ได้ */}
            <Card className="mt-6 p-5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-600">ไปยังข้อ</span>
                    {!isLast && answeredCount === total && (
                        <Button onClick={submit} size="sm" disabled={submitting}><Send size={15} /> ตอบครบแล้ว ส่งเลย</Button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {quizzes.map((q, i) => (
                        <button key={q.id} type="button" onClick={() => setCurrent(i)} aria-label={`ข้อ ${i + 1}${answers[q.id] ? ' (ตอบแล้ว)' : ''}`}
                            className={cx('w-10 h-10 rounded-xl text-sm font-bold transition',
                                i === current ? 'bg-ink text-white' : answers[q.id] ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
                            {i + 1}
                        </button>
                    ))}
                </div>
            </Card>
        </div>
    );
}
