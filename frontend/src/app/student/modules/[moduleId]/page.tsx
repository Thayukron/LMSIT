"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, ClipboardCheck, RefreshCw, Lock, Zap } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type {
    ChatContent, FlashcardsContent, MindmapContent, ModuleDetail, PracticeContent, Quiz, StoryContent, StyledContent,
} from '@/lib/types';
import { LEARNING_STYLES, STYLE_GROUPS, findStyle, type LearningStyle } from '@/lib/visual';
import { Alert, Button, PageLoader, cx } from '@/components/ui';
import GeneratingScreen from '@/components/lesson/GeneratingScreen';
import LessonReader from '@/components/lesson/LessonReader';
import StoryReader from '@/components/lesson/StoryReader';
import ChatReader from '@/components/lesson/ChatReader';
import FlashcardDeck from '@/components/lesson/FlashcardDeck';
import MindMapView from '@/components/lesson/MindMapView';
import PracticeGames from '@/components/lesson/PracticeGames';

type AnyContent = StyledContent | StoryContent | ChatContent | FlashcardsContent | MindmapContent | PracticeContent;
type View = { kind: 'select' } | { kind: 'loading'; style: string } | { kind: 'read'; style: string } | { kind: 'error'; style: string; message: string };

// แสดงเนื้อหาตามรูปแบบของสไตล์ที่เลือก
function ContentView({ style, content, ...rest }: {
    style: LearningStyle; content: AnyContent; moduleInfo: ModuleDetail; hasQuiz: boolean; onChangeStyle: () => void;
}) {
    switch (style.kind) {
        case 'story': return <StoryReader style={style} content={content as StoryContent} {...rest} />;
        case 'chat': return <ChatReader style={style} content={content as ChatContent} {...rest} />;
        case 'flashcards': return <FlashcardDeck style={style} content={content as FlashcardsContent} {...rest} />;
        case 'mindmap': return <MindMapView style={style} content={content as MindmapContent} {...rest} />;
        case 'practice': return <PracticeGames style={style} content={content as PracticeContent} {...rest} />;
        default: return <LessonReader style={style} content={content as StyledContent} {...rest} />;
    }
}

