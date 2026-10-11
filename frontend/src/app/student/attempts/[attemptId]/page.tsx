"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { AttemptResult } from '@/lib/types';
import { Alert, Button, PageLoader } from '@/components/ui';
import AttemptReview from '@/components/AttemptReview';

// ผลสอบย้อนหลังรายครั้ง (นักเรียนเจ้าของผลสอบ หรือครูเจ้าของวิชา)
export default function AttemptPage() {
    const { attemptId } = useParams<{ attemptId: string }>();
    const [result, setResult] = useState<AttemptResult | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch<AttemptResult>(`/api/attempts/${attemptId}`).then(setResult).catch(err => setError(err.message));
    }, [attemptId]);

    if (error) return <Alert>{error}</Alert>;
    if (!result) return <PageLoader />;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link href={`/student/modules/${result.module_id}/quiz`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink">
                <ArrowLeft size={16} /> แบบทดสอบ: {result.module_title}
            </Link>
            {result.student_name && (
                <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-fuchsia-500 text-white font-[Tahoma,'Leelawadee_UI',Thonburi,sans-serif] font-bold flex items-center justify-center">{result.student_name.charAt(0)}</span>
                    <div><div className="text-xs text-slate-400">ผลสอบของ</div><div className="font-bold text-ink">{result.student_name}</div></div>
                </div>
            )}
            <AttemptReview result={result} />
            <div className="flex justify-center">
                <Button href={`/student/modules/${result.module_id}/quiz`}><RotateCcw size={18} /> ทำแบบทดสอบอีกครั้ง</Button>
            </div>
        </div>
    );
}
