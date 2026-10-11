"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User as UserIcon, ArrowRight, Sparkles, Wand2, Trophy, Eye, EyeOff } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { User } from '@/lib/types';
import Logo from '@/components/Logo';
import { Alert, Button, inputClass } from '@/components/ui';
import ThemePicker from '@/components/ThemePicker';

type Mode = 'login' | 'register';

const HOME_BY_ROLE = { TEACHER: '/teacher', STUDENT: '/student/dashboard' } as const;

// บัญชีทดลองจาก seed.sql — แสดงเฉพาะตอนพัฒนา (ไม่แสดงเมื่อ build สำหรับ production)
const DEMO_ACCOUNTS = process.env.NODE_ENV !== 'production' ? [
    { label: 'ครู', email: 'teacher@lmsit.local', password: 'teacher1234' },
    { label: 'นักเรียน', email: 'student@lmsit.local', password: 'student1234' },
] : [];

// รับเฉพาะ path ภายในเว็บเรา (กันการพาไปเว็บอื่นผ่าน ?next=)
function safeNextPath(): string | null {
    const next = new URLSearchParams(window.location.search).get('next');
    return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

function IconInput({ icon, ...props }: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>
            <input {...props} className={`${inputClass} pl-11 ${props.className ?? ''}`} />
        </div>
    );
}

function BrandPanel() {
    const points = [
        { icon: <Wand2 size={18} />, text: 'AI เรียบเรียงบทเรียนให้เข้ากับสไตล์ของคุณ' },
        { icon: <Sparkles size={18} />, text: 'มีตัวอย่าง เปรียบเทียบ และคำถามชวนคิดระหว่างเรียน' },
        { icon: <Trophy size={18} />, text: 'ทำแบบทดสอบ รู้ผลทันที พร้อมเฉลยละเอียด' },
    ];
    return (
        <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-12 text-white">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-dots opacity-20" aria-hidden="true" />
            <Logo light />
            <div className="relative">
                <h2 className="text-4xl font-bold leading-tight">เรียนรู้ในแบบ<br />ที่เป็นคุณ ✨</h2>
                <ul className="mt-8 space-y-4">
                    {points.map(p => (
                        <li key={p.text} className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">{p.icon}</span>
                            <span className="text-white/90">{p.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="relative grid grid-cols-4 gap-3" aria-hidden="true">
                {['🤝', '🎯', '💡', '🎮'].map(e => (
                    <div key={e} className="aspect-square rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-3xl">{e}</div>
                ))}
            </div>
        </div>
    );
}

export default function AuthForm({ mode }: { mode: Mode }) {
    const isLogin = mode === 'login';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const { user } = await apiFetch<{ user: User }>(`/api/auth/${mode}`, {
                method: 'POST',
                body: JSON.stringify(isLogin ? { email, password } : { name, email, password }),
            });
            window.location.href = safeNextPath() || HOME_BY_ROLE[user.role];
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <BrandPanel />
            <div className="flex flex-col px-4 sm:px-6 py-8">
                <div className="lg:hidden mb-8"><Logo /></div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-md animate-fade-up">
                        <h1 className="text-3xl font-bold text-ink">{isLogin ? 'ยินดีต้อนรับกลับมา 👋' : 'สร้างบัญชีใหม่ 🚀'}</h1>
                        <p className="mt-2 text-slate-500">{isLogin ? 'เข้าสู่ระบบเพื่อเรียนต่อจากที่ค้างไว้' : 'สมัครฟรีสำหรับนักเรียน ใช้เวลาไม่ถึงนาที'}</p>

                        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                            {!isLogin && (
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อ-นามสกุล</label>
                                    <IconInput id="name" icon={<UserIcon size={18} />} value={name} onChange={e => setName(e.target.value)}
                                        required maxLength={100} autoComplete="name" placeholder="เช่น สมชาย ใจดี" />
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">อีเมล</label>
                                <IconInput id="email" type="email" icon={<Mail size={18} />} value={email} onChange={e => setEmail(e.target.value)}
                                    required autoComplete="email" placeholder="you@example.com" />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่าน</label>
                                <div className="relative">
                                    <IconInput id="password" type={showPassword ? 'text' : 'password'} icon={<Lock size={18} />}
                                        value={password} onChange={e => setPassword(e.target.value)} required
                                        minLength={isLogin ? undefined : 8} maxLength={72} className="pr-12"
                                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                                        placeholder={isLogin ? '••••••••' : 'อย่างน้อย 8 ตัวอักษร'} />
                                    <button type="button" onClick={() => setShowPassword(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
                                        aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && <Alert>{error}</Alert>}

                            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                                {submitting ? 'กำลังดำเนินการ...' : isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'} {!submitting && <ArrowRight size={18} />}
                            </Button>
                        </form>

                        <p className="text-center text-sm text-slate-500 mt-6">
                            {isLogin ? 'ยังไม่มีบัญชี? ' : 'มีบัญชีอยู่แล้ว? '}
                            <Link href={isLogin ? '/register' : '/login'} className="font-semibold text-brand-600 hover:text-brand-700">
                                {isLogin ? 'สมัครสมาชิกฟรี' : 'เข้าสู่ระบบ'}
                            </Link>
                        </p>

                        {isLogin && DEMO_ACCOUNTS.length > 0 && (
                            <div className="mt-8 rounded-2xl bg-white ring-1 ring-slate-200 p-4">
                                <div className="text-xs font-semibold text-slate-400 mb-2">บัญชีทดลอง (เฉพาะตอนพัฒนา) — กดเพื่อกรอกอัตโนมัติ</div>
                                <div className="flex gap-2">
                                    {DEMO_ACCOUNTS.map(a => (
                                        <button key={a.email} type="button" onClick={() => { setEmail(a.email); setPassword(a.password); }}
                                            className="flex-1 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 px-3 py-2 text-sm font-semibold text-slate-600 transition">
                                            {a.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">← กลับหน้าแรก</Link>
                    <ThemePicker label={false} />
                </div>
            </div>
        </div>
    );
}