function StyleCard({ style, status, onOpen, delay }: {
    style: LearningStyle; status: 'opened' | 'ready' | 'locked' | 'new'; onOpen: () => void; delay: number;
}) {
    const locked = status === 'locked';
    return (
        <button type="button" onClick={onOpen} disabled={locked}
            className={cx('group h-full flex flex-col text-left rounded-[1.75rem] bg-white p-2 ring-1 ring-slate-200/70 shadow-soft transition-all duration-300 animate-fade-up focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
                locked ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1.5 hover:shadow-lift hover:ring-brand-300')}
            style={{ animationDelay: `${delay}ms` }}>
            <div className={`relative h-32 rounded-[1.4rem] bg-gradient-to-br ${style.gradient} flex items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 bg-dots opacity-30" aria-hidden="true" />
                <span className={cx('relative text-6xl transition-transform duration-300', !locked && 'group-hover:scale-110')} aria-hidden="true">{style.emoji}</span>
                {status === 'opened' && <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-emerald-700">เปิดแล้ว</span>}
                {status === 'ready' && <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-brand-700 inline-flex items-center gap-1"><Zap size={11} /> พร้อมเรียน</span>}
                {locked && <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-slate-600 inline-flex items-center gap-1"><Lock size={11} /> ยังไม่เปิดใช้</span>}
            </div>
            <div className="p-4 pb-5 flex-1 flex flex-col">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{style.en}</div>
                <div className="mt-0.5 text-lg font-bold text-ink leading-snug">{style.name}</div>
                <p className="mt-1.5 text-sm text-slate-500 leading-6 min-h-12">{style.description}</p>
                <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                        {style.tags.map(t => <span key={t} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.soft}`}>{t}</span>)}
                    </div>
                    {!locked && (
                        <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-brand-600 group-hover:text-white transition">
                            <ArrowRight size={16} />
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

export default function LessonPage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const [moduleInfo, setModuleInfo] = useState<ModuleDetail | null>(null);
    const [quizCount, setQuizCount] = useState(0);
    const [loadError, setLoadError] = useState('');
    const [view, setView] = useState<View>({ kind: 'select' });
    // เนื้อหาที่โหลดแล้วของแต่ละสไตล์ สลับกลับมาได้ทันทีไม่ต้องรอ
    const [contents, setContents] = useState<Record<string, AnyContent>>({});

    useEffect(() => {
        apiFetch<ModuleDetail>(`/api/modules/${moduleId}`).then(setModuleInfo).catch(err => setLoadError(err.message));
        apiFetch<Quiz[]>(`/api/modules/${moduleId}/quizzes`).then(q => setQuizCount(q.length)).catch(console.error);
    }, [moduleId]);

    const openStyle = async (styleId: string) => {
        window.scrollTo({ top: 0 });
        if (contents[styleId]) return setView({ kind: 'read', style: styleId });
        setView({ kind: 'loading', style: styleId });
        try {
            const data = await apiFetch<{ content: string | AnyContent }>(`/api/modules/${moduleId}/content?style=${encodeURIComponent(styleId)}`);
            const parsed: AnyContent = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
            setContents(prev => ({ ...prev, [styleId]: parsed }));
            setView({ kind: 'read', style: styleId });
        } catch (e) {
            setView({ kind: 'error', style: styleId, message: e instanceof ApiError ? e.message : 'AI สร้างเนื้อหาไม่สำเร็จ กรุณาลองใหม่' });
        }
    };
    const backToPicker = () => { setView({ kind: 'select' }); window.scrollTo({ top: 0 }); };

    if (loadError) return <Alert>{loadError}</Alert>;
    if (!moduleInfo) return <PageLoader />;

    if (view.kind === 'loading') {
        const s = findStyle(view.style)!;
        return <GeneratingScreen styleName={s.name} emoji={s.emoji} gradient={s.gradient} />;
    }
    if (view.kind === 'read' && contents[view.style]) {
        return <ContentView style={findStyle(view.style)!} content={contents[view.style]} moduleInfo={moduleInfo} hasQuiz={quizCount > 0} onChangeStyle={backToPicker} />;
    }

    const cached = new Set(moduleInfo.cached_styles ?? []);
    const statusOf = (id: string) => contents[id] ? 'opened' : cached.has(id) ? 'ready' : !moduleInfo.ai_ready ? 'locked' : 'new';

    // --- เลือกสไตล์การเรียน ---
    return (
        <div className="max-w-6xl mx-auto">
            <Link href={`/student/courses/${moduleInfo.course_id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink">
                <ArrowLeft size={16} /> {moduleInfo.course_title}
            </Link>

            <div className="mt-6 text-center animate-fade-up">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 shadow-soft">
                    ✨ {LEARNING_STYLES.length} วิธีเรียน เลือกแบบที่ใช่สำหรับคุณ
                </span>
                <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold text-ink leading-tight">{moduleInfo.title}</h1>
                <p className="mt-4 text-lg text-slate-500">วันนี้อยากเรียนแบบไหน? อ่าน ฟังเรื่องเล่า หรือลงมือเล่นก็ได้</p>
            </div>

            {!moduleInfo.ai_ready && (
                <Alert tone="info" className="mt-8 max-w-2xl mx-auto">
                    ครูผู้สอนยังไม่ได้เปิดใช้ AI สำหรับวิชานี้ — เรียนได้เฉพาะสไตล์ที่มีป้าย “พร้อมเรียน”
                    {moduleInfo.can_edit && <> · <Link href={`/teacher/courses/${moduleInfo.course_id}`} className="font-semibold underline">ไปตั้งค่า AI</Link></>}
                </Alert>
            )}

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

            <div className="mt-12 space-y-12">
                {STYLE_GROUPS.map((group, g) => (
                    <section key={group.id} aria-labelledby={`group-${group.id}`}>
                        <div className="mb-5">
                            <h2 id={`group-${group.id}`} className="text-2xl font-bold text-ink">{group.name}</h2>
                            <p className="text-slate-500">{group.description}</p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                            {LEARNING_STYLES.filter(s => s.group === group.id).map((style, i) => (
                                <StyleCard key={style.id} style={style} status={statusOf(style.id)} onOpen={() => openStyle(style.id)} delay={g * 120 + i * 60} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {quizCount > 0 && (
                <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-slate-500">
                    <span>เรียนมาแล้ว อยากทดสอบความรู้เลย?</span>
                    <Button href={`/student/modules/${moduleInfo.id}/quiz`} variant="secondary" size="sm"><ClipboardCheck size={16} /> ไปทำแบบทดสอบ ({quizCount} ข้อ)</Button>
                </div>
            )}
        </div>
    );
}
