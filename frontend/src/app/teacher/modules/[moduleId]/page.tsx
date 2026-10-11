"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, ListChecks, Save, Trash2, Wand2, Lightbulb } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { ModuleDetail } from '@/lib/types';
import { Alert, Button, Card, Field, PageLoader, inputClass, cx } from '@/components/ui';
import { LEARNING_STYLES } from '@/lib/visual';

const MAX_CONTENT_LENGTH = 200000; // ต้องตรงกับ Backend

export default function TeacherModulePage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const router = useRouter();
    const [moduleInfo, setModuleInfo] = useState<ModuleDetail | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loadError, setLoadError] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiFetch<ModuleDetail>(`/api/modules/${moduleId}`)
            .then(data => {
                if (!data.can_edit) return setLoadError('คุณไม่ใช่ผู้สอนของบทเรียนนี้');
                setModuleInfo(data);
                setTitle(data.title);
                setContent(data.original_content ?? '');
            })
            .catch(err => setLoadError(err.message));
    }, [moduleId]);

    if (loadError) return <Alert>{loadError}</Alert>;
    if (!moduleInfo) return <PageLoader />;

    const contentChanged = content.trim() !== (moduleInfo.original_content ?? '').trim();
    const titleChanged = title.trim() !== moduleInfo.title;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setNotice('');
        setSaving(true);
        try {
            const { message } = await apiFetch<{ message: string }>(`/api/modules/${moduleInfo.id}`, {
                method: 'PUT', body: JSON.stringify({ title, original_content: content }),
            });
            setModuleInfo({ ...moduleInfo, title: title.trim(), original_content: content.trim() });
            setNotice(message);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!window.confirm(`ลบบทเรียน "${moduleInfo.title}"?\nข้อสอบและผลสอบของบทเรียนนี้จะถูกลบด้วย และกู้คืนไม่ได้`)) return;
        try {
            await apiFetch(`/api/modules/${moduleInfo.id}`, { method: 'DELETE' });
            router.push(`/teacher/courses/${moduleInfo.course_id}`);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'ลบบทเรียนไม่สำเร็จ');
        }
    };

    return (
        <div className="space-y-6">
            <Link href={`/teacher/courses/${moduleInfo.course_id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink">
                <ArrowLeft size={16} /> {moduleInfo.course_title}
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-brand-600">แก้ไขบทเรียน</div>
                    <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-ink break-words">{moduleInfo.title}</h1>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button href={`/teacher/modules/${moduleInfo.id}/quizzes`}><ListChecks size={18} /> จัดการข้อสอบ</Button>
                    <Button href={`/student/modules/${moduleInfo.id}`} variant="secondary"><Eye size={18} /> ดูแบบนักเรียน</Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                <form onSubmit={save} className="lg:col-span-2">
                    <Card className="p-6 sm:p-8 space-y-5">
                        <Field label="ชื่อบทเรียน" htmlFor="title">
                            <input id="title" className={inputClass} value={title} onChange={e => setTitle(e.target.value)} required maxLength={255} />
                        </Field>
                        <Field label="เนื้อหาต้นฉบับ" htmlFor="content"
                            aside={<span className={cx('text-xs', content.length > MAX_CONTENT_LENGTH ? 'text-red-600 font-semibold' : 'text-slate-400')}>
                                {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} ตัวอักษร
                            </span>}
                            hint="AI จะใช้เนื้อหานี้สร้างบทเรียนทั้ง 4 สไตล์และออกข้อสอบ — ยิ่งเนื้อหาครบและถูกต้อง บทเรียนยิ่งดี">
                            <textarea id="content" className={`${inputClass} font-mono text-sm leading-7 min-h-[28rem]`} value={content} onChange={e => setContent(e.target.value)} required />
                        </Field>
                        {contentChanged && <Alert tone="warning">เมื่อบันทึก บทเรียนที่ AI สร้างไว้ทุกสไตล์จะถูกล้าง แล้วสร้างใหม่จากเนื้อหาล่าสุดเมื่อนักเรียนเปิดเรียนครั้งถัดไป</Alert>}
                        {error && <Alert>{error}</Alert>}
                        {notice && <Alert tone="success">{notice}</Alert>}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <Button variant="danger" onClick={remove}><Trash2 size={16} /> ลบบทเรียน</Button>
                            <Button type="submit" disabled={saving || (!contentChanged && !titleChanged) || content.length > MAX_CONTENT_LENGTH}>
                                <Save size={18} /> {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                            </Button>
                        </div>
                    </Card>
                </form>

                <aside className="space-y-4 lg:sticky lg:top-24">
                    <Card className="p-6">
                        <h2 className="flex items-center gap-2 font-bold text-ink"><Wand2 size={18} className="text-brand-600" /> AI จะสร้างบทเรียน 4 สไตล์</h2>
                        <ul className="mt-4 space-y-2.5">
                            {LEARNING_STYLES.map(s => (
                                <li key={s.id} className="flex items-center gap-3">
                                    <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-lg shrink-0`} aria-hidden="true">{s.emoji}</span>
                                    <span className="text-sm"><span className="font-semibold text-ink">{s.name}</span><span className="block text-xs text-slate-500">{s.tags.join(' · ')}</span></span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">ความยาวต้นฉบับ ~{words.toLocaleString()} คำ</div>
                    </Card>
                    <Card className="p-6 bg-amber-50/60 ring-amber-100">
                        <h2 className="flex items-center gap-2 font-bold text-amber-800"><Lightbulb size={18} /> เคล็ดลับ</h2>
                        <ul className="mt-3 space-y-2 text-sm text-amber-900/80 list-disc pl-5">
                            <li>ลบส่วนที่ไม่เกี่ยวข้อง เช่น หัวกระดาษ เลขหน้า เมนูเว็บ</li>
                            <li>บทเรียนละ 1 หัวข้อหลัก จะได้บทเรียนที่กระชับกว่า</li>
                            <li>ใส่ตัวอย่างหรือตัวเลขจริง AI จะยกตัวอย่างได้แม่นขึ้น</li>
                        </ul>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
