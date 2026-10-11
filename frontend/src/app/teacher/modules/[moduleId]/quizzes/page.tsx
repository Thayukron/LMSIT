"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, X, ListChecks, Sparkles, FileQuestion, Save } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { ModuleDetail, Quiz, QuizDraft, QuizStats } from '@/lib/types';
import { emptyDraft, draftError } from '@/lib/quiz';
import QuizCard from '@/components/teacher/QuizCard';
import QuestionEditor from '@/components/teacher/QuestionEditor';
import AiQuizPanel from '@/components/teacher/AiQuizPanel';
import { Alert, Badge, Button, Card, EmptyState, PageLoader } from '@/components/ui';

// ร่างข้อสอบที่ยังไม่บันทึก (key ใช้ให้ React แยกแต่ละข้อได้ตอนลบ/เพิ่ม)
interface DraftItem { key: number; draft: QuizDraft }

export default function TeacherQuizzesPage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const [moduleInfo, setModuleInfo] = useState<ModuleDetail | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [stats, setStats] = useState<QuizStats>({});
    const [loadError, setLoadError] = useState('');
    const [drafts, setDrafts] = useState<DraftItem[]>([]);
    const [showErrors, setShowErrors] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const nextKey = useRef(0);
    const draftsRef = useRef<HTMLElement>(null);

    const loadQuizzes = useCallback(() => {
        apiFetch<Quiz[]>(`/api/modules/${moduleId}/quizzes`).then(setQuizzes).catch(err => setLoadError(err.message));
        apiFetch<QuizStats>(`/api/modules/${moduleId}/quiz-stats`).then(setStats).catch(console.error);
    }, [moduleId]);

    useEffect(() => {
        apiFetch<ModuleDetail>(`/api/modules/${moduleId}`)
            .then(data => {
                if (!data.can_edit) return setLoadError('คุณไม่ใช่ผู้สอนของบทเรียนนี้');
                setModuleInfo(data);
                loadQuizzes();
            })
            .catch(err => setLoadError(err.message));
    }, [moduleId, loadQuizzes]);

    if (loadError) return <Alert>{loadError}</Alert>;
    if (!moduleInfo) return <PageLoader />;

    const addDrafts = (newDrafts: QuizDraft[]) => {
        setDrafts(prev => [...prev, ...newDrafts.map(draft => ({ key: nextKey.current++, draft }))]);
        setNotice('');
        setTimeout(() => draftsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };
    const updateDraft = (key: number, draft: QuizDraft) => setDrafts(prev => prev.map(d => d.key === key ? { key, draft } : d));
    const removeDraft = (key: number) => setDrafts(prev => prev.filter(d => d.key !== key));

    const saveDrafts = async () => {
        setSaveError('');
        if (drafts.some(d => draftError(d.draft))) {
            setShowErrors(true);
            return setSaveError('ยังมีข้อสอบที่กรอกไม่ครบ (ดูข้อที่มีเครื่องหมาย ⚠)');
        }
        setSaving(true);
        try {
            const { message } = await apiFetch<{ message: string }>(`/api/modules/${moduleInfo.id}/quizzes`, {
                method: 'POST',
                body: JSON.stringify({ questions: drafts.map(d => d.draft) }),
            });
            setDrafts([]);
            setShowErrors(false);
            setNotice(message);
            loadQuizzes();
        } catch (err) {
            setSaveError(err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    const discardDrafts = () => {
        if (window.confirm(`ทิ้งร่างข้อสอบทั้งหมด ${drafts.length} ข้อ?`)) {
            setDrafts([]);
            setShowErrors(false);
            setSaveError('');
        }
    };

    const totalAnswered = Object.values(stats).reduce((t, st) => Math.max(t, st.answered), 0);

    return (
        <div className="space-y-6">
            <Link href={`/teacher/modules/${moduleInfo.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink">
                <ArrowLeft size={16} /> {moduleInfo.title}
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-brand-600">คลังข้อสอบ</div>
                    <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-ink break-words">{moduleInfo.title}</h1>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone="brand"><ListChecks size={12} /> {quizzes.length} ข้อ</Badge>
                        {totalAnswered > 0 && <Badge tone="green">นักเรียนสอบแล้ว {totalAnswered} ครั้ง</Badge>}
                    </div>
                </div>
                <Button onClick={() => addDrafts([emptyDraft()])} size="lg"><Plus size={18} /> เพิ่มข้อสอบเอง</Button>
            </div>

            <div className="grid lg:grid-cols-5 gap-8 items-start">
                <div className="lg:col-span-3 space-y-8">
                    {notice && <Alert tone="success">{notice}</Alert>}

                    {drafts.length > 0 && (
                        <section ref={draftsRef} aria-labelledby="drafts-heading" className="scroll-mt-24 rounded-3xl bg-brand-50/60 ring-1 ring-brand-100 p-4 sm:p-6">
                            <div className="flex items-start gap-3 mb-5">
                                <span className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0"><Sparkles size={18} /></span>
                                <div>
                                    <h2 id="drafts-heading" className="text-xl font-bold text-ink">ร่างที่รอตรวจ ({drafts.length} ข้อ)</h2>
                                    <p className="text-sm text-slate-600">ตรวจคำถาม ตัวเลือก และเฉลยให้ถูกต้องก่อนบันทึก โดยเฉพาะข้อที่ AI สร้าง</p>
                                </div>
                            </div>
                            <ol className="space-y-4">
                                {drafts.map((d, i) => (
                                    <li key={d.key}>
                                        <Card className="p-5 sm:p-6 animate-fade-up">
                                            <div className="flex justify-between items-center mb-4">
                                                <Badge tone="brand">ร่างข้อ {i + 1}</Badge>
                                                <button onClick={() => removeDraft(d.key)} className="p-2 -mr-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                    aria-label={`ลบร่างข้อ ${i + 1}`} title="ลบร่างข้อนี้"><X size={18} /></button>
                                            </div>
                                            <QuestionEditor value={d.draft} onChange={draft => updateDraft(d.key, draft)}
                                                error={showErrors ? draftError(d.draft) : null} />
                                        </Card>
                                    </li>
                                ))}
                            </ol>
                            {saveError && <Alert className="mt-4">{saveError}</Alert>}
                            <div className="sticky bottom-4 mt-5 flex flex-wrap gap-2 rounded-2xl bg-white/90 backdrop-blur p-3 ring-1 ring-slate-200 shadow-lift">
                                <Button onClick={saveDrafts} disabled={saving}><Save size={17} /> {saving ? 'กำลังบันทึก...' : `บันทึก ${drafts.length} ข้อ`}</Button>
                                <Button variant="secondary" onClick={() => addDrafts([emptyDraft()])}><Plus size={17} /> เพิ่มอีกข้อ</Button>
                                <Button variant="ghost" onClick={discardDrafts} className="ml-auto">ทิ้งร่างทั้งหมด</Button>
                            </div>
                        </section>
                    )}

                    <section aria-labelledby="saved-heading">
                        <h2 id="saved-heading" className="text-xl font-bold text-ink mb-4">ข้อสอบที่ใช้งานอยู่ ({quizzes.length})</h2>
                        {quizzes.length === 0 ? (
                            <EmptyState icon={<FileQuestion size={28} />} title="ยังไม่มีข้อสอบ"
                                description="ให้ AI ออกข้อสอบจากเนื้อหาบทเรียนได้ในคลิกเดียว หรือเพิ่มข้อสอบเองก็ได้" />
                        ) : (
                            <ol className="space-y-4">
                                {quizzes.map((q, i) => <QuizCard key={q.id} quiz={q} index={i} onChanged={loadQuizzes} stats={stats[q.id]} />)}
                            </ol>
                        )}
                    </section>
                </div>

                <aside className="lg:col-span-2 lg:sticky lg:top-24">
                    <Card className="relative overflow-hidden p-6 sm:p-7">
                        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-brand-300 to-accent-300 opacity-40 blur-2xl" aria-hidden="true" />
                        <div className="relative">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-ink"><Sparkles size={20} className="text-brand-600" /> ให้ AI ช่วยทำข้อสอบ</h2>
                            <p className="text-sm text-slate-500 mt-1 mb-5">ผลจาก AI จะเป็นร่างให้คุณตรวจก่อนเสมอ</p>
                            <AiQuizPanel moduleId={moduleInfo.id} onDrafts={addDrafts} />
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
