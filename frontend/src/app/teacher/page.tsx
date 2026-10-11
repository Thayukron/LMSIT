"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, Layers, ListChecks, Users, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { CourseSummary } from '@/lib/types';
import { useUser } from '@/components/AppShell';
import { Alert, Button, EmptyState, PageHeader, Skeleton, StatCard } from '@/components/ui';
import Modal from '@/components/Modal';
import CourseForm from '@/components/teacher/CourseForm';
import { courseCover } from '@/lib/visual';

function TeacherCourseCard({ course }: { course: CourseSummary }) {
    const cover = courseCover(course.id);
    const needsQuiz = course.module_count > 0 && course.quiz_count === 0;
    return (
        <Link href={`/teacher/courses/${course.id}`}
            className="group flex flex-col rounded-3xl bg-white ring-1 ring-slate-200/70 shadow-soft overflow-hidden hover:-translate-y-1 hover:shadow-lift transition-all duration-300">
            <div className={`relative h-28 bg-gradient-to-br ${cover.gradient}`}>
                <div className="absolute inset-0 bg-dots opacity-30" aria-hidden="true" />
                <span className="absolute bottom-3 right-5 text-5xl group-hover:scale-110 transition-transform" aria-hidden="true">{cover.emoji}</span>
            </div>
            <div className="flex-1 flex flex-col p-6">
                <h3 className="text-xl font-bold text-ink break-words">{course.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 line-clamp-2 flex-1">{course.description || 'ยังไม่มีคำอธิบายวิชา'}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    {[['บทเรียน', course.module_count], ['ข้อสอบ', course.quiz_count], ['นักเรียน', course.student_count]].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-slate-50 py-2">
                            <div className="text-lg font-bold font-display text-ink">{value}</div>
                            <div className="text-[11px] text-slate-500">{label}</div>
                        </div>
                    ))}
                </div>
                {needsQuiz && <div className="mt-3 text-xs font-semibold text-amber-600">⚠ ยังไม่มีข้อสอบ — นักเรียนยังสอบไม่ได้</div>}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end text-sm font-semibold text-brand-600 gap-1 group-hover:gap-2 transition-all">
                    จัดการวิชา <ArrowRight size={16} />
                </div>
            </div>
        </Link>
    );
}

export default function TeacherHome() {
    const router = useRouter();
    const user = useUser();
    const [courses, setCourses] = useState<CourseSummary[] | null>(null);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const closeCreate = useCallback(() => setCreating(false), []);

    useEffect(() => {
        apiFetch<CourseSummary[]>('/api/courses?mine=1').then(setCourses).catch(err => setError(err.message));
    }, []);

    const createCourse = async (values: { title: string; description: string }) => {
        const { id } = await apiFetch<{ id: number }>('/api/courses', { method: 'POST', body: JSON.stringify(values) });
        router.push(`/teacher/courses/${id}`);
    };

    const sum = (key: 'module_count' | 'quiz_count' | 'student_count') => (courses ?? []).reduce((t, c) => t + c[key], 0);

    return (
        <div className="space-y-10">
            <PageHeader
                eyebrow={user ? `สวัสดี ${user.name} 👋` : ' '}
                title="ห้องพักครู"
                description="จัดการวิชา บทเรียน และข้อสอบ พร้อมติดตามผลการเรียนของนักเรียน"
                actions={<Button onClick={() => setCreating(true)} size="lg"><Plus size={18} /> สร้างวิชาใหม่</Button>}
            />

            {error && <Alert>{error}</Alert>}

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<BookOpen size={22} />} label="วิชาที่สอน" value={courses ? courses.length : '–'} tone="brand" />
                <StatCard icon={<Layers size={22} />} label="บทเรียน" value={courses ? sum('module_count') : '–'} tone="sky" />
                <StatCard icon={<ListChecks size={22} />} label="ข้อสอบ" value={courses ? sum('quiz_count') : '–'} tone="pink" />
                <StatCard icon={<Users size={22} />} label="นักเรียน (รวมทุกวิชา)" value={courses ? sum('student_count') : '–'} tone="green" />
            </section>

            <section>
                <h2 className="text-2xl font-bold text-ink mb-5">วิชาของฉัน</h2>
                {!courses && !error ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-3xl" />)}</div>
                ) : courses?.length === 0 ? (
                    <EmptyState icon={<BookOpen size={28} />} title="เริ่มสร้างวิชาแรกของคุณ"
                        description="สร้างวิชา เพิ่มบทเรียนจากไฟล์ที่มีอยู่ แล้วให้ AI ช่วยทำบทเรียนและข้อสอบ"
                        action={<Button onClick={() => setCreating(true)}><Plus size={18} /> สร้างวิชาใหม่</Button>} />
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses?.map((c, i) => <div key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}><TeacherCourseCard course={c} /></div>)}
                        <button onClick={() => setCreating(true)}
                            className="min-h-72 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-brand-300 hover:text-brand-600 hover:bg-white transition flex flex-col items-center justify-center gap-3">
                            <span className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center"><Plus size={26} /></span>
                            <span className="font-semibold">สร้างวิชาใหม่</span>
                        </button>
                    </div>
                )}
            </section>

            <Modal open={creating} title="สร้างวิชาใหม่" onClose={closeCreate}>
                <CourseForm submitLabel="สร้างวิชา" onSubmit={createCourse} onCancel={closeCreate} />
            </Modal>
        </div>
    );
}
