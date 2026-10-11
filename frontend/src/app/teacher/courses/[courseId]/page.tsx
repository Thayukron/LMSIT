"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Eye, ListChecks } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { CourseDetail } from '@/lib/types';
import PageShell from '@/components/PageShell';
import Spinner from '@/components/Spinner';
import CourseForm from '@/components/teacher/CourseForm';
import AddModuleForm from '@/components/teacher/AddModuleForm';
import { cardClass, primaryButton, secondaryButton, dangerButton, successBox } from '@/lib/ui';

export default function TeacherCoursePage() {
    const { courseId } = useParams<{ courseId: string }>();
    const router = useRouter();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [notice, setNotice] = useState('');

    const loadCourse = useCallback(() => {
        apiFetch<CourseDetail>(`/api/courses/${courseId}`)
            .then(data => {
                if (!data.can_edit) setError('คุณไม่ใช่ผู้สอนของวิชานี้');
                else setCourse(data);
            })
            .catch(err => setError(err.message));
    }, [courseId]);

    useEffect(loadCourse, [loadCourse]);

    const back = { href: '/teacher', label: 'วิชาที่ฉันสอน' };
    if (error) return <PageShell title="เกิดข้อผิดพลาด" back={back}><p className="text-red-600">{error}</p></PageShell>;
    if (!course) return <Spinner />;

    const updateCourse = async (values: { title: string; description: string }) => {
        await apiFetch(`/api/courses/${course.id}`, { method: 'PUT', body: JSON.stringify(values) });
        setEditing(false);
        loadCourse();
    };

    const deleteCourse = async () => {
        const ok = window.confirm(`ลบวิชา "${course.title}"?\nบทเรียนและข้อสอบทั้งหมดในวิชานี้จะถูกลบด้วย และกู้คืนไม่ได้`);
        if (!ok) return;
        try {
            await apiFetch(`/api/courses/${course.id}`, { method: 'DELETE' });
            router.push('/teacher');
        } catch (err) {
            alert(err instanceof ApiError ? err.message : 'ลบวิชาไม่สำเร็จ');
        }
    };

    return (
        <PageShell
            title={course.title}
            back={back}
            actions={!editing && (<>
                <Link href={`/teacher/courses/${course.id}/report`} className={primaryButton}>รายงานผลการเรียน</Link>
                <button onClick={() => setEditing(true)} className={secondaryButton}>แก้ไขข้อมูลวิชา</button>
                <button onClick={deleteCourse} className={dangerButton}>ลบวิชา</button>
            </>)}
        >
            {editing ? (
                <div className={`${cardClass} mb-8`}>
                    <CourseForm initial={course} submitLabel="บันทึก" onSubmit={updateCourse} onCancel={() => setEditing(false)} />
                </div>
            ) : (
                course.description && <p className="text-gray-500 mb-8 whitespace-pre-line">{course.description}</p>
            )}

            <div className="grid lg:grid-cols-5 gap-8">
                <section className="lg:col-span-3">
                    <h3 className="font-bold text-xl mb-4">บทเรียน ({course.modules.length})</h3>
                    {course.modules.length === 0 ? (
                        <p className="text-gray-400 bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                            ยังไม่มีบทเรียน เพิ่มบทเรียนแรกจากฟอร์มด้านข้าง
                        </p>
                    ) : (
                        <ol className="space-y-3">
                            {course.modules.map((m, i) => (
                                <li key={m.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
                                    <span className="text-xl font-black text-indigo-200 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                                    <span className="font-bold text-gray-900 flex-1 min-w-0 break-words">{m.title}</span>
                                    <Link href={`/teacher/modules/${m.id}/quizzes`} title="จัดการข้อสอบ" aria-label={`ข้อสอบของ ${m.title}`}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold shrink-0 ${m.quiz_count > 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'} hover:ring-2 hover:ring-indigo-200`}>
                                        <ListChecks size={14} /> {m.quiz_count > 0 ? `${m.quiz_count} ข้อ` : 'ยังไม่มีข้อสอบ'}
                                    </Link>
                                    <Link href={`/student/modules/${m.id}`} title="ดูแบบนักเรียน" aria-label={`ดู ${m.title} แบบนักเรียน`}
                                        className="p-2 text-gray-400 hover:text-indigo-600 shrink-0"><Eye size={18} /></Link>
                                    <Link href={`/teacher/modules/${m.id}`} title="แก้ไข" aria-label={`แก้ไข ${m.title}`}
                                        className="p-2 text-gray-400 hover:text-indigo-600 shrink-0"><Pencil size={18} /></Link>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <section className="lg:col-span-2">
                    <div className={cardClass}>
                        <h3 className="font-bold text-xl mb-4">เพิ่มบทเรียน</h3>
                        {notice && <p role="status" className={`${successBox} mb-4`}>{notice}</p>}
                        <AddModuleForm courseId={course.id} onCreated={() => { setNotice('เพิ่มบทเรียนสำเร็จ!'); loadCourse(); }} />
                    </div>
                </section>
            </div>
        </PageShell>
    );
}
