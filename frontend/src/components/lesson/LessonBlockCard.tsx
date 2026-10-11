import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Lightbulb, FlaskConical, Puzzle, ListOrdered, Zap, TriangleAlert, BookOpen, Flag, Telescope, Bookmark } from 'lucide-react';
import type { LessonBlock, LessonBlockType } from '@/lib/types';

// หน้าตาของบล็อกแต่ละชนิด: ป้ายชื่อ ไอคอน และสี
export const BLOCK_META: Record<LessonBlockType, { label: string; icon: React.ReactNode; chip: string; bar: string; tint: string }> = {
    concept: { label: 'แนวคิดหลัก', icon: <Lightbulb size={15} />, chip: 'bg-brand-100 text-brand-700', bar: 'bg-brand-500', tint: 'bg-white' },
    example: { label: 'ตัวอย่างจริง', icon: <FlaskConical size={15} />, chip: 'bg-amber-100 text-amber-800', bar: 'bg-amber-400', tint: 'bg-gradient-to-br from-amber-50/80 to-white' },
    analogy: { label: 'เปรียบเทียบให้เห็นภาพ', icon: <Puzzle size={15} />, chip: 'bg-sky-100 text-sky-800', bar: 'bg-sky-400', tint: 'bg-gradient-to-br from-sky-50/80 to-white' },
    steps: { label: 'ทีละขั้นตอน', icon: <ListOrdered size={15} />, chip: 'bg-teal-100 text-teal-800', bar: 'bg-teal-400', tint: 'bg-white' },
    tip: { label: 'เคล็ดลับ', icon: <Zap size={15} />, chip: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-400', tint: 'bg-gradient-to-br from-emerald-50/80 to-white' },
    warning: { label: 'ระวังเข้าใจผิด', icon: <TriangleAlert size={15} />, chip: 'bg-rose-100 text-rose-700', bar: 'bg-rose-400', tint: 'bg-gradient-to-br from-rose-50/80 to-white' },
    story: { label: 'เรื่องเล่า', icon: <BookOpen size={15} />, chip: 'bg-violet-100 text-violet-800', bar: 'bg-violet-400', tint: 'bg-gradient-to-br from-violet-50/70 to-white' },
    mission: { label: 'ภารกิจ', icon: <Flag size={15} />, chip: 'bg-fuchsia-100 text-fuchsia-800', bar: 'bg-fuchsia-500', tint: 'bg-gradient-to-br from-fuchsia-50/70 to-white' },
    fact: { label: 'รู้หรือไม่?', icon: <Telescope size={15} />, chip: 'bg-cyan-100 text-cyan-800', bar: 'bg-cyan-400', tint: 'bg-gradient-to-br from-cyan-50/70 to-white' },
};

export default function LessonBlockCard({ block, index }: { block: LessonBlock; index: number }) {
    const meta = BLOCK_META[block.type] ?? BLOCK_META.concept;
    return (
        <section id={`block-${index}`} className={`relative scroll-mt-28 rounded-3xl ${meta.tint} ring-1 ring-slate-200/70 shadow-soft overflow-hidden`}>
            <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${meta.bar}`} aria-hidden="true" />
            <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.chip}`}>{meta.icon} {meta.label}</span>
                </div>
                <h2 className="flex items-start gap-3 text-2xl font-bold text-ink leading-snug">
                    <span className="text-3xl leading-none shrink-0" aria-hidden="true">{block.emoji}</span>
                    <span className="min-w-0">{block.title}</span>
                </h2>
                <div className="lesson-prose mt-4">
                    <ReactMarkdown>{block.content}</ReactMarkdown>
                </div>
                {block.highlight && (
                    <div className="mt-6 flex gap-3 rounded-2xl bg-ink text-white px-5 py-4">
                        <Bookmark size={18} className="shrink-0 mt-1 text-amber-300" />
                        <div className="min-w-0">
                            <div className="text-xs font-bold text-amber-300 mb-0.5">จำไว้!</div>
                            <div className="font-semibold leading-7 [&_strong]:text-amber-200">
                                <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{block.highlight}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
