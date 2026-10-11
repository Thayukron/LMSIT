"use client";
import React, { useState } from 'react';
import { Puzzle, ListOrdered, PencilLine, RotateCcw, Check, X, Trophy } from 'lucide-react';
import type { PracticeContent } from '@/lib/types';
import { Badge, Button, Card, cx } from '@/components/ui';
import InlineMarkdown from '@/components/lesson/InlineMarkdown';
import { LessonFinish, LessonHero, MetaChip } from '@/components/lesson/LessonFrame';
import type { ReaderProps } from '@/components/lesson/LessonReader';

const shuffled = <T,>(items: T[]) => {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
};

type Score = { done: boolean; correct: number; total: number };

function GameCard({ icon, step, title, instructions, score, children }: {
    icon: React.ReactNode; step: number; title: string; instructions: string; score?: Score; children: React.ReactNode;
}) {
    return (
        <Card className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <span className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">{icon}</span>
                    <div>
                        <div className="text-xs font-bold text-slate-400">ด่านที่ {step}</div>
                        <h2 className="text-xl font-bold text-ink">{title}</h2>
                        <p className="text-sm text-slate-500 mt-0.5"><InlineMarkdown>{instructions}</InlineMarkdown></p>
                    </div>
                </div>
                {score?.done && <Badge tone={score.correct === score.total ? 'green' : 'amber'}>{score.correct}/{score.total}</Badge>}
            </div>
            <div className="mt-6">{children}</div>
        </Card>
    );
}

// ---------- ด่าน 1: จับคู่ (กดฝั่งซ้าย แล้วกดคู่ฝั่งขวา) ----------
function MatchingGame({ data, onScore }: { data: PracticeContent['matching']; onScore: (s: Score) => void }) {
    const pairs = data.pairs;
    const [rightOrder, setRightOrder] = useState(() => shuffled(pairs.map((_, i) => i)));
    const [selected, setSelected] = useState<number | null>(null);
    const [matched, setMatched] = useState<Set<number>>(new Set());
    const [wrong, setWrong] = useState<number | null>(null);
    const [mistakes, setMistakes] = useState(0);

    const pick = (right: number) => {
        if (selected === null || matched.has(right)) return;
        if (right === selected) {
            const next = new Set(matched).add(right);
            setMatched(next);
            setSelected(null);
            if (next.size === pairs.length) onScore({ done: true, correct: Math.max(0, pairs.length - mistakes), total: pairs.length });
        } else {
            setWrong(right);
            setMistakes(m => m + 1);
            setTimeout(() => setWrong(null), 600);
        }
    };
    const reset = () => { setRightOrder(shuffled(pairs.map((_, i) => i))); setMatched(new Set()); setSelected(null); setMistakes(0); onScore({ done: false, correct: 0, total: pairs.length }); };

    return (
        <div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    {pairs.map((p, i) => (
                        <button key={i} type="button" disabled={matched.has(i)} onClick={() => setSelected(i)}
                            className={cx('w-full min-h-14 rounded-2xl px-4 py-3 text-left text-sm font-semibold ring-2 transition',
                                matched.has(i) ? 'ring-emerald-300 bg-emerald-50 text-emerald-800' : selected === i ? 'ring-brand-500 bg-brand-50 text-ink' : 'ring-slate-200 hover:ring-brand-300')}>
                            {matched.has(i) && <Check size={14} className="inline mr-1" />}<InlineMarkdown>{p.term}</InlineMarkdown>
                        </button>
                    ))}
                </div>
                <div className="space-y-2">
                    {rightOrder.map(r => (
                        <button key={r} type="button" disabled={matched.has(r) || selected === null} onClick={() => pick(r)}
                            className={cx('w-full min-h-14 rounded-2xl px-4 py-3 text-left text-sm ring-2 transition',
                                matched.has(r) ? 'ring-emerald-300 bg-emerald-50 text-emerald-800' : wrong === r ? 'ring-rose-400 bg-rose-50 text-rose-700 animate-pop' : 'ring-slate-200 enabled:hover:ring-brand-300 disabled:opacity-60')}>
                            <InlineMarkdown>{pairs[r].match}</InlineMarkdown>
                        </button>
                    ))}
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>{matched.size === pairs.length ? `🎉 จับคู่ครบแล้ว! พลาด ${mistakes} ครั้ง` : selected === null ? 'เริ่มจากกดคำทางซ้าย' : 'แล้วกดคำตอบที่คู่กันทางขวา'}</span>
                <Button variant="ghost" size="sm" onClick={reset}><RotateCcw size={14} /> เริ่มใหม่</Button>
            </div>
        </div>
    );
}

