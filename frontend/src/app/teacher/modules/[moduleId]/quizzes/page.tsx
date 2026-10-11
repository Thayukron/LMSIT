"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { ModuleDetail, Quiz, QuizDraft } from '@/lib/types';
import { emptyDraft, draftError } from '@/lib/quiz';
import PageShell from '@/components/PageShell';
import Spinner from '@/components/Spinner';
import QuizCard from '@/components/teacher/QuizCard';
import QuestionEditor from '@/components/teacher/QuestionEditor';
import AiQuizPanel from '@/components/teacher/AiQuizPanel';
import { cardClass, primaryButton, secondaryButton, errorBox, successBox } from '@/lib/ui';

// ร่างข้อสอบที่ยังไม่บันทึก (key ใช้ให้ React แยกแต่ละข้อได้ตอนลบ/เพิ่ม)
interface DraftItem { key: number; draft: QuizDraft }

export default function TeacherQuizzesPage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const [moduleInfo, setModuleInfo] = useState<ModuleDetail | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loadError, setLoadError] = useState('');
    const [drafts, setDrafts] = useState<DraftItem[]>([]);
    const [showErrors, setShowErrors] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const nextKey = useRef(0);
    const draftsRef = useRef<HTMLDivElement>(null);

    const loadQuizzes = useCallback(() => {
        apiFetch<Quiz[]>(`/api/modules/${moduleId}/quizzes`).then(setQuizzes).catch(err => setLoadError(err.message));
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

    if (loadError) {
        return <PageShell title="เกิดข้อผิดพลาด" back={{ href: '/teacher', label: 'วิชาที่ฉันสอน' }}><p className="text-red-600">{loadError}</p></PageShell>;
    }
    if (!moduleInfo) return <Spinner />;

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

    return (
        <PageShell
            title={`ข้อสอบ: ${moduleInfo.title}`}
            back={{ href: `/teacher/modules/${moduleInfo.id}`, label: moduleInfo.title }}
            actions={
                <button onClick={() => addDrafts([emptyDraft()])} className={`${primaryButton} flex items-center gap-2`}>
                    <Plus size={18} /> เพิ่มข้อสอบเอง
                </button>
            }
        >
            <div className="grid lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    {notice && <p role="status" className={successBox}>{notice}</p>}

                    {drafts.length > 0 && (
                        <section ref={draftsRef} aria-labelledby="drafts-heading" className="scroll-mt-24">
                            <h3 id="drafts-heading" className="font-bold text-xl mb-1">ร่างที่ยังไม่บันทึก ({drafts.length})</h3>
                            <p className="text-sm text-gray-500 mb-4">ตรวจและแก้ไขให้ถูกต้องก่อนบันทึก โดยเฉพาะข้อสอบที่ AI สร้าง</p>
                            <ol className="space-y-4">
                                {drafts.map((d, i) => (
                                    <li key={d.key} className={`${cardClass} border-2 border-dashed border-indigo-200`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-black text-indigo-300">ร่างข้อ {i + 1}</span>
                                            <button onClick={() => removeDraft(d.key)} className="p-2 text-gray-400 hover:text-red-600"
                                                aria-label={`ลบร่างข้อ ${i + 1}`} title="ลบร่างข้อนี้"><X size={18} /></button>
                                        </div>
                                        <QuestionEditor value={d.draft} onChange={draft => updateDraft(d.key, draft)}
                                            error={showErrors ? draftError(d.draft) : null} />
                                    </li>
                                ))}
                            </ol>
                            {saveError && <p role="alert" className={`${errorBox} mt-4`}>{saveError}</p>}
                            <div className="flex flex-wrap gap-2 mt-4 sticky bottom-4 bg-gray-50/90 backdrop-blur py-2">
                                <button onClick={saveDrafts} disabled={saving} className={primaryButton}>
                                    {saving ? 'กำลังบันทึก...' : `บันทึกข้อสอบ ${drafts.length} ข้อ`}
                                </button>
                                <button onClick={() => addDrafts([emptyDraft()])} className={secondaryButton}>+ เพิ่มอีกข้อ</button>
                                <button onClick={discardDrafts} className={secondaryButton}>ทิ้งร่างทั้งหมด</button>
                            </div>
                        </section>
                    )}

                    <section aria-labelledby="saved-heading">
                        <h3 id="saved-heading" className="font-bold text-xl mb-4">ข้อสอบที่บันทึกแล้ว ({quizzes.length})</h3>
                        {quizzes.length === 0 ? (
                            <p className="text-gray-400 bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                                ยังไม่มีข้อสอบ เพิ่มเอง หรือให้ AI ช่วยจากแผงด้านข้าง
                            </p>
                        ) : (
                            <ol className="space-y-4">
                                {quizzes.map((q, i) => <QuizCard key={q.id} quiz={q} index={i} onChanged={loadQuizzes} />)}
                            </ol>
                        )}
                    </section>
                </div>

                <aside className="lg:col-span-2">
                    <div className={`${cardClass} lg:sticky lg:top-24`}>
                        <h3 className="font-bold text-xl mb-4">ให้ AI ช่วยทำข้อสอบ</h3>
                        <AiQuizPanel moduleId={moduleInfo.id} onDrafts={addDrafts} />
                    </div>
                </aside>
            </div>
        </PageShell>
    );
}
