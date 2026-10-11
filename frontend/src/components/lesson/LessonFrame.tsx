"use client";
// ส่วนประกอบที่เนื้อหาทุกรูปแบบใช้ร่วมกัน: แถบความคืบหน้า, ส่วนหัว (hero), สรุป และส่วนปิดท้าย
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Shuffle, ClipboardCheck, ChevronRight } from 'lucide-react';
import type { ContentHeader, ModuleDetail } from '@/lib/types';
import type { LearningStyle } from '@/lib/visual';
import { Button } from '@/components/ui';
import InlineMarkdown from '@/components/lesson/InlineMarkdown';

// แถบความคืบหน้าการอ่าน (ติดใต้แถบเมนูด้านบน)
export function ReadingProgress() {
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
            <div className="h-full bg-gradient-to-r from-brand-500 via-accent-500 to-warm-400 transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>
    );
}

interface LessonHeroProps {
    content: ContentHeader;
    style: LearningStyle;
    moduleInfo: ModuleDetail;
    meta?: React.ReactNode;     // ป้ายข้อมูลเพิ่มเติม เช่น จำนวนหัวข้อ
    startHref?: string;         // ปุ่มเริ่ม (เลื่อนไปยังเนื้อหา)
    startLabel?: string;
    onChangeStyle: () => void;
}

export function LessonHero({ content, style, moduleInfo, meta, startHref, startLabel = 'เริ่มเลย', onChangeStyle }: LessonHeroProps) {
    return (
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
                    {meta}
                </div>
                <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold leading-tight">
                    <span className="mr-3" aria-hidden="true">{content.emoji}</span>{content.headline}
                </h1>
                <p className="mt-5 text-lg sm:text-xl text-white/90 leading-relaxed"><InlineMarkdown>{content.intro}</InlineMarkdown></p>
                <div className="mt-8 flex flex-wrap gap-3">
                    {startHref && <Button href={startHref} variant="white" size="lg">{startLabel}</Button>}
                    <Button onClick={onChangeStyle} variant="ghost" size="lg" className="text-white hover:bg-white/15 hover:text-white">
                        <Shuffle size={18} /> เปลี่ยนสไตล์
                    </Button>
                </div>
            </div>
        </header>
    );
}

export function MetaChip({ children }: { children: React.ReactNode }) {
    return <span className="rounded-full bg-white/20 backdrop-blur px-3 py-1 inline-flex items-center gap-1.5">{children}</span>;
}

// กล่องสรุปสิ่งที่ต้องจำ (พื้นเข้ม)
export function KeyPoints({ points, title = '📌 สรุปสิ่งที่ต้องจำ', id = 'summary' }: { points: string[]; title?: string; id?: string }) {
    if (!points?.length) return null;
    return (
        <section id={id} className="scroll-mt-28 rounded-3xl bg-ink text-white p-6 sm:p-10">
            <h2 className="text-2xl font-bold">{title}</h2>
            <ol className="mt-6 space-y-4">
                {points.map((p, i) => (
                    <li key={i} className="flex gap-4">
                        <span className="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-brand-300 to-accent-300 shrink-0 w-8">{String(i + 1).padStart(2, '0')}</span>
                        <span className="text-white/90 leading-7 pt-1 [&_strong]:text-white"><InlineMarkdown>{p}</InlineMarkdown></span>
                    </li>
                ))}
            </ol>
        </section>
    );
}

// ส่วนปิดท้าย: ชวนไปทำแบบทดสอบ หรือลองสไตล์อื่น
export function LessonFinish({ moduleInfo, hasQuiz, onChangeStyle, message, title = 'เรียนจบแล้ว เก่งมาก!', emoji = '🏁' }: {
    moduleInfo: ModuleDetail; hasQuiz: boolean; onChangeStyle: () => void; message?: string; title?: string; emoji?: string;
}) {
    return (
        <section className="rounded-3xl bg-gradient-to-br from-brand-50 via-white to-accent-100 ring-1 ring-brand-100 p-6 sm:p-10 text-center">
            <div className="text-5xl" aria-hidden="true">{emoji}</div>
            <h2 className="mt-4 text-2xl font-bold text-ink">{title}</h2>
            {message && <p className="mt-3 text-slate-600 max-w-xl mx-auto leading-7"><InlineMarkdown>{message}</InlineMarkdown></p>}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                {hasQuiz
                    ? <Button href={`/student/modules/${moduleInfo.id}/quiz`} size="lg"><ClipboardCheck size={18} /> ทำแบบทดสอบ</Button>
                    : <span className="text-sm text-slate-500 self-center">บทเรียนนี้ยังไม่มีแบบทดสอบ</span>}
                <Button onClick={onChangeStyle} variant="secondary" size="lg"><Shuffle size={18} /> ลองเรียนสไตล์อื่น</Button>
            </div>
        </section>
    );
}
