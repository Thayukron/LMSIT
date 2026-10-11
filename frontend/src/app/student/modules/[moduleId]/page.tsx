"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, ClipboardCheck, RefreshCw } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { ModuleDetail, Quiz, StyledContent } from '@/lib/types';
import { LEARNING_STYLES, findStyle } from '@/lib/visual';
import { Alert, Button, PageLoader } from '@/components/ui';
import GeneratingScreen from '@/components/lesson/GeneratingScreen';
import LessonReader from '@/components/lesson/LessonReader';

type View = { kind: 'select' } | { kind: 'loading'; style: string } | { kind: 'read'; style: string } | { kind: 'error'; style: string; message: string };

export default function LessonPage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const [moduleInfo, setModuleInfo] = useState<ModuleDetail | null>(null);
    const [quizCount, setQuizCount] = useState(0);
    const [loadError, setLoadError] = useState('');
    const [view, setView] = useState<View>({ kind: 'select' });
    // เก็บเนื้อหาที่โหลดแล้วของแต่ละสไตล์ สลับกลับมาได้ทันทีไม่ต้องรอ
    const [contents, setContents] = useState<Record<string, StyledContent>>({});

    useEffect(() => {
        apiFetch<ModuleDetail>(`/api/modules/${moduleId}`).then(setModuleInfo).catch(err => setLoadError(err.message));
        apiFetch<Quiz[]>(`/api/modules/${moduleId}/quizzes`).then(q => setQuizCount(q.length)).catch(console.error);
    }, [moduleId]);

    const openStyle = async (styleId: string) => {
        window.scrollTo({ top: 0 });
        if (contents[styleId]) return setView({ kind: 'read', style: styleId });
        setView({ kind: 'loading', style: styleId });
        try {
            const data = await apiFetch<{ content: string | StyledContent }>(
                `/api/modules/${moduleId}/content?style=${encodeURIComponent(styleId)}`
            );
            const parsed: StyledContent = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
            setContents(prev => ({ ...prev, [styleId]: parsed }));
            setView({ kind: 'read', style: styleId });
        } catch (e) {
            const message = e instanceof ApiError ? e.message : 'AI สร้างเนื้อหาไม่สำเร็จ กรุณาลองใหม่';
            setView({ kind: 'error', style: styleId, message });
        }
    };

    if (loadError) return <Alert>{loadError}</Alert>;
    if (!moduleInfo) return <PageLoader />;

    if (view.kind === 'loading') {
        const s = findStyle(view.style)!;
        return <GeneratingScreen styleName={s.name} emoji={s.emoji} gradient={s.gradient} />;
    }

    if (view.kind === 'read' && contents[view.style]) {
        return (
            <LessonReader content={contents[view.style]} style={findStyle(view.style)!} moduleInfo={moduleInfo}
                hasQuiz={quizCount > 0} onChangeStyle={() => { setView({ kind: 'select' }); window.scrollTo({ top: 0 }); }} />
        );
    }

    // --- เลือกสไตล์การเรียน ---
    return (
        <div className="max-w-6xl mx-auto">
            <Link href={`/student/courses/${moduleInfo.course_id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink">
                <ArrowLeft size={16} /> {moduleInfo.course_title}
            </Link>

            <div className="mt-6 text-center animate-fade-up">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 shadow-soft">
                    ✨ AI ปรับบทเรียนให้เข้ากับคุณ
                </span>
                <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold text-ink leading-tight">{moduleInfo.title}</h1>
                <p className="mt-4 text-lg text-slate-500">วันนี้อยากเรียนแบบไหน? เลือกสไตล์ที่ใช่ แล้วเริ่มได้เลย</p>
            </div>

            {view.kind === 'error' && (
                <div className="mt-8 max-w-2xl mx-auto">
                    <Alert>
                        <div>{view.message}</div>
                        <button onClick={() => openStyle(view.style)} className="mt-2 inline-flex items-center gap-1.5 font-semibold underline">
                            <RefreshCw size={14} /> ลองอีกครั้ง
                        </button>
                    </Alert>
                </div>
            )}

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {LEARNING_STYLES.map((style, i) => (
                    <button key={style.id} type="button" onClick={() => openStyle(style.id)}
                        className="group text-left rounded-[1.75rem] bg-white p-2 ring-1 ring-slate-200/70 shadow-soft hover:-translate-y-1.5 hover:shadow-lift hover:ring-brand-300 transition-all duration-300 animate-fade-up focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
                        style={{ animationDelay: `${i * 70}ms` }}>
                        <div className={`relative h-40 rounded-[1.4rem] bg-gradient-to-br ${style.gradient} flex items-center justify-center overflow-hidden`}>
                            <div className="absolute inset-0 bg-dots opacity-30" aria-hidden="true" />
                            <span className="relative text-7xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" aria-hidden="true">{style.emoji}</span>
                            {contents[style.id] && <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-emerald-700">อ่านแล้ว</span>}
                        </div>
                        <div className="p-4 pb-5">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{style.en}</div>
                            <div className="mt-1 text-xl font-bold text-ink">{style.name}</div>
                            <p className="mt-2 text-sm text-slate-500 leading-6 min-h-12">{style.description}</p>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex gap-1.5">
                                    {style.tags.map(t => <span key={t} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.soft}`}>{t}</span>)}
                                </div>
                                <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition">
                                    <ArrowRight size={16} />
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {quizCount > 0 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-slate-500">
                    <span>เรียนมาแล้ว อยากทดสอบความรู้เลย?</span>
                    <Button href={`/student/modules/${moduleInfo.id}/quiz`} variant="secondary" size="sm"><ClipboardCheck size={16} /> ไปทำแบบทดสอบ ({quizCount} ข้อ)</Button>
                </div>
            )}
        </div>
    );
}
