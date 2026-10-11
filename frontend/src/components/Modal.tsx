"use client";
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// หน้าต่าง popup (กด Esc หรือพื้นหลังเพื่อปิด)
export default function Modal({ open, title, onClose, children }: {
    open: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-lift animate-pop">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-ink">{title}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="ปิด"><X size={20} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}
