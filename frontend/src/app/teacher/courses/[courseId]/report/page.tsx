"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { CourseReport, ModuleResult } from '@/lib/types';
import PageShell from '@/components/PageShell';
import Spinner from '@/components/Spinner';
import { cardClass } from '@/lib/ui';

// ช่องในตาราง: คะแนนสูงสุด (กดดูผลสอบได้) / เข้าเรียนแต่ยังไม่สอบ / ยังไม่เริ่ม
function ResultCell({ result }: { result: ModuleResult }) {
    if (result.attempt_count > 0 && result.best_attempt_id) {
        return (
            <Link href={`/student/attempts/${result.best_attempt_id}`}
                title={`สอบ ${result.attempt_count} ครั้ง — คะแนนสูงสุด ${result.best_score}/${result.best_total}`}
                className={`inline-block min-w-14 px-2 py-1 rounded-lg font-bold hover:ring-2 hover:ring-indigo-300 ${result.passed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {result.best_percent}%
            </Link>
        );
    }
    if (result.visited) return <span className="text-xs text-indigo-500">เข้าเรียนแล้ว</span>;
    return <span className="text-gray-300" aria-label="ยังไม่เริ่ม">–</span>;
}

export default function CourseReportPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const [report, setReport] = useState<CourseReport | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch<CourseReport>(`/api/courses/${courseId}/report`).then(setReport).catch(err => setError(err.message));
    }, [courseId]);

    const back = { href: `/teacher/courses/${courseId}`, label: 'กลับไปจัดการวิชา' };
    if (error) return <PageShell title="เกิดข้อผิดพลาด" back={back}><p className="text-red-600">{error}</p></PageShell>;
    if (!report) return <Spinner />;

    return (
        <PageShell title={`รายงานผลการเรียน: ${report.course_title}`} back={back}>
            {report.modules.length === 0 ? (
                <p className="text-gray-400">วิชานี้ยังไม่มีบทเรียน</p>
            ) : (
                <>
                    <section aria-labelledby="summary-heading" className="mb-10">
                        <h3 id="summary-heading" className="font-bold text-xl mb-4">สรุปรายบทเรียน</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {report.modules.map((m, i) => (
                                <div key={m.id} className={cardClass}>
                                    <p className="text-xs font-black text-indigo-300 mb-1">บทที่ {i + 1}</p>
                                    <p className="font-bold text-gray-900 mb-4 break-words">{m.title}</p>
                                    <dl className="grid grid-cols-2 gap-y-2 text-sm">
                                        <dt className="text-gray-500">เข้าเรียน</dt><dd className="text-right font-bold">{m.visited_count} คน</dd>
                                        <dt className="text-gray-500">สอบแล้ว</dt><dd className="text-right font-bold">{m.attempted_count} คน</dd>
                                        <dt className="text-gray-500">สอบผ่าน</dt><dd className="text-right font-bold text-green-700">{m.passed_count} คน</dd>
                                        <dt className="text-gray-500">คะแนนเฉลี่ย</dt>
                                        <dd className="text-right font-bold">{m.average_best_percent === null ? '–' : `${m.average_best_percent}%`}</dd>
                                    </dl>
                                    {m.quiz_count === 0 ? (
                                        <p className="text-xs text-amber-600 mt-4">ยังไม่มีข้อสอบ</p>
                                    ) : (
                                        <Link href={`/teacher/modules/${m.id}/quizzes`} className="text-xs text-indigo-600 font-bold hover:underline mt-4 inline-block">
                                            ดูสถิติรายข้อ &rarr;
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="students-heading">
                        <h3 id="students-heading" className="font-bold text-xl mb-1">ผลรายนักเรียน ({report.students.length} คน)</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            ตัวเลขคือคะแนนสูงสุดของแต่ละบท (เขียว = ผ่านเกณฑ์ {report.pass_percent}%) กดที่ตัวเลขเพื่อดูคำตอบ
                        </p>
                        {report.students.length === 0 ? (
                            <p className="text-gray-400 bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                                ยังไม่มีนักเรียนเข้าเรียนหรือสอบในวิชานี้
                            </p>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-left">
                                            <th scope="col" className="p-4 sticky left-0 bg-white min-w-48">นักเรียน</th>
                                            {report.modules.map((m, i) => (
                                                <th key={m.id} scope="col" className="p-4 text-center font-bold min-w-24" title={m.title}>บทที่ {i + 1}</th>
                                            ))}
                                            <th scope="col" className="p-4 text-center min-w-24">สอบผ่าน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.students.map(s => (
                                            <tr key={s.id} className="border-b border-gray-50 last:border-0">
                                                <th scope="row" className="p-4 sticky left-0 bg-white text-left font-normal">
                                                    <span className="font-bold block">{s.name}</span>
                                                    <span className="text-xs text-gray-400">{s.email}</span>
                                                </th>
                                                {report.modules.map(m => (
                                                    <td key={m.id} className="p-4 text-center"><ResultCell result={s.results[m.id]} /></td>
                                                ))}
                                                <td className="p-4 text-center font-bold">{s.passed_modules} / {report.modules.length}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </PageShell>
    );
}
