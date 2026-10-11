"use client";
import React, { useState } from 'react';
import { KeyRound, ExternalLink, ShieldCheck, Trash2, Eye, EyeOff } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { CourseAiStatus } from '@/lib/types';
import { Alert, Badge, Button, Field, inputClass } from '@/components/ui';

// ป้ายสถานะ AI ของวิชา (ใช้ในหัวหน้าวิชาและการ์ดวิชา)
export function AiStatusBadge({ ready, hint }: { ready: boolean; hint?: string | null }) {
    return ready
        ? <Badge tone="green"><ShieldCheck size={12} /> AI พร้อมใช้{hint ? ` · ${hint}` : ''}</Badge>
        : <Badge tone="amber"><KeyRound size={12} /> ยังไม่ได้ตั้งค่า AI</Badge>;
}

// ฟอร์มตั้งค่า API key ของ Gemini สำหรับวิชา (แสดงใน Modal)
export default function AiKeySettings({ courseId, status, onSaved }: { courseId: number; status: CourseAiStatus; onSaved: () => void }) {
    const [apiKey, setApiKey] = useState('');
    const [show, setShow] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setNotice('');
        setBusy(true);
        try {
            const { message } = await apiFetch<{ message: string }>(`/api/courses/${courseId}/ai-key`, { method: 'PUT', body: JSON.stringify({ apiKey }) });
            setApiKey('');
            setNotice(message);
            onSaved();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ');
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!window.confirm('ลบ API key ของวิชานี้?\nเนื้อหาที่ AI สร้างไว้แล้วยังใช้ได้ แต่จะสร้างเนื้อหาหรือข้อสอบใหม่ไม่ได้จนกว่าจะใส่ key ใหม่')) return;
        setBusy(true);
        try {
            await apiFetch(`/api/courses/${courseId}/ai-key`, { method: 'DELETE' });
            setNotice('ลบ API key แล้ว');
            onSaved();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'ลบไม่สำเร็จ');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">สถานะปัจจุบัน</span>
                <AiStatusBadge ready={!!status.has_key} hint={status.hint} />
            </div>

            <div className="rounded-2xl ring-1 ring-slate-200 p-4 text-sm text-slate-600 space-y-2">
                <div className="font-semibold text-ink">วิธีขอ API key (ฟรี)</div>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>เข้า <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 inline-flex items-center gap-1">Google AI Studio <ExternalLink size={12} /></a> แล้วล็อกอินด้วยบัญชี Google</li>
                    <li>กด <b>Create API key</b> แล้วคัดลอก key ที่ได้</li>
                    <li>วาง key ด้านล่าง แล้วกดบันทึก ระบบจะตรวจสอบกับ Google ให้</li>
                </ol>
                <p className="text-xs text-slate-500 pt-1">แบบฟรีใช้ได้ประมาณ 20 ครั้ง/วัน ต่อ model — ระบบสลับหลาย model และเก็บเนื้อหาที่สร้างแล้วไว้ใช้ซ้ำเพื่อประหยัดโควตา</p>
            </div>

            <form onSubmit={save} className="space-y-4">
                <Field label={status.has_key ? 'เปลี่ยนเป็น API key ใหม่' : 'Gemini API key'} htmlFor="ai-key">
                    <div className="relative">
                        <input id="ai-key" type={show ? 'text' : 'password'} className={`${inputClass} pr-12 font-mono`} value={apiKey}
                            onChange={e => setApiKey(e.target.value)} required autoComplete="off" spellCheck={false} placeholder="AIza..." />
                        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
                            aria-label={show ? 'ซ่อน key' : 'แสดง key'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                </Field>
                <p className="flex items-start gap-2 text-xs text-slate-500"><ShieldCheck size={14} className="shrink-0 mt-0.5 text-emerald-600" /> key ถูกเข้ารหัสก่อนเก็บ และจะไม่แสดงให้ใครเห็นอีก (แม้แต่คุณ) ใช้เฉพาะกับวิชานี้</p>
                {error && <Alert>{error}</Alert>}
                {notice && <Alert tone="success">{notice}</Alert>}
                <div className="flex flex-wrap justify-between gap-2">
                    {status.has_key ? <Button variant="danger" onClick={remove} disabled={busy}><Trash2 size={16} /> ลบ key</Button> : <span />}
                    <Button type="submit" disabled={busy || !apiKey.trim()}>{busy ? 'กำลังตรวจสอบกับ Google...' : 'บันทึก API key'}</Button>
                </div>
            </form>
        </div>
    );
}
