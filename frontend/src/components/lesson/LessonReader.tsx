"use client";
import React from 'react';
import { Layers, Target, CheckCircle2, BookA } from 'lucide-react';
import type { ModuleDetail, StyledContent } from '@/lib/types';
import type { LearningStyle } from '@/lib/visual';
import { Card } from '@/components/ui';
import LessonBlockCard, { BLOCK_META } from '@/components/lesson/LessonBlockCard';
import QuickCheckCard from '@/components/lesson/QuickCheckCard';
import InlineMarkdown from '@/components/lesson/InlineMarkdown';
import { KeyPoints, LessonFinish, LessonHero, MetaChip, ReadingProgress } from '@/components/lesson/LessonFrame';

export interface ReaderProps<T> {
    content: T;
    style: LearningStyle;
    moduleInfo: ModuleDetail;
    hasQuiz: boolean;
    onChangeStyle: () => void;
}

// บทเรียนแบบบล็อก (สไตล์อ่าน: เพื่อนติวเพื่อน, สรุป, เคสจริง, ภารกิจ, เด็ก 10 ขวบ)
export default function LessonReader({ content, style, moduleInfo, hasQuiz, onChangeStyle }: ReaderProps<StyledContent>) {
    const sections = content.sections ?? [];
    const checks = content.quick_checks ?? [];
    // คำถามที่ระบุตำแหน่งเกินจำนวนบล็อก ให้ไปแสดงท้ายบล็อกสุดท้าย
    const checksAfter = (i: number) => checks.filter(q => Math.min(Math.max(q.after_section, 0), sections.length - 1) === i);

    return (
        <div className="-mt-2">
            <ReadingProgress />
            <LessonHero content={content} style={style} moduleInfo={moduleInfo} onChangeStyle={onChangeStyle}
                startHref="#block-0" startLabel="เริ่มอ่านเลย" meta={<MetaChip><Layers size={14} /> {sections.length} หัวข้อ</MetaChip>} />

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

                    <KeyPoints points={content.key_points} />
                    <LessonFinish moduleInfo={moduleInfo} hasQuiz={hasQuiz} onChangeStyle={onChangeStyle} message={content.closing} title="อ่านจบแล้ว เก่งมาก!" />
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