// ---------- ด่าน 2: เรียงลำดับ (กดเรียงทีละรายการ แล้วตรวจคำตอบ) ----------
function OrderingGame({ data, onScore }: { data: PracticeContent['ordering']; onScore: (s: Score) => void }) {
    const items = data.items;
    const [pool, setPool] = useState(() => {
        let order = shuffled(items.map((_, i) => i));
        if (order.every((v, i) => v === i) && items.length > 1) order = [...order.slice(1), order[0]]; // กันกรณีสุ่มแล้วถูกพอดี
        return order;
    });
    const [answer, setAnswer] = useState<number[]>([]);
    const [checked, setChecked] = useState(false);
    const correctCount = answer.filter((v, i) => v === i).length;

    const place = (idx: number) => { if (!checked) { setAnswer(a => [...a, idx]); setPool(p => p.filter(x => x !== idx)); } };
    const unplace = (idx: number) => { if (!checked) { setAnswer(a => a.filter(x => x !== idx)); setPool(p => [...p, idx]); } };
    const check = () => { setChecked(true); onScore({ done: true, correct: correctCount, total: items.length }); };
    const reset = () => { setPool(shuffled(items.map((_, i) => i))); setAnswer([]); setChecked(false); onScore({ done: false, correct: 0, total: items.length }); };

    return (
        <div className="space-y-4">
            <ol className="space-y-2" aria-label="ลำดับที่คุณเรียง">
                {items.map((_, slot) => {
                    const idx = answer[slot];
                    const filled = idx !== undefined;
                    const ok = checked && idx === slot;
                    return (
                        <li key={slot} className="flex items-center gap-3">
                            <span className={cx('w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                                checked ? (ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white') : filled ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400')}>{slot + 1}</span>
                            {filled ? (
                                <button type="button" onClick={() => unplace(idx)} disabled={checked}
                                    className={cx('flex-1 rounded-2xl px-4 py-3 text-left text-sm ring-2 transition',
                                        checked ? (ok ? 'ring-emerald-300 bg-emerald-50' : 'ring-rose-300 bg-rose-50') : 'ring-brand-200 bg-brand-50 hover:ring-brand-400')}>
                                    <InlineMarkdown>{items[idx]}</InlineMarkdown>
                                    {checked && !ok && <span className="block text-xs text-rose-600 mt-1">ตำแหน่งที่ถูก: ลำดับที่ {idx + 1}</span>}
                                </button>
                            ) : (
                                <span className="flex-1 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm text-slate-300">เลือกรายการด้านล่าง</span>
                            )}
                        </li>
                    );
                })}
            </ol>
            {pool.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-3">
                    {pool.map(idx => (
                        <button key={idx} type="button" onClick={() => place(idx)}
                            className="rounded-xl bg-white ring-1 ring-slate-200 px-3.5 py-2 text-sm hover:ring-brand-400 hover:-translate-y-0.5 transition">
                            <InlineMarkdown>{items[idx]}</InlineMarkdown>
                        </button>
                    ))}
                </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-slate-500">{checked ? (correctCount === items.length ? '🎉 เรียงถูกทั้งหมด!' : `ถูก ${correctCount} จาก ${items.length} ตำแหน่ง`) : 'กดรายการตามลำดับ กดซ้ำเพื่อเอาออก'}</span>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={reset}><RotateCcw size={14} /> เริ่มใหม่</Button>
                    {!checked && <Button size="sm" onClick={check} disabled={pool.length > 0}>ตรวจคำตอบ</Button>}
                </div>
            </div>
        </div>
    );
}

// ---------- ด่าน 3: เติมคำในช่องว่าง ----------
function FillBlankGame({ data, onScore }: { data: PracticeContent['fill_blanks']; onScore: (s: Score) => void }) {
    const [picked, setPicked] = useState<Record<number, string>>({});
    const answered = Object.keys(picked).length;

    const choose = (i: number, choice: string) => {
        if (picked[i] !== undefined) return;
        const next = { ...picked, [i]: choice };
        setPicked(next);
        if (Object.keys(next).length === data.length) {
            onScore({ done: true, correct: data.filter((f, k) => next[k] === f.answer).length, total: data.length });
        }
    };

    return (
        <div className="space-y-6">
            {data.map((f, i) => {
                const choice = picked[i];
                const done = choice !== undefined;
                const [before, ...rest] = f.sentence.split('___');
                return (
                    <div key={i} className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-lg text-ink leading-9">
                            <span className="text-slate-400 font-bold mr-2">{i + 1}.</span>
                            <InlineMarkdown>{before}</InlineMarkdown>
                            <span className={cx('inline-block min-w-24 mx-1 px-3 rounded-lg border-b-2 text-center font-bold',
                                !done ? 'border-slate-300 text-transparent' : choice === f.answer ? 'border-emerald-500 bg-emerald-100 text-emerald-800' : 'border-rose-500 bg-rose-100 text-rose-700')}>
                                {done ? choice : '____'}
                            </span>
                            <InlineMarkdown>{rest.join('___')}</InlineMarkdown>
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {f.choices.map(c => (
                                <button key={c} type="button" disabled={done} onClick={() => choose(i, c)}
                                    className={cx('rounded-xl px-4 py-2 text-sm font-semibold ring-2 transition',
                                        !done && 'bg-white ring-slate-200 hover:ring-brand-400',
                                        done && c === f.answer && 'bg-emerald-50 ring-emerald-400 text-emerald-800',
                                        done && c === choice && c !== f.answer && 'bg-rose-50 ring-rose-300 text-rose-700',
                                        done && c !== f.answer && c !== choice && 'bg-white ring-slate-100 text-slate-300')}>
                                    {done && c === f.answer && <Check size={14} className="inline mr-1" />}
                                    {done && c === choice && c !== f.answer && <X size={14} className="inline mr-1" />}
                                    {c}
                                </button>
                            ))}
                        </div>
                        {done && f.explanation && <p className="mt-3 text-sm text-slate-600 leading-6 animate-fade-up">💡 <InlineMarkdown>{f.explanation}</InlineMarkdown></p>}
                    </div>
                );
            })}
            <p className="text-sm text-slate-500">ตอบแล้ว {answered}/{data.length} ข้อ</p>
        </div>
    );
}

// เกมฝึกฝน 3 ด่าน พร้อมคะแนนรวม
export default function PracticeGames({ content, style, moduleInfo, hasQuiz, onChangeStyle }: ReaderProps<PracticeContent>) {
    const [scores, setScores] = useState<Record<string, Score>>({});
    const setScore = (key: string) => (s: Score) => setScores(prev => ({ ...prev, [key]: s }));
    const games = ['matching', 'ordering', 'fill'];
    const allDone = games.every(g => scores[g]?.done);
    const total = games.reduce((t, g) => t + (scores[g]?.total ?? 0), 0);
    const correct = games.reduce((t, g) => t + (scores[g]?.done ? scores[g].correct : 0), 0);

    return (
        <div className="-mt-2">
            <LessonHero content={content} style={style} moduleInfo={moduleInfo} onChangeStyle={onChangeStyle}
                startHref="#games" startLabel="เริ่มเล่น" meta={<MetaChip><Puzzle size={14} /> 3 ด่าน</MetaChip>} />

            <div id="games" className="scroll-mt-24 mx-auto max-w-3xl mt-10 space-y-6">
                <div className="sticky top-20 z-20 flex items-center justify-between rounded-2xl bg-white/90 backdrop-blur px-5 py-3 ring-1 ring-slate-200 shadow-soft">
                    <span className="flex items-center gap-2 font-semibold text-ink"><Trophy size={18} className="text-amber-500" /> คะแนนรวม</span>
                    <span className="font-display text-xl font-bold text-ink">{correct}<span className="text-slate-400 text-base"> / {total || '–'}</span></span>
                </div>

                <GameCard icon={<Puzzle size={20} />} step={1} title="จับคู่ให้ถูก" instructions={content.matching.instructions} score={scores.matching}>
                    <MatchingGame data={content.matching} onScore={setScore('matching')} />
                </GameCard>
                <GameCard icon={<ListOrdered size={20} />} step={2} title="เรียงลำดับ" instructions={content.ordering.instructions} score={scores.ordering}>
                    <OrderingGame data={content.ordering} onScore={setScore('ordering')} />
                </GameCard>
                <GameCard icon={<PencilLine size={20} />} step={3} title="เติมคำในช่องว่าง" instructions="เลือกคำที่หายไปให้ประโยคถูกต้อง" score={scores.fill}>
                    <FillBlankGame data={content.fill_blanks} onScore={setScore('fill')} />
                </GameCard>

                {allDone && (
                    <LessonFinish moduleInfo={moduleInfo} hasQuiz={hasQuiz} onChangeStyle={onChangeStyle}
                        emoji={correct === total ? '🏆' : '💪'} title={`ผ่านครบ 3 ด่าน ได้ ${correct}/${total} คะแนน`}
                        message={correct === total ? 'เต็มทุกด่าน! พร้อมสอบจริงแล้ว' : 'เก่งมาก ลองเล่นซ้ำด่านที่ยังพลาด หรือไปทำแบบทดสอบจริงได้เลย'} />
                )}
            </div>
        </div>
    );
}
