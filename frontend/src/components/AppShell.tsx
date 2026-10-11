"use client";
import React, { Suspense, createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BookOpenCheck, LogOut, ChevronDown, GraduationCap, Presentation } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { Role, User } from '@/lib/types';
import Logo from '@/components/Logo';
import { cx } from '@/components/ui';

// ผู้ใช้ที่ login อยู่ ให้ทุกหน้าใน AppShell ใช้ผ่าน useUser()
const UserContext = createContext<User | null>(null);
export const useUser = () => useContext(UserContext);

const NAV: Record<Role, NavItem[]> = {
    STUDENT: [
        { href: '/student/dashboard', label: 'ห้องเรียนของฉัน', icon: <LayoutDashboard size={18} /> },
    ],
    TEACHER: [
        { href: '/teacher', label: 'วิชาที่สอน', icon: <Presentation size={18} /> },
        { href: '/student/dashboard', label: 'มุมมองนักเรียน', icon: <BookOpenCheck size={18} /> },
    ],
};

const HOME_BY_ROLE: Record<Role, string> = { TEACHER: '/teacher', STUDENT: '/student/dashboard' };

function Avatar({ name }: { name: string }) {
    return (
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-fuchsia-500 text-white font-[Tahoma,'Leelawadee_UI',Thonburi,sans-serif] font-bold flex items-center justify-center shrink-0">
            {name.trim().charAt(0) || '?'}
        </span>
    );
}

function UserMenu({ user }: { user: User }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const logout = async () => {
        await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        router.replace('/login');
        router.refresh();
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-slate-100 transition">
                <Avatar name={user.name} />
                <span className="hidden sm:block text-left leading-tight max-w-40">
                    <span className="block text-sm font-semibold text-ink truncate">{user.name}</span>
                    <span className="block text-xs text-slate-400">{user.role === 'TEACHER' ? 'ครูผู้สอน' : 'นักเรียน'}</span>
                </span>
                <ChevronDown size={16} className="text-slate-400" />
            </button>
            {open && (
                <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-lift ring-1 ring-slate-200 animate-pop origin-top-right z-50">
                    <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                        <div className="font-semibold text-ink truncate">{user.name}</div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    </div>
                    <button role="menuitem" onClick={logout}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                        <LogOut size={16} /> ออกจากระบบ
                    </button>
                </div>
            )}
        </div>
    );
}

type NavItem = { href: string; label: string; icon: React.ReactNode };

// เมนูหลัก (แยกออกมาเพราะ usePathname ต้องอยู่ใน <Suspense> ใน route ที่มี [param])
function NavLinks({ nav, mobile = false }: { nav: NavItem[]; mobile?: boolean }) {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href || (href !== '/student/dashboard' && pathname.startsWith(href));
    if (mobile) {
        return (
            <nav className="md:hidden flex gap-1 px-4 pb-2 overflow-x-auto" aria-label="เมนูหลัก">
                {nav.map(item => (
                    <Link key={item.href} href={item.href}
                        className={cx('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap',
                            isActive(item.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-500')}>
                        {item.icon} {item.label}
                    </Link>
                ))}
            </nav>
        );
    }
    return (
        <nav className="hidden md:flex items-center gap-1" aria-label="เมนูหลัก">
            {nav.map(item => (
                <Link key={item.href} href={item.href}
                    className={cx('flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition',
                        isActive(item.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-ink hover:bg-slate-100')}>
                    {item.icon} {item.label}
                </Link>
            ))}
        </nav>
    );
}

// โครงหน้าหลัง login: แถบบนแบบโปร่ง + เนื้อหา
export default function AppShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        apiFetch<{ user: User }>('/api/auth/me')
            .then(data => setUser(data.user))
            .catch(() => router.replace('/login'));
    }, [router]);

    const nav = user ? NAV[user.role] : [];

    return (
        <UserContext.Provider value={user}>
            <div className="min-h-screen flex flex-col">
                <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-slate-200/70">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center gap-6">
                        <Logo href={user ? HOME_BY_ROLE[user.role] : '/'} />
                        <Suspense fallback={null}><NavLinks nav={nav} /></Suspense>
                        <div className="ml-auto flex items-center gap-3">
                            {user?.role === 'TEACHER' && (
                                <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold ring-1 ring-amber-100">
                                    <GraduationCap size={14} /> โหมดผู้สอน
                                </span>
                            )}
                            {user ? <UserMenu user={user} /> : <div className="w-9 h-9 rounded-full skeleton" />}
                        </div>
                    </div>
                    {nav.length > 1 && <Suspense fallback={null}><NavLinks nav={nav} mobile /></Suspense>}
                </header>
                <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">{children}</main>
            </div>
        </UserContext.Provider>
    );
}
