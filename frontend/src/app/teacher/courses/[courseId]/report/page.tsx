"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Users, Trophy, TrendingUp, BarChart3, ListChecks } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { CourseReport, ModuleResult } from '@/lib/types';
import { Alert, Card, EmptyState, PageLoader, ProgressBar, StatCard, cx } from '@/components/ui';

// ช่องในตาราง: คะแนนสูงสุด (กดดูผลสอบได้) / เข้าเรียนแต่ยังไม่สอบ / ยังไม่เริ่ม
function ResultCell({ result }: { result: ModuleResult }) {
    if (result.attempt_count > 0 && result.best_attempt_id) {
        const p = result.best_percent ?? 0;
        return (
            <Link href={`/student/attempts/${result.best_attempt_id}`}
                title={`สอบ ${result.attempt_count} ครั้ง — คะแนนสูงสุด ${result.best_score}/${result.best_total}`}
                className={cx('inline-flex min-w-16 justify-center rounded-xl px-2.5 py-1.5 font-bold transition hover:scale-105 hover:ring-2 hover:ring-brand-300',
                    result.passed ? (p >= 80 ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800') : (p >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'))}>
                {p}%
            </Link>
        );
    }
    if (result.visited) return <span className="inline-flex rounded-xl bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700">อ่านแล้ว</span>;
    return <span className="text-slate-300" aria-label="ยังไม่เริ่ม">—</span>;
}

export default function CourseReportPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const [report, setReport] = useState<CourseReport | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch<CourseReport>(`/api/courses/${courseId}/report`).then(setReport).catch(err => setError(err.message));
    }, [courseId]);

    if (error) return <Alert>{error}</Alert>;
    if (!report) return <PageLoader />;

    const students = report.students.length;
    const attempted = report.modules.filter(m => m.average_best_percent !== null);
    const avg = attempted.length ? Math.round(attempted.reduce((t, m) => t + (m.average_best_percent ?? 0), 0) / attempted.length) : null;
    const completed = report.students.filter(s => report.modules.length > 0 && s.passed_modules === report.modules.length).length;

    return (
        <div className="space-y-8">
            <Link href={`/teacher/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink">
                <ArrowLeft size={16} /> กลับไปจัดการวิชา
            </Link>
            <div className="animate-fade-up">
                <div className="text-sm font-semibold text-brand-600">รายงานผลการเรียน</div>
                <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-ink break-words">{report.course_title}</h1>
            </div>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Users size={22} />} label="นักเรียนที่เข้าเรียน" value={students} tone="brand" />
                <StatCard icon={<Trophy size={22} />} label="ผ่านครบทุกบท" value={`${completed}/${students}`} tone="green" />
                <StatCard icon={<TrendingUp size={22} />} label="คะแนนเฉลี่ย" value={avg === null ? '–' : `${avg}%`} tone="amber" hint={`เกณฑ์ผ่าน ${report.pass_percent}%`} />
                <StatCard icon={<BarChart3 size={22} />} label="บทเรียน" value={report.modules.length} tone="sky" />
            </section>

            {report.modules.length === 0 ? (
                <EmptyState icon={<BarChart3 size={28} />} title="วิชานี้ยังไม่มีบทเรียน" />
            ) : (
                <>
                    <section aria-labelledby="summary-heading">
                        <h2 id="summary-heading" className="text-xl font-bold text-ink mb-4">ภาพรวมรายบทเรียน</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {report.modules.map((m, i) => (
                                <Card key={m.id} className="p-6">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-400">บทที่ {i + 1}</div>
                                            <div className="font-bold text-ink break-words">{m.title}</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-2xl font-bold font-display text-ink">{m.average_best_percent === null ? '–' : `${m.average_best_percent}%`}</div>
                                            <div className="text-[11px] text-slate-400">เฉลี่ย</div>
                                        </div>
                                    </div>
                                    <div className="mt-5 space-y-3 text-sm">
                                        {[['เข้าเรียน', m.visited_count, 'brand'], ['สอบแล้ว', m.attempted_count, 'brand'], ['สอบผ่าน', m.passed_count, 'green']].map(([label, value, tone]) => (
                                            <div key={label as string}>
                                                <div className="flex justify-between text-slate-600 mb-1"><span>{label}</span><span className="font-semibold">{value}/{students} คน</span></div>
                                                <ProgressBar value={value as number} max={students} tone={tone as 'brand' | 'green'} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-slate-100">
                                        {m.quiz_count === 0
                                            ? <span className="text-xs font-semibold text-amber-600">⚠ ยังไม่มีข้อสอบ</span>
                                            : <Link href={`/teacher/modules/${m.id}/quizzes`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"><ListChecks size={15} /> ดูสถิติรายข้อ</Link>}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="students-heading">
                        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                            <div>
                                <h2 id="students-heading" className="text-xl font-bold text-ink">ผลรายนักเรียน</h2>
                                <p className="text-sm text-slate-500">คะแนนสูงสุดของแต่ละบท — กดที่ตัวเลขเพื่อดูคำตอบของนักเรียน</p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="rounded-lg bg-emerald-500 text-white px-2 py-1 font-semibold">ผ่าน ≥80%</span>
                                <span className="rounded-lg bg-emerald-100 text-emerald-800 px-2 py-1 font-semibold">ผ่าน</span>
                                <span className="rounded-lg bg-amber-100 text-amber-800 px-2 py-1 font-semibold">ไม่ผ่าน</span>
                                <span className="rounded-lg bg-rose-100 text-rose-700 px-2 py-1 font-semibold">&lt;40%</span>
                            </div>
                        </div>
                        {students === 0 ? (
                            <EmptyState icon={<Users size={28} />} title="ยังไม่มีนักเรียนเข้าเรียน" description="เมื่อนักเรียนเริ่มเรียนหรือทำแบบทดสอบ ผลจะแสดงที่นี่" />
                        ) : (
                            <Card className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-left text-slate-500">
                                            <th scope="col" className="p-4 sticky left-0 bg-white min-w-56 font-semibold">นักเรียน</th>
                                            {report.modules.map((m, i) => (
                                                <th key={m.id} scope="col" className="p-4 text-center font-semibold min-w-24" title={m.title}>บท {i + 1}</th>
                                            ))}
                                            <th scope="col" className="p-4 text-center font-semibold min-w-32">ความคืบหน้า</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.students.map(s => (
                                            <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                                <th scope="row" className="p-4 sticky left-0 bg-white text-left font-normal">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-fuchsia-500 text-white font-[Tahoma,'Leelawadee_UI',Thonburi,sans-serif] font-bold flex items-center justify-center shrink-0">{s.name.charAt(0)}</span>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-ink truncate">{s.name}</div>
                                                            <div className="text-xs text-slate-400 truncate">{s.email}</div>
                                                        </div>
                                                    </div>
                                                </th>
                                                {report.modules.map(m => (
                                                    <td key={m.id} className="p-4 text-center"><ResultCell result={s.results[m.id]} /></td>
                                                ))}
                                                <td className="p-4">
                                                    <div className="text-xs text-slate-500 mb-1 text-center">ผ่าน {s.passed_modules}/{report.modules.length}</div>
                                                    <ProgressBar value={s.passed_modules} max={report.modules.length} tone="green" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
