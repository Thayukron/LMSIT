"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Lightbulb, Sparkles } from 'lucide-react';
import type { StoryContent } from '@/lib/types';
import QuickCheckCard from '@/components/lesson/QuickCheckCard';
import InlineMarkdown from '@/components/lesson/InlineMarkdown';
import { KeyPoints, LessonFinish, LessonHero, MetaChip, ReadingProgress } from '@/components/lesson/LessonFrame';
import type { ReaderProps } from '@/components/lesson/LessonReader';

// นิทานความรู้: แนะนำตัวละคร → อ่านทีละตอนแบบหนังสือนิทาน → ข้อคิด
export default function StoryReader({ content, style, moduleInfo, hasQuiz, onChangeStyle }: ReaderProps<StoryContent>) {
    const chapters = content.chapters ?? [];
    const checks = content.quick_checks ?? [];
    const checksAfter = (i: number) => checks.filter(q => Math.min(Math.max(q.after_section, 0), chapters.length - 1) === i);

    return (
        <div className="-mt-2">
            <ReadingProgress />
            <LessonHero content={content} style={style} moduleInfo={moduleInfo} onChangeStyle={onChangeStyle}
                startHref="#chapter-0" startLabel="เปิดอ่านนิทาน" meta={<MetaChip><BookOpen size={14} /> {chapters.length} ตอน</MetaChip>} />

            <div className="mx-auto max-w-3xl mt-10 space-y-10">
                {/* ตัวละคร */}
                {content.characters?.length > 0 && (
                    <section aria-labelledby="cast-heading">
                        <h2 id="cast-heading" className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">ตัวละครในเรื่อง</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {content.characters.map(c => (
                                <div key={c.name} className="flex items-center gap-4 rounded-2xl bg-white ring-1 ring-slate-200/70 p-4">
                                    <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-3xl shrink-0" aria-hidden="true">{c.emoji}</span>
                                    <div className="min-w-0">
                                        <div className="font-bold text-ink">{c.name}</div>
                                        <div className="text-sm text-slate-500 leading-6"><InlineMarkdown>{c.description}</InlineMarkdown></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* แต่ละตอน */}
                {chapters.map((ch, i) => (
                    <React.Fragment key={i}>
                        <article id={`chapter-${i}`} className="scroll-mt-28 rounded-[2rem] bg-[#fffdf8] ring-1 ring-amber-100 shadow-soft overflow-hidden">
                            <div className="flex items-center gap-4 px-6 sm:px-10 pt-8">
                                <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center text-4xl shrink-0" aria-hidden="true">{ch.emoji}</span>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-rose-500 tracking-wider">ตอนที่ {i + 1}</div>
                                    <h2 className="text-2xl font-bold text-ink leading-snug">{ch.title}</h2>
                                </div>
                            </div>
                            <div className="lesson-prose px-6 sm:px-10 py-6 [&_p:first-of-type]:first-letter:text-4xl [&_p:first-of-type]:first-letter:font-bold [&_p:first-of-type]:first-letter:text-rose-500 [&_p:first-of-type]:first-letter:mr-1">
                                <ReactMarkdown>{ch.scene}</ReactMarkdown>
                            </div>
                            {ch.lesson && (
                                <div className="mx-6 sm:mx-10 mb-8 flex gap-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200 px-5 py-4">
                                    <Lightbulb size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-amber-700 mb-0.5">ความรู้จากตอนนี้</div>
                                        <div className="text-slate-700 leading-7"><InlineMarkdown>{ch.lesson}</InlineMarkdown></div>
                                    </div>
                                </div>
                            )}
                        </article>
                        {checksAfter(i).map((q, j) => <QuickCheckCard key={`${i}-${j}`} check={q} />)}
                    </React.Fragment>
                ))}

                {content.moral && (
                    <section className="rounded-3xl bg-gradient-to-br from-rose-500 to-amber-500 text-white p-6 sm:p-10 text-center">
                        <Sparkles size={28} className="mx-auto opacity-90" />
                        <h2 className="mt-3 text-xl font-bold">ข้อคิดจากเรื่องนี้</h2>
                        <p className="mt-3 text-lg leading-8 text-white/95 max-w-2xl mx-auto"><InlineMarkdown>{content.moral}</InlineMarkdown></p>
                    </section>
                )}

                <KeyPoints points={content.key_points} />
                <LessonFinish moduleInfo={moduleInfo} hasQuiz={hasQuiz} onChangeStyle={onChangeStyle} title="จบนิทานแล้ว! 📚" emoji="🌟" />
            </div>
        </div>
    );
}
