"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import type { User } from '@/lib/types';

type Mode = 'login' | 'register';

const HOME_BY_ROLE = { TEACHER: '/teacher', STUDENT: '/student/dashboard' } as const;

// รับเฉพาะ path ภายในเว็บเรา (กันการพาไปเว็บอื่นผ่าน ?next=)
function safeNextPath(): string | null {
    const next = new URLSearchParams(window.location.search).get('next');
    return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

export default function AuthForm({ mode }: { mode: Mode }) {
    const isLogin = mode === 'login';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

    const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition";

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-sm p-8 sm:p-10">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-3">🎓</div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Smart Learning</h1>
                    <p className="text-gray-400 mt-1">{isLogin ? 'เข้าสู่ระบบเพื่อเริ่มเรียน' : 'สมัครสมาชิกสำหรับนักเรียน'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                            <input id="name" className={inputClass} value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoComplete="name" />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                        <input id="email" type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                        <input id="password" type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} required
                            minLength={isLogin ? undefined : 8} maxLength={72} autoComplete={isLogin ? 'current-password' : 'new-password'} />
                        {!isLogin && <p className="text-xs text-gray-400 mt-1">อย่างน้อย 8 ตัวอักษร</p>}
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
                    )}

                    <button type="submit" disabled={submitting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold transition">
                        {submitting ? 'กำลังดำเนินการ...' : isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    {isLogin ? 'ยังไม่มีบัญชี? ' : 'มีบัญชีแล้ว? '}
                    <Link href={isLogin ? '/register' : '/login'} className="text-indigo-600 font-bold hover:underline">
                        {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                    </Link>
                </p>
            </div>
        </div>
    );
}
