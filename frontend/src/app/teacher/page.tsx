"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { CourseSummary } from '@/lib/types';
import PageShell from '@/components/PageShell';
import CourseForm from '@/components/teacher/CourseForm';
import { cardClass, primaryButton } from '@/lib/ui';

export default function TeacherHome() {
    const router = useRouter();
    const [courses, setCourses] = useState<CourseSummary[] | null>(null);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);

    const loadCourses = useCallback(() => {
        apiFetch<CourseSummary[]>('/api/courses?mine=1')
            .then(setCourses)
            .catch(err => setError(err.message));
    }, []);

    useEffect(loadCourses, [loadCourses]);

    const createCourse = async (values: { title: string; description: string }) => {
        const { id } = await apiFetch<{ id: number }>('/api/courses', { method: 'POST', body: JSON.stringify(values) });
        router.push(`/teacher/courses/${id}`);
    };

    return (
        <PageShell
            title="วิชาที่ฉันสอน"
            actions={!creating && (
                <button onClick={() => setCreating(true)} className={`${primaryButton} flex items-center gap-2`}>
                    <Plus size={18} /> สร้างวิชาใหม่
                </button>
            )}
        >
            {creating && (
                <div className={`${cardClass} mb-8`}>
                    <h3 className="font-bold text-lg mb-4">สร้างวิชาใหม่</h3>
                    <CourseForm submitLabel="สร้างวิชา" onSubmit={createCourse} onCancel={() => setCreating(false)} />
                </div>
            )}

            {error && <p className="text-red-600">{error}</p>}
            {!courses && !error && <p className="text-gray-400">กำลังโหลด...</p>}

            {courses && courses.length === 0 && !creating && (
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-lg mb-4">คุณยังไม่มีวิชา</p>
                    <button onClick={() => setCreating(true)} className={primaryButton}>สร้างวิชาแรก</button>
                </div>
            )}

            {courses && courses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(c => (
                        <Link key={c.id} href={`/teacher/courses/${c.id}`}
                            className={`${cardClass} hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col`}>
                            <div className="w-12 h-12 mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="font-bold text-xl text-gray-900 mb-2 break-words">{c.title}</h3>
                            <p className="text-gray-400 text-sm line-clamp-2 flex-1">{c.description || 'ไม่มีคำอธิบาย'}</p>
                            <p className="mt-4 text-sm text-indigo-600 font-bold">{c.module_count} บทเรียน · จัดการ &rarr;</p>
                        </Link>
                    ))}
                </div>
            )}
        </PageShell>
    );
}
