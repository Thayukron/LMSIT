"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Lightbulb, Check, X, Layers } from 'lucide-react';
import type { FlashcardsContent } from '@/lib/types';
import { Button, Card, ProgressBar, cx } from '@/components/ui';
import InlineMarkdown from '@/components/lesson/InlineMarkdown';
import { LessonFinish, LessonHero, MetaChip } from '@/components/lesson/LessonFrame';
import type { ReaderProps } from '@/components/lesson/LessonReader';

// สลับลำดับแบบสุ่ม (คืน array ใหม่)
const shuffled = <T,>(items: T[]) => {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
};

// แฟลชการ์ด: พลิกดูคำตอบ กดว่าจำได้/ยังไม่แม่น แล้วทบทวนเฉพาะใบที่ยังไม่แม่น
export default function FlashcardDeck({ content, style, moduleInfo, hasQuiz, onChangeStyle }: ReaderProps<FlashcardsContent>) {
    const all = content.cards ?? [];
    const [deck, setDeck] = useState(() => all.map((_, i) => i));   // ลำดับการ์ดในรอบนี้ (index ของ all)
    const [pos, setPos] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [known, setKnown] = useState<Set<number>>(new Set());
    const [round, setRound] = useState(1);
    const finished = pos >= deck.length;
    const card = all[deck[pos]];

    const go = useCallback((next: number) => { setPos(next); setFlipped(false); setShowHint(false); }, []);
    const mark = (isKnown: boolean) => {
        setKnown(prev => { const s = new Set(prev); if (isKnown) s.add(deck[pos]); else s.delete(deck[pos]); return s; });
        go(pos + 1);
    };
    const restart = (indexes: number[]) => { setDeck(indexes); setRound(r => r + 1); go(0); };

    // ปุ่มลัด: เว้นวรรค = พลิก, ← → = เลื่อนการ์ด
    useEffect(() => {
        if (finished) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
            if (e.key === 'ArrowRight') go(Math.min(pos + 1, deck.length));
            if (e.key === 'ArrowLeft') go(Math.max(pos - 1, 0));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [finished, pos, deck.length, go]);

    const unknown = all.map((_, i) => i).filter(i => !known.has(i));

    return (
        <div className="-mt-2">
            <LessonHero content={content} style={style} moduleInfo={moduleInfo} onChangeStyle={onChangeStyle}
                startHref="#deck" startLabel="เริ่มทบทวน" meta={<MetaChip><Layers size={14} /> {all.length} ใบ</MetaChip>} />

            <section id="deck" className="scroll-mt-24 mx-auto max-w-2xl mt-10">
                <div className="flex items-center justify-between gap-4 mb-3 text-sm">
                    <span className="font-semibold text-slate-600">รอบที่ {round} · {finished ? deck.length : pos + 1} / {deck.length}</span>
                    <span className="text-emerald-600 font-semibold">จำได้แล้ว {known.size}/{all.length}</span>
                </div>
                <ProgressBar value={finished ? deck.length : pos} max={deck.length} label="ความคืบหน้าแฟลชการ์ด" />

                {!finished && card ? (
                    <>
                        {/* การ์ดพลิกได้ */}
                        <button type="button" onClick={() => setFlipped(f => !f)} aria-label={flipped ? 'พลิกกลับด้านหน้า' : 'พลิกดูคำตอบ'}
                            className="group mt-6 block w-full [perspective:1600px] focus-visible:outline-none">
                            <div className={cx('relative h-80 sm:h-96 transition-transform duration-500 [transform-style:preserve-3d]', flipped && '[transform:rotateY(180deg)]')}>
                                <div className="absolute inset-0 [backface-visibility:hidden] rounded-[2rem] bg-white ring-1 ring-slate-200 shadow-lift flex flex-col items-center justify-center p-8 text-center group-focus-visible:ring-4 group-focus-visible:ring-brand-300">
                                    <span className="text-6xl" aria-hidden="true">{card.emoji}</span>
                                    <p className="mt-6 text-2xl sm:text-3xl font-bold text-ink leading-snug"><InlineMarkdown>{card.front}</InlineMarkdown></p>
                                    <span className="absolute bottom-5 text-xs text-slate-400">แตะการ์ด หรือกดเว้นวรรค เพื่อดูคำตอบ</span>
                                </div>
                                <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[2rem] bg-gradient-to-br ${style.gradient} text-white shadow-lift flex flex-col items-center justify-center p-8 text-center`}>
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/70">คำตอบ</span>
                                    <p className="mt-4 text-xl sm:text-2xl font-semibold leading-relaxed [&_strong]:text-white [&_strong]:underline [&_strong]:decoration-white/40">
                                        <InlineMarkdown>{card.back}</InlineMarkdown>
                                    </p>
                                </div>
                            </div>
                        </button>

                        <div className="mt-4 min-h-12 text-center">
                            {card.hint && !flipped && (
                                showHint
                                    ? <p className="inline-flex items-center gap-2 rounded-xl bg-amber-50 text-amber-800 px-4 py-2 text-sm animate-pop"><Lightbulb size={16} /> <InlineMarkdown>{card.hint}</InlineMarkdown></p>
                                    : <Button variant="ghost" size="sm" onClick={() => setShowHint(true)}><Lightbulb size={16} /> ขอคำใบ้</Button>
                            )}
                        </div>

                        <div className="mt-2 grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                            <Button variant="ghost" onClick={() => go(Math.max(pos - 1, 0))} disabled={pos === 0} aria-label="การ์ดก่อนหน้า"><ChevronLeft size={20} /></Button>
                            <Button variant="secondary" onClick={() => mark(false)} className="text-rose-600"><X size={18} /> ยังไม่แม่น</Button>
                            <Button onClick={() => mark(true)} className="bg-emerald-600 hover:bg-emerald-700"><Check size={18} /> จำได้แล้ว</Button>
                            <Button variant="ghost" onClick={() => go(pos + 1)} aria-label="การ์ดถัดไป"><ChevronRight size={20} /></Button>
                        </div>
                        <div className="mt-3 text-center">
                            <Button variant="ghost" size="sm" onClick={() => restart(shuffled(deck))}><Shuffle size={15} /> สลับลำดับการ์ด</Button>
                        </div>
                    </>
                ) : (
                    <Card className="mt-6 p-8 sm:p-10 text-center animate-pop">
                        <div className="text-5xl" aria-hidden="true">{unknown.length === 0 ? '🏆' : '💪'}</div>
                        <h2 className="mt-4 text-2xl font-bold text-ink">{unknown.length === 0 ? 'จำได้ครบทุกใบ เยี่ยมมาก!' : `จบรอบที่ ${round} แล้ว`}</h2>
                        <p className="mt-2 text-slate-500">จำได้แล้ว {known.size} จาก {all.length} ใบ</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            {unknown.length > 0 && <Button onClick={() => restart(shuffled(unknown))}><RotateCcw size={18} /> ทบทวนใบที่ยังไม่แม่น ({unknown.length})</Button>}
                            <Button variant="secondary" onClick={() => { setKnown(new Set()); restart(shuffled(all.map((_, i) => i))); }}><Shuffle size={18} /> เริ่มใหม่ทั้งหมด</Button>
                        </div>
                    </Card>
                )}
            </section>

            {finished && (
                <div className="mx-auto max-w-2xl mt-8">
                    <LessonFinish moduleInfo={moduleInfo} hasQuiz={hasQuiz} onChangeStyle={onChangeStyle} title="พร้อมลองของจริงหรือยัง?" emoji="🃏"
                        message="ทบทวนด้วยแฟลชการ์ดแล้ว ลองทำแบบทดสอบเพื่อวัดผลกันเลย" />
                </div>
            )}
        </div>
    );
}
