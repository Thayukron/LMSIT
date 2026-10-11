"use client";
import React, { useRef, useState } from 'react';
import { FileUp, Link2, Type, CloudUpload, FileText, X } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { Alert, Button, Field, inputClass, cx } from '@/components/ui';

type Source = 'file' | 'url' | 'text';

const MAX_FILE_SIZE_MB = 10; // ต้องตรงกับ Backend
const ACCEPTED = ['.pdf', '.docx', '.txt'];

const SOURCES: { id: Source; label: string; icon: React.ReactNode }[] = [
    { id: 'file', label: 'ไฟล์', icon: <FileUp size={16} /> },
    { id: 'url', label: 'ลิงก์เว็บ', icon: <Link2 size={16} /> },
    { id: 'text', label: 'พิมพ์เอง', icon: <Type size={16} /> },
];

// ฟอร์มเพิ่มบทเรียน: เนื้อหามาจากไฟล์ (ลากวางได้), URL หรือพิมพ์เอง
export default function AddModuleForm({ courseId, onCreated }: { courseId: number; onCreated: () => void }) {
    const [source, setSource] = useState<Source>('file');
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [text, setText] = useState('');
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    const pickFile = (f: File | undefined) => {
        if (!f) return;
        const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
        if (!ACCEPTED.includes(ext)) return setError('รองรับเฉพาะไฟล์ .pdf, .docx และ .txt');
        if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return setError(`ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE_MB}MB)`);
        setError('');
        setFile(f);
        if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const body = new FormData();
        body.append('title', title);
        if (source === 'file') {
            if (!file) return setError('กรุณาเลือกไฟล์');
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
            if (fileInput.current) fileInput.current.value = '';
            onCreated();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'เพิ่มบทเรียนไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div role="tablist" aria-label="แหล่งเนื้อหา" className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
                {SOURCES.map(s => (
                    <button key={s.id} type="button" role="tab" aria-selected={source === s.id} onClick={() => setSource(s.id)}
                        className={cx('flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition',
                            source === s.id ? 'bg-white text-brand-700 shadow-soft' : 'text-slate-500 hover:text-slate-700')}>
                        {s.icon} {s.label}
                    </button>
                ))}
            </div>

            {source === 'file' && (
                file ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-brand-50 ring-1 ring-brand-100 p-4">
                        <span className="w-10 h-10 rounded-xl bg-white text-brand-600 flex items-center justify-center shrink-0"><FileText size={20} /></span>
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-ink truncate">{file.name}</div>
                            <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</div>
                        </div>
                        <button type="button" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; }}
                            className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-slate-600" aria-label="ลบไฟล์ที่เลือก"><X size={18} /></button>
                    </div>
                ) : (
                    <label onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                        onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
                        className={cx('flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition',
                            dragging ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50')}>
                        <span className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center"><CloudUpload size={24} /></span>
                        <span className="font-semibold text-ink">ลากไฟล์มาวาง หรือ <span className="text-brand-600">เลือกไฟล์</span></span>
                        <span className="text-xs text-slate-500">PDF, Word (.docx), .txt ไม่เกิน {MAX_FILE_SIZE_MB}MB</span>
                        <input ref={fileInput} type="file" accept={ACCEPTED.join(',')} className="sr-only" onChange={e => pickFile(e.target.files?.[0])} />
                    </label>
                )
            )}
            {source === 'url' && (
                <Field label="ลิงก์ของเนื้อหา" htmlFor="module-url" hint="ระบบจะดึงข้อความจากหน้าเว็บมาเป็นเนื้อหาต้นฉบับ">
                    <input id="module-url" type="url" className={inputClass} placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} required />
                </Field>
            )}
            {source === 'text' && (
                <Field label="เนื้อหาบทเรียน" htmlFor="module-text">
                    <textarea id="module-text" className={inputClass} rows={7} placeholder="วางหรือพิมพ์เนื้อหาบทเรียนที่นี่" value={text} onChange={e => setText(e.target.value)} required />
                </Field>
            )}

            <Field label="ชื่อบทเรียน" htmlFor="module-title">
                <input id="module-title" className={inputClass} value={title} onChange={e => setTitle(e.target.value)} required maxLength={255} placeholder="เช่น บทที่ 1 รู้จักคอมพิวเตอร์" />
            </Field>

            {error && <Alert>{error}</Alert>}
            <Button type="submit" disabled={saving} className="w-full">{saving ? 'กำลังอ่านเนื้อหา...' : 'เพิ่มบทเรียน'}</Button>
        </form>
    );
}
