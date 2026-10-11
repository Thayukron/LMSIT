"use client";
import React, { useState } from 'react';
import { ApiError } from '@/lib/api';
import { inputClass, labelClass, primaryButton, secondaryButton, errorBox } from '@/lib/ui';

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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="course-title" className={labelClass}>ชื่อวิชา</label>
                <input id="course-title" className={inputClass} value={title} onChange={e => setTitle(e.target.value)} required maxLength={255} />
            </div>
            <div>
                <label htmlFor="course-desc" className={labelClass}>คำอธิบายวิชา (ไม่บังคับ)</label>
                <textarea id="course-desc" className={inputClass} rows={3} value={description} onChange={e => setDescription(e.target.value)} maxLength={5000} />
            </div>
            {error && <p role="alert" className={errorBox}>{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={saving} className={primaryButton}>{saving ? 'กำลังบันทึก...' : submitLabel}</button>
                {onCancel && <button type="button" onClick={onCancel} className={secondaryButton}>ยกเลิก</button>}
            </div>
        </form>
    );
}
