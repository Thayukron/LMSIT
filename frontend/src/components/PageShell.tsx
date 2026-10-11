import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface PageShellProps {
    title: React.ReactNode;
    back?: { href: string; label: string };
    actions?: React.ReactNode;
    children: React.ReactNode;
}

// โครงหน้ามาตรฐาน: Navbar + ลิงก์ย้อนกลับ + หัวข้อ (ขีดข้างสีม่วง) + ปุ่มด้านขวา
export default function PageShell({ title, back, actions, children }: PageShellProps) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <Navbar />
            <div className="container mx-auto mt-8 px-4 pb-16 max-w-6xl">
                {back && (
                    <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4">
                        <ChevronLeft size={16} /> {back.label}
                    </Link>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 border-l-8 border-indigo-600 pl-4 min-w-0 break-words">
                        {title}
                    </h2>
                    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                </div>
                {children}
            </div>
        </div>
    );
}
