"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { CourseDetail } from '@/lib/types';
import PageShell from '@/components/PageShell';
import Spinner from '@/components/Spinner';
import { cardClass, secondaryButton } from '@/lib/ui';

export default function StudentCoursePage() {
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch<CourseDetail>(`/api/courses/${courseId}`)
            .then(setCourse)
            .catch(err => setError(err.message));
    }, [courseId]);

    const back = { href: '/student/dashboard', label: 'ห้องเรียนของฉัน' };

    if (error) return <PageShell title="เกิดข้อผิดพลาด" back={back}><p className="text-red-600">{error}</p></PageShell>;
    if (!course) return <Spinner />;

    return (
        <PageShell
            title={course.title}
            back={back}
            actions={course.can_edit && (
                <Link href={`/teacher/courses/${course.id}`} className={secondaryButton}>จัดการวิชา</Link>
            )}
        >
            {course.description && <p className="text-gray-500 mb-8 whitespace-pre-line">{course.description}</p>}

            {course.modules.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-lg italic">วิชานี้ยังไม่มีบทเรียน</p>
                </div>
            ) : (
                <ol className="space-y-4">
                    {course.modules.map((m, i) => (
                        <li key={m.id}>
                            <Link href={`/student/modules/${m.id}`}
                                className={`${cardClass} flex items-center gap-6 hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
                                <span className="text-3xl font-black text-indigo-200 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                                <span className="font-bold text-lg text-gray-900 flex-1 min-w-0 break-words">{m.title}</span>
                                <span className="text-indigo-600 font-bold text-sm shrink-0">เรียน &rarr;</span>
                            </Link>
                        </li>
                    ))}
                </ol>
            )}
        </PageShell>
    );
}
