"use client";
import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cx } from '@/components/ui';

const STEPS = [
    'อ่านเนื้อหาต้นฉบับ',
    'เรียบเรียงตามสไตล์ที่คุณเลือก',
    'หาตัวอย่างและการเปรียบเทียบที่เข้าใจง่าย',
    'สร้างคำถามชวนคิดระหว่างเรียน',
    'จัดหน้าให้อ่านสบายตา',
];

// หน้าจอระหว่างรอ AI สร้างบทเรียน (ครั้งแรกใช้เวลา ~10-30 วินาที)
export default function GeneratingScreen({ styleName, emoji, gradient }: { styleName: string; emoji: string; gradient: string }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 4500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="max-w-xl mx-auto py-10 sm:py-16 text-center animate-fade-up" role="status" aria-live="polite">
            <div className="relative mx-auto w-32 h-32">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} blur-2xl opacity-60 animate-pulse`} />
                <div className={`relative w-32 h-32 rounded-[2rem] bg-gradient-to-br ${gradient} flex items-center justify-center text-6xl shadow-lift animate-float`}>
                    {emoji}
                </div>
            </div>
            <h2 className="mt-10 text-2xl sm:text-3xl font-bold text-ink">AI กำลังเตรียมบทเรียน<br />สไตล์ “{styleName}”</h2>
            <p className="mt-3 text-slate-500">ครั้งแรกอาจใช้เวลาประมาณ 10-30 วินาที ครั้งต่อไปจะเปิดได้ทันที</p>
            <ol className="mt-10 space-y-3 text-left max-w-sm mx-auto">
                {STEPS.map((label, i) => (
                    <li key={label} className={cx('flex items-center gap-3 transition-opacity duration-500', i > step && 'opacity-40')}>
                        <span className={cx('w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                            i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-100' : 'bg-slate-100')}>
                            {i < step ? <Check size={15} strokeWidth={3} /> : i === step
                                ? <span className="w-3 h-3 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                                : <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                        </span>
                        <span className={cx('font-medium', i === step ? 'text-ink' : 'text-slate-500')}>{label}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
}
