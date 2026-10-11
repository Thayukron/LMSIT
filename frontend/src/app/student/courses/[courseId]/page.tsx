"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Check, ClipboardCheck, Eye, Settings, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { CourseDetail, CourseProgress } from '@/lib/types';
import { Alert, Badge, Button, EmptyState, PageLoader, ProgressRing, cx } from '@/components/ui';
import { courseCover } from '@/lib/visual';

type ModuleProgress = CourseProgress['modules'][number];

function StatusNode({ index, progress }: { index: number; progress?: ModuleProgress }) {
    if (progress?.passed) {
        return <span className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30" aria-label="สอบผ่านแล้ว"><Check size={22} strokeWidth={3} /></span>;
    }
    if (progress?.visited || (progress?.attempt_count ?? 0) > 0) {
        return <span className="w-11 h-11 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center ring-4 ring-brand-100">{index + 1}</span>;
    }
    return <span className="w-11 h-11 rounded-full bg-white text-slate-400 font-bold flex items-center justify-center ring-2 ring-slate-200">{index + 1}</span>;
}

export default function StudentCoursePage() {
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [progress, setProgress] = useState<CourseProgress | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch<CourseDetail>(`/api/courses/${courseId}`).then(setCourse).catch(err => setError(err.message));
        apiFetch<CourseProgress>(`/api/courses/${courseId}/progress`).then(setProgress).catch(console.error);
    }, [courseId]);

    if (error) return <Alert>{error}</Alert>;
    if (!course) return <PageLoader />;

    const cover = courseCover(course.id);
    const byModule = Object.fromEntries((progress?.modules ?? []).map(p => [p.module_id, p]));
    const percent = progress && progress.total_modules ? Math.round(progress.passed_modules / progress.total_modules * 100) : 0;
    const nextModule = course.modules.find(m => !byModule[m.id]?.passed);

    return (
        <div className="space-y-10">
            {/* Hero ของวิชา */}
            <section className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${cover.gradient} text-white p-6 sm:p-10 animate-fade-up`}>
                <div className="absolute inset-0 bg-dots opacity-25" aria-hidden="true" />
                <span className="absolute -right-4 -bottom-8 text-[10rem] opacity-25 select-none" aria-hidden="true">{cover.emoji}</span>
                <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="flex-1 min-w-0">
                        <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white">
                            <ArrowLeft size={16} /> ห้องเรียนของฉัน
                        </Link>
                        <h1 className="mt-4 text-3xl sm:text-5xl font-bold leading-tight break-words">{course.title}</h1>
                        {course.description && <p className="mt-3 text-white/85 max-w-2xl whitespace-pre-line">{course.description}</p>}
                        <div className="mt-5 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">📚 {course.modules.length} บทเรียน</span>
                            {course.teacher_name && <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">👩‍🏫 {course.teacher_name}</span>}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            {nextModule && (
                                <Button href={`/student/modules/${nextModule.id}`} variant="white" size="lg">
                                    <Sparkles size={18} /> {byModule[nextModule.id]?.visited ? 'เรียนต่อ' : 'เริ่มเรียน'}
                                </Button>
                            )}
                            {course.can_edit && (
                                <Button href={`/teacher/courses/${course.id}`} variant="ghost" size="lg" className="text-white hover:bg-white/15 hover:text-white">
                                    <Settings size={18} /> จัดการวิชา
                                </Button>
                            )}
                        </div>
                    </div>
                    {progress && !course.can_edit && course.modules.length > 0 && (
                        <div className="rounded-3xl bg-white/95 text-ink p-6 flex items-center gap-6 shadow-lift shrink-0">
                            <ProgressRing percent={percent} size={110} tone="green">
                                <span className="text-2xl font-bold font-display">{percent}%</span>
                            </ProgressRing>
                            <div className="space-y-2 text-sm">
                                <div className="font-bold text-base">ความคืบหน้า</div>
                                <div className="flex items-center gap-2 text-slate-600"><Eye size={16} className="text-brand-500" /> เข้าเรียน {progress.visited_modules}/{progress.total_modules} บท</div>
                                <div className="flex items-center gap-2 text-slate-600"><Check size={16} className="text-emerald-500" /> สอบผ่าน {progress.passed_modules}/{progress.total_modules} บท</div>
                                <div className="text-xs text-slate-400">เกณฑ์ผ่าน {progress.pass_percent}%</div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* เส้นทางการเรียน */}
            <section>
                <h2 className="text-2xl font-bold text-ink mb-6">เส้นทางการเรียน</h2>
                {course.modules.length === 0 ? (
                    <EmptyState icon={<BookOpen size={28} />} title="วิชานี้ยังไม่มีบทเรียน" description="ครูกำลังเตรียมเนื้อหา กลับมาดูอีกครั้งเร็วๆ นี้" />
                ) : (
                    <ol className="relative space-y-4">
                        <span className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-slate-200" aria-hidden="true" />
                        {course.modules.map((m, i) => {
                            const p = byModule[m.id];
                            const isNext = nextModule?.id === m.id && !course.can_edit;
                            return (
                                <li key={m.id} className="relative flex gap-4 sm:gap-6 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className="relative z-10 pt-4"><StatusNode index={i} progress={p} /></div>
                                    <div className={cx('flex-1 min-w-0 rounded-3xl bg-white p-5 sm:p-6 ring-1 shadow-soft transition',
                                        isNext ? 'ring-2 ring-brand-400 shadow-lift' : 'ring-slate-200/70')}>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-slate-400">บทที่ {i + 1}</span>
                                                    {isNext && <Badge tone="brand">แนะนำถัดไป</Badge>}
                                                    {p?.passed && <Badge tone="green">ผ่านแล้ว</Badge>}
                                                    {!p?.passed && p?.visited && <Badge tone="sky">กำลังเรียน</Badge>}
                                                </div>
                                                <h3 className="text-lg font-bold text-ink break-words">{m.title}</h3>
                                                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1"><ClipboardCheck size={15} /> {m.quiz_count ? `แบบทดสอบ ${m.quiz_count} ข้อ` : 'ยังไม่มีแบบทดสอบ'}</span>
                                                    {p && p.attempt_count > 0 && (
                                                        <span className={cx('font-semibold', p.passed ? 'text-emerald-600' : 'text-amber-600')}>
                                                            คะแนนสูงสุด {p.best_score}/{p.best_total} ({p.best_percent}%)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <Button href={`/student/modules/${m.id}`} variant={isNext ? 'primary' : 'secondary'} size="sm">
                                                    <BookOpen size={16} /> {p?.visited ? 'ทบทวน' : 'เรียน'}
                                                </Button>
                                                {m.quiz_count > 0 && (
                                                    <Button href={`/student/modules/${m.id}/quiz`} variant="ghost" size="sm">
                                                        <ClipboardCheck size={16} /> สอบ
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </section>
        </div>
    );
}
