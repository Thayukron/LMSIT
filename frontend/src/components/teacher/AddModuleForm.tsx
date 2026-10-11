"use client";
import React, { useState } from 'react';
import { FileUp, Link2, Type } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { inputClass, labelClass, primaryButton, errorBox } from '@/lib/ui';

type Source = 'file' | 'url' | 'text';

const MAX_FILE_SIZE_MB = 10; // ต้องตรงกับ Backend

const SOURCES: { id: Source; label: string; icon: React.ReactNode }[] = [
    { id: 'file', label: 'อัปโหลดไฟล์', icon: <FileUp size={16} /> },
    { id: 'url', label: 'จากเว็บไซต์', icon: <Link2 size={16} /> },
    { id: 'text', label: 'พิมพ์/วางเนื้อหา', icon: <Type size={16} /> },
];

// ฟอร์มเพิ่มบทเรียนใหม่ในวิชา: เนื้อหามาจากไฟล์ (PDF/DOCX/TXT), URL หรือพิมพ์เอง
export default function AddModuleForm({ courseId, onCreated }: { courseId: number; onCreated: () => void }) {
    const [source, setSource] = useState<Source>('file');
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [formKey, setFormKey] = useState(0); // เปลี่ยนค่าเพื่อล้างช่องเลือกไฟล์หลังบันทึก

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const body = new FormData();
        body.append('title', title);
        if (source === 'file') {
            if (!file) return setError('กรุณาเลือกไฟล์');
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return setError(`ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE_MB}MB)`);
            body.append('file', file);
        } else if (source === 'url') {
            body.append('url', url);
        } else {
            body.append('text', text);
        }

        setSaving(true);
        try {
            await apiFetch(`/api/courses/${courseId}/modules`, { method: 'POST', body });
            setTitle(''); setFile(null); setUrl(''); setText('');
            setFormKey(k => k + 1);
            onCreated();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'เพิ่มบทเรียนไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="module-title" className={labelClass}>ชื่อบทเรียน</label>
                <input id="module-title" className={inputClass} value={title} onChange={e => setTitle(e.target.value)} required maxLength={255} />
            </div>

            <div role="tablist" aria-label="แหล่งเนื้อหา" className="flex flex-wrap gap-2">
                {SOURCES.map(s => (
                    <button key={s.id} type="button" role="tab" aria-selected={source === s.id} onClick={() => setSource(s.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${source === s.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                        {s.icon} {s.label}
                    </button>
                ))}
            </div>

            {source === 'file' && (
                <div>
                    <input type="file" accept=".pdf,.docx,.txt" aria-label="เลือกไฟล์เนื้อหา"
                        onChange={e => setFile(e.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-bold hover:file:bg-indigo-100" />
                    <p className="text-xs text-gray-400 mt-2">รองรับ PDF, Word (.docx) และ .txt ขนาดไม่เกิน {MAX_FILE_SIZE_MB}MB (PDF ที่เป็นภาพสแกนยังไม่รองรับ)</p>
                </div>
            )}
            {source === 'url' && (
                <input type="url" className={inputClass} placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} required aria-label="URL ของเนื้อหา" />
            )}
            {source === 'text' && (
                <textarea className={inputClass} rows={8} placeholder="วางเนื้อหาบทเรียนที่นี่" value={text} onChange={e => setText(e.target.value)} required aria-label="เนื้อหาบทเรียน" />
            )}

            {error && <p role="alert" className={errorBox}>{error}</p>}
            <button type="submit" disabled={saving} className={primaryButton}>
                {saving ? 'กำลังอ่านเนื้อหา...' : 'เพิ่มบทเรียน'}
            </button>
        </form>
    );
}
