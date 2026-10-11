"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import type { ModuleDetail } from '@/lib/types';
import PageShell from '@/components/PageShell';
import Spinner from '@/components/Spinner';
import { cardClass, inputClass, labelClass, primaryButton, secondaryButton, dangerButton, errorBox, successBox } from '@/lib/ui';

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

    if (loadError) {
        return <PageShell title="เกิดข้อผิดพลาด" back={{ href: '/teacher', label: 'วิชาที่ฉันสอน' }}><p className="text-red-600">{loadError}</p></PageShell>;
    }
    if (!moduleInfo) return <Spinner />;

    const contentChanged = content.trim() !== (moduleInfo.original_content ?? '').trim();

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setNotice('');
        setSaving(true);
        try {
            const { message } = await apiFetch<{ message: string }>(`/api/modules/${moduleInfo.id}`, {
                method: 'PUT',
                body: JSON.stringify({ title, original_content: content }),
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
        if (!window.confirm(`ลบบทเรียน "${moduleInfo.title}"?\nข้อสอบของบทเรียนนี้จะถูกลบด้วย และกู้คืนไม่ได้`)) return;
        try {
            await apiFetch(`/api/modules/${moduleInfo.id}`, { method: 'DELETE' });
            router.push(`/teacher/courses/${moduleInfo.course_id}`);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'ลบบทเรียนไม่สำเร็จ');
        }
    };

    return (
        <PageShell
            title={moduleInfo.title}
            back={{ href: `/teacher/courses/${moduleInfo.course_id}`, label: moduleInfo.course_title }}
            actions={<>
                <Link href={`/teacher/modules/${moduleInfo.id}/quizzes`} className={primaryButton}>จัดการข้อสอบ</Link>
                <Link href={`/student/modules/${moduleInfo.id}`} className={secondaryButton}>ดูแบบนักเรียน</Link>
                <button onClick={remove} className={dangerButton}>ลบบทเรียน</button>
            </>}
        >
            <form onSubmit={save} className={`${cardClass} space-y-4`}>
                <div>
                    <label htmlFor="title" className={labelClass}>ชื่อบทเรียน</label>
                    <input id="title" className={inputClass} value={title} onChange={e => setTitle(e.target.value)} required maxLength={255} />
                </div>
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label htmlFor="content" className={labelClass}>เนื้อหาต้นฉบับ (AI จะใช้เนื้อหานี้สร้างบทเรียนแต่ละสไตล์)</label>
                        <span className={`text-xs ${content.length > MAX_CONTENT_LENGTH ? 'text-red-600' : 'text-gray-400'}`}>
                            {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
                        </span>
                    </div>
                    <textarea id="content" className={`${inputClass} font-mono text-sm`} rows={20} value={content} onChange={e => setContent(e.target.value)} required />
                    {contentChanged && (
                        <p className="text-xs text-amber-600 mt-1">เมื่อบันทึก เนื้อหาที่ AI สร้างไว้ทุกสไตล์จะถูกล้าง และสร้างใหม่ครั้งถัดไปที่นักเรียนเปิดเรียน</p>
                    )}
                </div>
                {error && <p role="alert" className={errorBox}>{error}</p>}
                {notice && <p role="status" className={successBox}>{notice}</p>}
                <button type="submit" disabled={saving || content.length > MAX_CONTENT_LENGTH} className={primaryButton}>
                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
            </form>

        </PageShell>
    );
}
