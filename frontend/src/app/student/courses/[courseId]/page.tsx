"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Eye } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { CourseDetail, CourseProgress } from '@/lib/types';
import PageShell from '@/components/PageShell';
import Spinner from '@/components/Spinner';
import ProgressBar from '@/components/ProgressBar';
import { cardClass, secondaryButton } from '@/lib/ui';

export default function StudentCoursePage() {
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [progress, setProgress] = useState<CourseProgress | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch<CourseDetail>(`/api/courses/${courseId}`)
            .then(setCourse)
            .catch(err => setError(err.message));
        apiFetch<CourseProgress>(`/api/courses/${courseId}/progress`)
            .then(setProgress)
            .catch(console.error);
    }, [courseId]);

    const back = { href: '/student/dashboard', label: 'ห้องเรียนของฉัน' };

    if (error) return <PageShell title="เกิดข้อผิดพลาด" back={back}><p className="text-red-600">{error}</p></PageShell>;
    if (!course) return <Spinner />;

    const progressByModule = Object.fromEntries((progress?.modules ?? []).map(p => [p.module_id, p]));

    return (
        <PageShell
            title={course.title}
            back={back}
            actions={course.can_edit && (
                <Link href={`/teacher/courses/${course.id}`} className={secondaryButton}>จัดการวิชา</Link>
            )}
        >
            {course.description && <p className="text-gray-500 mb-8 whitespace-pre-line">{course.description}</p>}

            {progress && progress.total_modules > 0 && !course.can_edit && (
                <div className={`${cardClass} mb-8 grid sm:grid-cols-2 gap-6`}>
                    <ProgressBar value={progress.visited_modules} max={progress.total_modules} label="เข้าเรียนแล้ว (บท)" tone="indigo" />
                    <ProgressBar value={progress.passed_modules} max={progress.total_modules} label={`สอบผ่าน (บท) — เกณฑ์ ${progress.pass_percent}%`} />
                </div>
            )}

            {course.modules.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-lg italic">วิชานี้ยังไม่มีบทเรียน</p>
                </div>
            ) : (
                <ol className="space-y-4">
                    {course.modules.map((m, i) => {
                        const p = progressByModule[m.id];
                        return (
                            <li key={m.id}>
                                <Link href={`/student/modules/${m.id}`}
                                    className={`${cardClass} flex flex-wrap items-center gap-x-6 gap-y-2 hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
                                    <span className={`text-3xl font-black shrink-0 ${p?.passed ? 'text-green-400' : 'text-indigo-200'}`}>
                                        {p?.passed ? <CheckCircle2 size={32} aria-label="สอบผ่านแล้ว" /> : String(i + 1).padStart(2, '0')}
                                    </span>
                                    <span className="font-bold text-lg text-gray-900 flex-1 min-w-0 break-words">{m.title}</span>
                                    {p && !course.can_edit && (
                                        <span className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                            {p.visited && (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700"><Eye size={12} /> เข้าเรียนแล้ว</span>
                                            )}
                                            {p.attempt_count > 0 && (
                                                <span className={`px-2 py-1 rounded-lg ${p.passed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    คะแนนสูงสุด {p.best_score}/{p.best_total} ({p.best_percent}%)
                                                </span>
                                            )}
                                        </span>
                                    )}
                                    <span className="text-indigo-600 font-bold text-sm shrink-0">เรียน &rarr;</span>
                                </Link>
                            </li>
                        );
                    })}
                </ol>
            )}
        </PageShell>
    );
}
