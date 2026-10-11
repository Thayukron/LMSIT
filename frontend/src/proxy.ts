import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Role } from '@/lib/types';

const HOME_BY_ROLE: Record<Role, string> = {
    TEACHER: '/teacher',
    STUDENT: '/student/dashboard',
};

/**
 * อ่าน role จาก JWT ใน cookie เพื่อใช้ "พาไปหน้าที่ถูกต้อง" เท่านั้น
 * ไม่ได้ตรวจลายเซ็น จึงไม่ใช่การรักษาความปลอดภัย: Backend ตรวจ JWT และสิทธิ์ทุก request อยู่แล้ว
 */
function readSession(request: NextRequest): { role: Role } | null {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
        if (payload.role !== 'TEACHER' && payload.role !== 'STUDENT') return null;
        return { role: payload.role };
    } catch {
        return null;
    }
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = readSession(request);
    const isAuthPage = pathname === '/login' || pathname === '/register';

    // หน้าแรก และหน้า Login/สมัคร: ถ้า login อยู่แล้วพาไปหน้าหลักของ role นั้น
    if (pathname === '/' || isAuthPage) {
        if (session) return NextResponse.redirect(new URL(HOME_BY_ROLE[session.role], request.url));
        if (pathname === '/') return NextResponse.redirect(new URL('/login', request.url));
        return NextResponse.next();
    }

    // หน้าที่ต้อง login
    if (!session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // หน้าครูเข้าได้เฉพาะครู (ครูเข้าหน้านักเรียนได้ เพื่อดูตัวอย่างบทเรียน)
    if (pathname.startsWith('/teacher') && session.role !== 'TEACHER') {
        return NextResponse.redirect(new URL(HOME_BY_ROLE[session.role], request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/login', '/register', '/student/:path*', '/teacher/:path*'],
};
