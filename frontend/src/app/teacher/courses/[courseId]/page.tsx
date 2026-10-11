"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Eye, ListChecks, Pencil, Trash2, Settings2, Plus, Layers, KeyRound } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { CourseDetail } from '@/lib/types';
import { Alert, Badge, Button, Card, EmptyState, PageLoader } from '@/components/ui';
import Modal from '@/components/Modal';
import AiKeySettings, { AiStatusBadge } from '@/components/teacher/AiKeySettings';
import CourseForm from '@/components/teacher/CourseForm';
import AddModuleForm from '@/components/teacher/AddModuleForm';
import { courseCover } from '@/lib/visual';

export default function TeacherCoursePage() {
    const { courseId } = useParams<{ courseId: string }>();
    const router = useRouter();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [notice, setNotice] = useState('');
    const closeEdit = useCallback(() => setEditing(false), []);
    const [aiOpen, setAiOpen] = useState(false);
    const closeAi = useCallback(() => setAiOpen(false), []);

    const loadCourse = useCallback(() => {
        apiFetch<CourseDetail>(`/api/courses/${courseId}`)
            .then(data => (data.can_edit ? setCourse(data) : setError('คุณไม่ใช่ผู้สอนของวิชานี้')))
            .catch(err => setError(err.message));
    }, [courseId]);

    useEffect(loadCourse, [loadCourse]);

    if (error) return <Alert>{error}</Alert>;
    if (!course) return <PageLoader />;

    const cover = courseCover(course.id);
    const quizTotal = course.modules.reduce((t, m) => t + m.quiz_count, 0);

    const updateCourse = async (values: { title: string; description: string }) => {
        await apiFetch(`/api/courses/${course.id}`, { method: 'PUT', body: JSON.stringify(values) });
        setEditing(false);
        loadCourse();
    };

    const deleteCourse = async () => {
        if (!window.confirm(`ลบวิชา "${course.title}"?\nบทเรียน ข้อสอบ และผลสอบทั้งหมดในวิชานี้จะถูกลบ และกู้คืนไม่ได้`)) return;
        try {
            await apiFetch(`/api/courses/${course.id}`, { method: 'DELETE' });
            router.push('/teacher');
        } catch (err) {
            alert(err instanceof ApiError ? err.message : 'ลบวิชาไม่สำเร็จ');
        }
    };

    return (
        <div className="space-y-8">
            <section className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${cover.gradient} text-white p-6 sm:p-10 animate-fade-up`}>
                <div className="absolute inset-0 bg-dots opacity-25" aria-hidden="true" />
                <span className="absolute -right-4 -bottom-8 text-[9rem] opacity-25 select-none" aria-hidden="true">{cover.emoji}</span>
                <div className="relative">
                    <Link href="/teacher" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white"><ArrowLeft size={16} /> วิชาที่สอน</Link>
                    <h1 className="mt-4 text-3xl sm:text-4xl font-bold break-words">{course.title}</h1>
                    {course.description && <p className="mt-2 text-white/85 max-w-2xl whitespace-pre-line">{course.description}</p>}
                    <div className="mt-5 flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">📚 {course.modules.length} บทเรียน</span>
                        <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">📝 {quizTotal} ข้อสอบ</span>
                        <button onClick={() => setAiOpen(true)} className="rounded-full bg-white px-1 py-0.5 hover:scale-105 transition" aria-label="ตั้งค่า AI ของวิชา">
                            <AiStatusBadge ready={!!course.ai?.has_key} hint={course.ai?.hint} />
                        </button>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <Button href={`/teacher/courses/${course.id}/report`} variant="white"><BarChart3 size={18} /> รายงานผลการเรียน</Button>
                        <Button href={`/student/courses/${course.id}`} variant="ghost" className="text-white hover:bg-white/15 hover:text-white"><Eye size={18} /> ดูแบบนักเรียน</Button>
                        <Button onClick={() => setAiOpen(true)} variant="ghost" className="text-white hover:bg-white/15 hover:text-white"><KeyRound size={18} /> ตั้งค่า AI</Button>
                        <Button onClick={() => setEditing(true)} variant="ghost" className="text-white hover:bg-white/15 hover:text-white"><Settings2 size={18} /> แก้ไขข้อมูลวิชา</Button>
                        <Button onClick={deleteCourse} variant="ghost" className="text-white/80 hover:bg-red-500/80 hover:text-white"><Trash2 size={18} /> ลบวิชา</Button>
                    </div>
                </div>
            </section>

            {!course.ai?.ai_ready && (
                <Alert tone="warning">
                    วิชานี้ยังไม่ได้ตั้งค่า API key ของ AI — นักเรียนจะเลือกสไตล์การเรียนใหม่ไม่ได้ และคุณจะใช้ AI ออกข้อสอบไม่ได้
                    <button onClick={() => setAiOpen(true)} className="ml-2 font-semibold underline">ตั้งค่าตอนนี้</button>
                </Alert>
            )}

            <div className="grid lg:grid-cols-5 gap-8 items-start">
                <section className="lg:col-span-3">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-ink mb-4"><Layers size={22} className="text-brand-600" /> บทเรียน</h2>
                    {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}
                    {course.modules.length === 0 ? (
                        <EmptyState icon={<Plus size={28} />} title="ยังไม่มีบทเรียน" description="เพิ่มบทเรียนแรกจากไฟล์ ลิงก์ หรือพิมพ์เนื้อหาเองได้ที่แผงด้านข้าง" />
                    ) : (
                        <ol className="space-y-3">
                            {course.modules.map((m, i) => (
                                <li key={m.id}>
                                    <Card className="p-4 sm:p-5 flex flex-wrap items-center gap-4 hover:ring-brand-200 transition">
                                        <span className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-700 font-bold font-display flex items-center justify-center shrink-0">{i + 1}</span>
                                        <div className="flex-1 min-w-48">
                                            <Link href={`/teacher/modules/${m.id}`} className="font-bold text-ink hover:text-brand-700 break-words">{m.title}</Link>
                                            <div className="mt-1">
                                                <Link href={`/teacher/modules/${m.id}/quizzes`}>
                                                    {m.quiz_count > 0
                                                        ? <Badge tone="green"><ListChecks size={12} /> ข้อสอบ {m.quiz_count} ข้อ</Badge>
                                                        : <Badge tone="amber"><ListChecks size={12} /> ยังไม่มีข้อสอบ</Badge>}
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button href={`/teacher/modules/${m.id}/quizzes`} variant="ghost" size="sm" aria-label={`ข้อสอบของ ${m.title}`}><ListChecks size={16} /> <span className="hidden sm:inline">ข้อสอบ</span></Button>
                                            <Button href={`/teacher/modules/${m.id}`} variant="ghost" size="sm" aria-label={`แก้ไข ${m.title}`}><Pencil size={16} /> <span className="hidden sm:inline">แก้ไข</span></Button>
                                            <Button href={`/student/modules/${m.id}`} variant="ghost" size="sm" aria-label={`ดู ${m.title} แบบนักเรียน`}><Eye size={16} /></Button>
                                        </div>
                                    </Card>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <aside className="lg:col-span-2 lg:sticky lg:top-24">
                    <Card className="p-6 sm:p-7">
                        <h2 className="text-xl font-bold text-ink">เพิ่มบทเรียนใหม่</h2>
                        <p className="text-sm text-slate-500 mt-1 mb-5">อัปโหลดครั้งเดียว AI จะสร้างบทเรียนให้นักเรียนครบ 4 สไตล์</p>
                        <AddModuleForm courseId={course.id} onCreated={() => { setNotice('เพิ่มบทเรียนสำเร็จ! อย่าลืมเพิ่มข้อสอบให้บทเรียนนี้'); loadCourse(); }} />
                    </Card>
                </aside>
            </div>

            <Modal open={aiOpen} title="ตั้งค่า AI ของวิชา" onClose={closeAi}>
                <AiKeySettings courseId={course.id} status={course.ai ?? { ai_ready: false }} onSaved={loadCourse} />
            </Modal>

            <Modal open={editing} title="แก้ไขข้อมูลวิชา" onClose={closeEdit}>
                <CourseForm initial={course} submitLabel="บันทึก" onSubmit={updateCourse} onCancel={closeEdit} />
            </Modal>
        </div>
    );
}
