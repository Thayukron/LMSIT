"use client";
import React, { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Alert, Button, Field, inputClass } from '@/components/ui';

interface CourseFormProps {
    initial?: { title: string; description: string | null };
    submitLabel: string;
    onSubmit: (values: { title: string; description: string }) => Promise<void>;
    onCancel?: () => void;
}

// ฟอร์มชื่อ/คำอธิบายวิชา ใช้ทั้งตอนสร้างและแก้ไข
export default function CourseForm({ initial, submitLabel, onSubmit, onCancel }: CourseFormProps) {
    const [title, setTitle] = useState(initial?.title ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await onSubmit({ title, description });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="ชื่อวิชา" htmlFor="course-title">
                <input id="course-title" className={inputClass} value={title} onChange={e => setTitle(e.target.value)} required maxLength={255}
                    placeholder="เช่น พื้นฐานการเขียนโปรแกรม" autoFocus />
            </Field>
            <Field label="คำอธิบายวิชา" htmlFor="course-desc" hint="ไม่บังคับ — นักเรียนจะเห็นข้อความนี้ในหน้าวิชา">
                <textarea id="course-desc" className={inputClass} rows={4} value={description} onChange={e => setDescription(e.target.value)} maxLength={5000}
                    placeholder="วิชานี้จะได้เรียนรู้อะไรบ้าง?" />
            </Field>
            {error && <Alert>{error}</Alert>}
            <div className="flex justify-end gap-2 pt-2">
                {onCancel && <Button variant="ghost" onClick={onCancel}>ยกเลิก</Button>}
                <Button type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : submitLabel}</Button>
            </div>
        </form>
    );
}
