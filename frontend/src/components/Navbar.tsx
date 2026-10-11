"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User as UserIcon, LogOut } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';

const ROLE_LABEL = { TEACHER: 'ครู', STUDENT: 'นักเรียน' } as const;
const HOME_BY_ROLE = { TEACHER: '/teacher', STUDENT: '/student/dashboard' } as const;

export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        apiFetch<{ user: User }>('/api/auth/me')
            .then(data => setUser(data.user))
            .catch(() => router.replace('/login'));
    }, [router]);

    const handleLogout = async () => {
        await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        router.replace('/login');
        router.refresh();
    };

    return (
        <nav className="bg-indigo-600 p-4 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center px-4 gap-4">
                <Link href={user ? HOME_BY_ROLE[user.role] : '/'} className="text-xl font-bold flex items-center gap-2 shrink-0">
                    🎓 <span className="hidden sm:inline">AI Smart Learning</span>
                </Link>
                <div className="flex items-center gap-3 min-w-0">
                    {user && (
                        <span className="bg-indigo-700 px-3 py-1 rounded text-sm border border-indigo-500 flex items-center gap-2 min-w-0">
                            <UserIcon size={14} className="shrink-0" />
                            <span className="truncate">{user.name}</span>
                            <span className="opacity-70 shrink-0">· {ROLE_LABEL[user.role]}</span>
                        </span>
                    )}
                    <button onClick={handleLogout} className="hover:underline text-sm font-medium flex items-center gap-1 shrink-0">
                        <LogOut size={14} /> ออกจากระบบ
                    </button>
                </div>
            </div>
        </nav>
    );
}
