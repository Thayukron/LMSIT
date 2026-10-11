"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Eye, Trophy, ArrowRight, PlayCircle, Library } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { CourseSummary } from '@/lib/types';
import { useUser } from '@/components/AppShell';
import { Alert, Button, Card, EmptyState, ProgressBar, Skeleton, StatCard } from '@/components/ui';
import { courseCover } from '@/lib/visual';

const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'อรุณสวัสดิ์';
    if (h < 17) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
};

function CourseCard({ course }: { course: CourseSummary }) {
    const cover = courseCover(course.id);
    const done = course.module_count > 0 && course.passed_count >= course.module_count;
    return (
        <Link href={`/student/courses/${course.id}`}
            className="group flex flex-col rounded-3xl bg-white ring-1 ring-slate-200/70 shadow-soft overflow-hidden hover:-translate-y-1 hover:shadow-lift transition-all duration-300">
            <div className={`relative h-36 bg-gradient-to-br ${cover.gradient} p-5 flex items-end`}>
                <div className="absolute inset-0 bg-dots opacity-30" aria-hidden="true" />
                <span className="absolute top-4 right-5 text-5xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" aria-hidden="true">{cover.emoji}</span>
                {done && <span className="relative rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700">✓ เรียนครบแล้ว</span>}
            </div>
            <div className="flex-1 flex flex-col p-6">
                <h3 className="text-xl font-bold text-ink leading-snug break-words">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-500 line-clamp-2 flex-1">{course.description || 'เรียนรู้ด้วยบทเรียนที่ AI ปรับให้เข้ากับสไตล์ของคุณ'}</p>
                <div className="mt-5">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>สอบผ่าน {course.passed_count}/{course.module_count} บท</span>
                        <span className="font-semibold">{course.module_count ? Math.round(course.passed_count / course.module_count * 100) : 0}%</span>
                    </div>
                    <ProgressBar value={course.passed_count} max={course.module_count} tone="green" label={`ความคืบหน้าวิชา ${course.title}`} />
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="text-slate-400 truncate">{course.teacher_name ? `👩‍🏫 ${course.teacher_name}` : `${course.module_count} บทเรียน`}</span>
                    <span className="flex items-center gap-1 font-semibold text-brand-600 group-hover:gap-2 transition-all">เข้าเรียน <ArrowRight size={16} /></span>
                </div>
            </div>
        </Link>
    );
}

export default function StudentDashboard() {
    const user = useUser();
    const [courses, setCourses] = useState<CourseSummary[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch<CourseSummary[]>('/api/courses').then(setCourses).catch(err => setError(err.message));
    }, []);

    const totals = (courses ?? []).reduce((t, c) => ({
        modules: t.modules + c.module_count, visited: t.visited + c.visited_count, passed: t.passed + c.passed_count,
    }), { modules: 0, visited: 0, passed: 0 });

    // วิชาที่เริ่มเรียนแล้วแต่ยังไม่จบ → แนะนำให้เรียนต่อ
    const continueCourse = courses?.find(c => c.visited_count > 0 && c.passed_count < c.module_count)
        ?? courses?.find(c => c.module_count > 0 && c.passed_count < c.module_count);

    return (
        <div className="space-y-10">
            <section className="animate-fade-up">
                {/* คำนวณคำทักทายหลังได้ข้อมูลผู้ใช้ (ฝั่งเบราว์เซอร์) เพื่อใช้เวลาของเครื่องผู้ใช้ */}
                <p className="text-brand-600 font-semibold min-h-6">{user ? `${greeting()} 👋` : ''}</p>
                <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-ink">{user ? user.name : <span className="inline-block w-48 h-9 skeleton rounded-xl align-middle" />}</h1>
                <p className="mt-2 text-slate-500">พร้อมเรียนรู้เรื่องใหม่วันนี้หรือยัง?</p>
            </section>

            {error && <Alert>{error}</Alert>}

            <section className="grid sm:grid-cols-3 gap-4">
                <StatCard icon={<Library size={22} />} label="วิชาทั้งหมด" value={courses ? courses.length : '–'} tone="brand" />
                <StatCard icon={<Eye size={22} />} label="บทที่เข้าเรียนแล้ว" value={courses ? `${totals.visited}/${totals.modules}` : '–'} tone="sky" />
                <StatCard icon={<Trophy size={22} />} label="บทที่สอบผ่าน" value={courses ? `${totals.passed}/${totals.modules}` : '–'} tone="green" />
            </section>

            {continueCourse && (
                <Card className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-ink to-brand-900 text-white ring-0">
                    <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-accent-500/30 blur-3xl" aria-hidden="true" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${courseCover(continueCourse.id).gradient} flex items-center justify-center text-3xl shrink-0`} aria-hidden="true">
                            {courseCover(continueCourse.id).emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-white/60">{continueCourse.visited_count > 0 ? 'เรียนต่อจากที่ค้างไว้' : 'แนะนำให้เริ่มเรียน'}</div>
                            <div className="text-2xl font-bold font-display truncate">{continueCourse.title}</div>
                            <div className="mt-3 max-w-md"><ProgressBar value={continueCourse.passed_count} max={continueCourse.module_count} tone="green" label="ความคืบหน้า" className="bg-white/15" /></div>
                        </div>
                        <Button href={`/student/courses/${continueCourse.id}`} variant="white" size="lg"><PlayCircle size={20} /> เรียนต่อ</Button>
                    </div>
                </Card>
            )}

            <section>
                <h2 className="text-2xl font-bold text-ink mb-5">วิชาของฉัน</h2>
                {!courses && !error ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-3xl" />)}
                    </div>
                ) : courses && courses.length === 0 ? (
                    <EmptyState icon={<BookOpen size={28} />} title="ยังไม่มีวิชาในระบบ" description="เมื่อครูเปิดวิชาแล้ว วิชาจะแสดงที่นี่" />
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses?.map((c, i) => (
                            <div key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}><CourseCard course={c} /></div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
