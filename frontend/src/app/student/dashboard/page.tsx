"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { CourseSummary } from '@/lib/types';
import PageShell from '@/components/PageShell';
import ProgressBar from '@/components/ProgressBar';
import { BookOpen } from 'lucide-react';

export default function StudentDashboard() {
    const [courses, setCourses] = useState<CourseSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch<CourseSummary[]>('/api/courses')
            .then(setCourses)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <PageShell title="ห้องเรียนของฉัน">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>)}
                </div>
            ) : error ? (
                <p className="text-red-600">{error}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.length > 0 ? courses.map((c) => (
                        <Link href={`/student/courses/${c.id}`} key={c.id}>
                            <div className="group bg-white p-8 rounded-[2rem] shadow-sm cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-indigo-100 flex flex-col justify-between h-full">
                                <div>
                                    <div className="mb-6 w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                        <BookOpen size={32} />
                                    </div>
                                    <h3 className="font-bold text-2xl mb-3 text-gray-900 leading-tight break-words">
                                        {c.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                                        {c.description || `เริ่มเรียนรู้วิชา ${c.title} ด้วยระบบ AI อัจฉริยะที่สรุปเนื้อหาให้คุณเข้าใจง่ายขึ้น`}
                                    </p>
                                </div>
                                {c.module_count > 0 && (
                                    <div className="mt-6">
                                        <ProgressBar value={c.passed_count} max={c.module_count} label="สอบผ่าน (บท)" />
                                    </div>
                                )}
                                <div className="mt-6 flex items-center justify-between text-sm">
                                    <span className="text-gray-400">{c.module_count} บทเรียน{c.teacher_name ? ` · ${c.teacher_name}` : ''}</span>
                                    <span className="text-indigo-600 font-black uppercase tracking-widest">เข้าเรียน &rarr;</span>
                                </div>
                            </div>
                        </Link>
                    )) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 text-lg italic font-medium">ยังไม่มีวิชาในระบบ</p>
                        </div>
                    )}
                </div>
            )}
        </PageShell>
    );
}
