"use client";
import React, { useState } from 'react';
import { ChevronDown, GitBranch, Eye, EyeOff } from 'lucide-react';
import type { MindmapContent } from '@/lib/types';
import { Button, cx } from '@/components/ui';
import InlineMarkdown from '@/components/lesson/InlineMarkdown';
import { KeyPoints, LessonFinish, LessonHero, MetaChip } from '@/components/lesson/LessonFrame';
import type { ReaderProps } from '@/components/lesson/LessonReader';

// สีประจำกิ่ง (วนใช้ตามลำดับ)
const BRANCH_TONES = [
    { head: 'from-sky-400 to-cyan-500', ring: 'ring-sky-200', chip: 'bg-sky-50 hover:bg-sky-100 text-sky-900', line: 'bg-sky-300' },
    { head: 'from-violet-400 to-purple-500', ring: 'ring-violet-200', chip: 'bg-violet-50 hover:bg-violet-100 text-violet-900', line: 'bg-violet-300' },
    { head: 'from-amber-400 to-orange-500', ring: 'ring-amber-200', chip: 'bg-amber-50 hover:bg-amber-100 text-amber-900', line: 'bg-amber-300' },
    { head: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-200', chip: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900', line: 'bg-emerald-300' },
    { head: 'from-rose-400 to-pink-500', ring: 'ring-rose-200', chip: 'bg-rose-50 hover:bg-rose-100 text-rose-900', line: 'bg-rose-300' },
    { head: 'from-indigo-400 to-blue-500', ring: 'ring-indigo-200', chip: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900', line: 'bg-indigo-300' },
];

// ผังความคิด: หัวข้อหลักตรงกลาง → กิ่งหลัก (การ์ดสี) → กิ่งย่อย (กดดูคำอธิบาย)
export default function MindMapView({ content, style, moduleInfo, hasQuiz, onChangeStyle }: ReaderProps<MindmapContent>) {
    const branches = content.branches ?? [];
    const [open, setOpen] = useState<Set<string>>(new Set());
    const allKeys = branches.flatMap((b, i) => (b.children ?? []).map((_, j) => `${i}-${j}`));
    const allOpen = allKeys.length > 0 && allKeys.every(k => open.has(k));
    const toggle = (key: string) => setOpen(prev => { const s = new Set(prev); if (s.has(key)) s.delete(key); else s.add(key); return s; });

    return (
        <div className="-mt-2">
            <LessonHero content={content} style={style} moduleInfo={moduleInfo} onChangeStyle={onChangeStyle}
                startHref="#mindmap" startLabel="ดูผังความคิด" meta={<MetaChip><GitBranch size={14} /> {branches.length} หมวด</MetaChip>} />

            <section id="mindmap" className="scroll-mt-24 mt-10">
                <div className="flex justify-end mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setOpen(allOpen ? new Set() : new Set(allKeys))}>
                        {allOpen ? <><EyeOff size={16} /> ซ่อนคำอธิบายทั้งหมด</> : <><Eye size={16} /> เปิดคำอธิบายทั้งหมด</>}
                    </Button>
                </div>

                {/* หัวข้อหลัก */}
                <div className="flex flex-col items-center">
                    <div className={`rounded-[2rem] bg-gradient-to-br ${style.gradient} text-white px-8 py-6 text-center shadow-lift max-w-md`}>
                        <div className="text-5xl" aria-hidden="true">{content.center?.emoji}</div>
                        <div className="mt-2 text-2xl font-bold font-display">{content.center?.label}</div>
                    </div>
                    <span className="w-1 h-10 rounded-full bg-slate-300" aria-hidden="true" />
                </div>

                {/* กิ่งหลัก */}
                <div className="relative flex flex-wrap justify-center gap-6">
                    {branches.map((b, i) => {
                        const tone = BRANCH_TONES[i % BRANCH_TONES.length];
                        return (
                            <div key={i} className={cx('relative w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-3xl bg-white ring-2 shadow-soft overflow-hidden animate-fade-up', tone.ring)} style={{ animationDelay: `${i * 80}ms` }}>
                                <div className={`bg-gradient-to-r ${tone.head} text-white px-5 py-4 flex items-center gap-3`}>
                                    <span className="text-3xl" aria-hidden="true">{b.emoji}</span>
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-white/75">หมวด {i + 1}</div>
                                        <h3 className="text-lg font-bold leading-snug">{b.label}</h3>
                                    </div>
                                </div>
                                <div className="p-5">
                                    {b.note && <p className="text-sm text-slate-600 leading-6 mb-4"><InlineMarkdown>{b.note}</InlineMarkdown></p>}
                                    <ul className="space-y-2">
                                        {(b.children ?? []).map((c, j) => {
                                            const key = `${i}-${j}`;
                                            const isOpen = open.has(key);
                                            return (
                                                <li key={j}>
                                                    <button type="button" onClick={() => toggle(key)} aria-expanded={isOpen}
                                                        className={cx('w-full flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition', tone.chip)}>
                                                        <span className={cx('w-1.5 h-1.5 rounded-full shrink-0', tone.line)} aria-hidden="true" />
                                                        <span className="flex-1 min-w-0">{c.label}</span>
                                                        <ChevronDown size={16} className={cx('shrink-0 transition-transform', isOpen && 'rotate-180')} />
                                                    </button>
                                                    {isOpen && c.note && (
                                                        <p className="mt-1.5 ml-5 pl-3 border-l-2 border-slate-200 text-sm text-slate-600 leading-6 animate-fade-up">
                                                            <InlineMarkdown>{c.note}</InlineMarkdown>
                                                        </p>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="mx-auto max-w-3xl mt-10 space-y-8">
                <KeyPoints points={content.key_points} title="🧭 ภาพรวมที่ควรจำ" />
                <LessonFinish moduleInfo={moduleInfo} hasQuiz={hasQuiz} onChangeStyle={onChangeStyle} title="เห็นภาพรวมครบแล้ว!" emoji="🧠" />
            </div>
        </div>
    );
}
