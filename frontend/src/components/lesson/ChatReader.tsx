"use client";
import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, FastForward, ChevronDown } from 'lucide-react';
import type { ChatContent } from '@/lib/types';
import { Button, cx } from '@/components/ui';
import InlineMarkdown from '@/components/lesson/InlineMarkdown';
import { KeyPoints, LessonFinish, LessonHero, MetaChip } from '@/components/lesson/LessonFrame';
import type { ReaderProps } from '@/components/lesson/LessonReader';

// สีฟองข้อความของผู้พูดฝั่งขวา (ตัวละครที่ 2 และ 3)
const RIGHT_TONES = ['bg-emerald-500 text-white', 'bg-sky-500 text-white'];

const KIND_STYLE: Record<string, { label: string; cls: string }> = {
    tip: { label: '💡 จำไว้นะ', cls: 'ring-2 ring-amber-300 bg-amber-50 text-ink' },
    question: { label: '🤔 ลองคิดดู', cls: 'ring-2 ring-brand-300 bg-brand-50 text-ink' },
    example: { label: '🧪 ตัวอย่าง', cls: 'ring-2 ring-sky-300 bg-sky-50 text-ink' },
};

// การ์ตูนแชต: ข้อความทยอยขึ้นทีละข้อความเหมือนแชตจริง (กดอ่านต่อ หรือข้ามไปดูทั้งหมด)
export default function ChatReader({ content, style, moduleInfo, hasQuiz, onChangeStyle }: ReaderProps<ChatContent>) {
    const messages = content.messages ?? [];
    const chars = Object.fromEntries((content.characters ?? []).map(c => [c.id, c]));
    const firstId = content.characters?.[0]?.id;
    const rightIds = (content.characters ?? []).slice(1).map(c => c.id);
    const [shown, setShown] = useState(Math.min(3, messages.length));
    const endRef = useRef<HTMLDivElement>(null);
    const done = shown >= messages.length;

    useEffect(() => {
        if (shown > 3) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [shown]);

    return (
        <div className="-mt-2">
            <LessonHero content={content} style={style} moduleInfo={moduleInfo} onChangeStyle={onChangeStyle}
                startHref="#chat" startLabel="เปิดแชต" meta={<MetaChip><MessageCircle size={14} /> {messages.length} ข้อความ</MetaChip>} />

            <div className="mx-auto max-w-2xl mt-10 space-y-8">
                <section id="chat" className="scroll-mt-24 rounded-[2rem] bg-white ring-1 ring-slate-200/70 shadow-soft overflow-hidden">
                    {/* หัวแชตกลุ่ม */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/70">
                        <div className="flex -space-x-2">
                            {content.characters.map(c => (
                                <span key={c.id} className="w-10 h-10 rounded-full bg-white ring-2 ring-white flex items-center justify-center text-xl shadow-sm" aria-hidden="true">{c.emoji}</span>
                            ))}
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold text-ink truncate">ห้องติว: {moduleInfo.title}</div>
                            <div className="text-xs text-slate-500 truncate">{content.characters.map(c => `${c.name} (${c.role})`).join(' · ')}</div>
                        </div>
                    </div>

                    {/* ข้อความ */}
                    <div className="px-4 sm:px-6 py-6 space-y-4 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:18px_18px]" aria-live="polite">
                        {messages.slice(0, shown).map((m, i) => {
                            const who = chars[m.speaker];
                            const isLeft = m.speaker === firstId;
                            const kind = KIND_STYLE[m.kind];
                            const prevSame = i > 0 && messages[i - 1].speaker === m.speaker;
                            const bubble = kind
                                ? kind.cls
                                : isLeft ? 'bg-white ring-1 ring-slate-200 text-ink' : RIGHT_TONES[Math.max(0, rightIds.indexOf(m.speaker)) % RIGHT_TONES.length];
                            return (
                                <div key={i} className={cx('flex items-end gap-2 animate-fade-up', isLeft ? 'justify-start' : 'justify-end')}>
                                    {isLeft && <span className={cx('w-9 h-9 rounded-full bg-white ring-1 ring-slate-200 flex items-center justify-center text-lg shrink-0', prevSame && 'invisible')} aria-hidden="true">{who?.emoji}</span>}
                                    <div className={cx('max-w-[80%]', !isLeft && 'flex flex-col items-end')}>
                                        {!prevSame && <div className="text-xs text-slate-500 mb-1 px-1">{who?.name}</div>}
                                        <div className={cx('rounded-2xl px-4 py-2.5 leading-7 shadow-sm', bubble, isLeft ? 'rounded-bl-md' : 'rounded-br-md')}>
                                            {kind && <div className="text-xs font-bold mb-1 opacity-80">{kind.label}</div>}
                                            <InlineMarkdown>{m.text}</InlineMarkdown>
                                        </div>
                                    </div>
                                    {!isLeft && <span className={cx('w-9 h-9 rounded-full bg-white ring-1 ring-slate-200 flex items-center justify-center text-lg shrink-0', prevSame && 'invisible')} aria-hidden="true">{who?.emoji}</span>}
                                </div>
                            );
                        })}
                        <div ref={endRef} />
                    </div>

                    {!done && (
                        <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-4 border-t border-slate-100 bg-slate-50/70">
                            <Button onClick={() => setShown(s => Math.min(s + 1, messages.length))}><ChevronDown size={18} /> อ่านข้อความถัดไป</Button>
                            <Button variant="ghost" onClick={() => setShown(messages.length)}><FastForward size={18} /> แสดงทั้งหมด</Button>
                            <span className="w-full text-center text-xs text-slate-400">{shown} / {messages.length}</span>
                        </div>
                    )}
                </section>

                {done && (
                    <>
                        <KeyPoints points={content.key_points} title="📌 สรุปจากแชตนี้" />
                        <LessonFinish moduleInfo={moduleInfo} hasQuiz={hasQuiz} onChangeStyle={onChangeStyle} title="อ่านแชตจบแล้ว!" emoji="💬" />
                    </>
                )}
            </div>
        </div>
    );
}
