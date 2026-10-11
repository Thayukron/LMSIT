"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Layers, Target, Shuffle, ClipboardCheck, CheckCircle2, BookA, ChevronRight } from 'lucide-react';
import type { ModuleDetail, StyledContent } from '@/lib/types';
import type { LEARNING_STYLES } from '@/lib/visual';
import { Button, Card } from '@/components/ui';
import LessonBlockCard, { BLOCK_META } from '@/components/lesson/LessonBlockCard';
import QuickCheckCard from '@/components/lesson/QuickCheckCard';
import InlineMarkdown from '@/components/lesson/InlineMarkdown';

type Style = typeof LEARNING_STYLES[number];

// แถบความคืบหน้าการอ่าน (ติดใต้แถบเมนูด้านบน)
function ReadingProgress() {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);
    return (
        <div className="fixed top-16 inset-x-0 h-1 z-30 bg-transparent" aria-hidden="true">
            <div className="h-full bg-gradient-to-r from-brand-500 via-fuchsia-500 to-orange-400 transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>
    );
}

interface LessonReaderProps {
    content: StyledContent;
    style: Style;
    moduleInfo: ModuleDetail;
    hasQuiz: boolean;
    onChangeStyle: () => void;
}

export default function LessonReader({ content, style, moduleInfo, hasQuiz, onChangeStyle }: LessonReaderProps) {
    const sections = content.sections ?? [];
    const checks = content.quick_checks ?? [];
    // คำถามที่ระบุตำแหน่งเกินจำนวนบล็อก ให้ไปแสดงท้ายบล็อกสุดท้าย
    const checksAfter = (i: number) => checks.filter(q => Math.min(Math.max(q.after_section, 0), sections.length - 1) === i);

    return (
        <div className="-mt-2">
            <ReadingProgress />

            {/* Hero */}
            <header className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${style.gradient} text-white p-6 sm:p-12 animate-fade-up`}>
                <div className="absolute inset-0 bg-dots opacity-25" aria-hidden="true" />
                <span className="absolute -right-6 -bottom-10 text-[11rem] opacity-20 select-none" aria-hidden="true">{content.emoji}</span>
                <div className="relative max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Link href={`/student/courses/${moduleInfo.course_id}`} className="inline-flex items-center gap-1.5 text-white/85 hover:text-white">
                            <ArrowLeft size={16} /> {moduleInfo.course_title}
                        </Link>
                        <ChevronRight size={14} className="text-white/50" />
                        <span className="text-white/85 truncate">{moduleInfo.title}</span>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
                        <span className="rounded-full bg-white/20 backdrop-blur px-3 py-1">{style.emoji} {style.name}</span>
                        <span className="rounded-full bg-white/20 backdrop-blur px-3 py-1 inline-flex items-center gap-1.5"><Clock size={14} /> {content.estimated_minutes || 5} นาที</span>
                        <span className="rounded-full bg-white/20 backdrop-blur px-3 py-1 inline-flex items-center gap-1.5"><Layers size={14} /> {sections.length} หัวข้อ</span>
                    </div>
                    <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold leading-tight">
                        <span className="mr-3" aria-hidden="true">{content.emoji}</span>{content.headline}
                    </h1>
                    <p className="mt-5 text-lg sm:text-xl text-white/90 leading-relaxed"><InlineMarkdown>{content.intro}</InlineMarkdown></p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button href="#block-0" variant="white" size="lg">เริ่มอ่านเลย</Button>
                        <Button onClick={onChangeStyle} variant="ghost" size="lg" className="text-white hover:bg-white/15 hover:text-white">
                            <Shuffle size={18} /> เปลี่ยนสไตล์
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mt-10 grid lg:grid-cols-[1fr_260px] gap-10">
                <article className="min-w-0 max-w-3xl space-y-8">
                    {content.objectives?.length > 0 && (
                        <Card className="p-6 sm:p-8">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Target size={20} className="text-brand-600" /> เรียนจบบทนี้แล้ว คุณจะ...</h2>
                            <ul className="mt-4 grid gap-3">
                                {content.objectives.map(o => (
                                    <li key={o} className="flex items-start gap-3 text-slate-700">
                                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" /> <span><InlineMarkdown>{o}</InlineMarkdown></span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {sections.map((block, i) => (
                        <React.Fragment key={i}>
                            <LessonBlockCard block={block} index={i} />
                            {checksAfter(i).map((q, j) => <QuickCheckCard key={`${i}-${j}`} check={q} />)}
                        </React.Fragment>
                    ))}

                    {content.key_terms?.length > 0 && (
                        <section id="key-terms" className="scroll-mt-28">
                            <h2 className="flex items-center gap-2 text-2xl font-bold text-ink mb-4"><BookA size={24} className="text-brand-600" /> คำศัพท์น่ารู้</h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {content.key_terms.map(t => (
                                    <div key={t.term} className="rounded-2xl bg-white ring-1 ring-slate-200/70 p-5 hover:ring-brand-300 transition">
                                        <div className="font-bold text-brand-700">{t.term}</div>
                                        <div className="mt-1 text-sm text-slate-600 leading-6"><InlineMarkdown>{t.meaning}</InlineMarkdown></div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {content.key_points?.length > 0 && (
                        <section id="summary" className="scroll-mt-28 rounded-3xl bg-ink text-white p-6 sm:p-10">
                            <h2 className="text-2xl font-bold">📌 สรุปสิ่งที่ต้องจำ</h2>
                            <ol className="mt-6 space-y-4">
                                {content.key_points.map((p, i) => (
                                    <li key={i} className="flex gap-4">
                                        <span className="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-brand-300 to-fuchsia-300 shrink-0 w-8">{String(i + 1).padStart(2, '0')}</span>
                                        <span className="text-white/90 leading-7 pt-1 [&_strong]:text-white"><InlineMarkdown>{p}</InlineMarkdown></span>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )}

                    <section className="rounded-3xl bg-gradient-to-br from-brand-50 via-white to-fuchsia-50 ring-1 ring-brand-100 p-6 sm:p-10 text-center">
                        <div className="text-5xl" aria-hidden="true">🏁</div>
                        <h2 className="mt-4 text-2xl font-bold text-ink">อ่านจบแล้ว เก่งมาก!</h2>
                        {content.closing && <p className="mt-3 text-slate-600 max-w-xl mx-auto leading-7"><InlineMarkdown>{content.closing}</InlineMarkdown></p>}
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            {hasQuiz
                                ? <Button href={`/student/modules/${moduleInfo.id}/quiz`} size="lg"><ClipboardCheck size={18} /> ทำแบบทดสอบ</Button>
                                : <span className="text-sm text-slate-500">บทเรียนนี้ยังไม่มีแบบทดสอบ</span>}
                            <Button onClick={onChangeStyle} variant="secondary" size="lg"><Shuffle size={18} /> ลองอ่านสไตล์อื่น</Button>
                        </div>
                    </section>
                </article>

                {/* สารบัญ (จอใหญ่) */}
                <aside className="hidden lg:block">
                    <nav className="sticky top-28 rounded-3xl bg-white ring-1 ring-slate-200/70 p-5" aria-label="สารบัญบทเรียน">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ในบทนี้</div>
                        <ol className="space-y-1">
                            {sections.map((b, i) => (
                                <li key={i}>
                                    <a href={`#block-${i}`} className="flex items-start gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-ink transition">
                                        <span className="shrink-0" aria-hidden="true">{b.emoji}</span>
                                        <span className="line-clamp-2">{b.title}</span>
                                    </a>
                                </li>
                            ))}
                            {content.key_terms?.length > 0 && <li><a href="#key-terms" className="block rounded-xl px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50">📖 คำศัพท์น่ารู้</a></li>}
                            {content.key_points?.length > 0 && <li><a href="#summary" className="block rounded-xl px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50">📌 สรุป</a></li>}
                        </ol>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {[...new Set(sections.map(s => s.type))].map(t => (
                                <span key={t} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${(BLOCK_META[t] ?? BLOCK_META.concept).chip}`}>{(BLOCK_META[t] ?? BLOCK_META.concept).label}</span>
                            ))}
                        </div>
                    </nav>
                </aside>
            </div>
        </div>
    );
}
