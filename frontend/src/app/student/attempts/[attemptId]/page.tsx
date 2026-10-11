"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { AttemptResult } from '@/lib/types';
import PageShell from '@/components/PageShell';
import Spinner from '@/components/Spinner';
import AttemptReview from '@/components/AttemptReview';
import { primaryButton } from '@/lib/ui';

// ดูผลสอบย้อนหลังรายครั้ง (นักเรียนเจ้าของผลสอบ หรือครูเจ้าของวิชา)
export default function AttemptPage() {
    const { attemptId } = useParams<{ attemptId: string }>();
    const [result, setResult] = useState<AttemptResult | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch<AttemptResult>(`/api/attempts/${attemptId}`).then(setResult).catch(err => setError(err.message));
    }, [attemptId]);

    if (error) return <PageShell title="เกิดข้อผิดพลาด" back={{ href: '/student/dashboard', label: 'ห้องเรียนของฉัน' }}><p className="text-red-600">{error}</p></PageShell>;
    if (!result) return <Spinner />;

    return (
        <PageShell
            title={`ผลสอบ: ${result.module_title}`}
            back={{ href: `/student/modules/${result.module_id}/quiz`, label: 'กลับไปหน้าแบบทดสอบ' }}
        >
            {result.student_name && <p className="text-gray-500 mb-6">ผู้สอบ: {result.student_name}</p>}
            <AttemptReview result={result} />
            <Link href={`/student/modules/${result.module_id}/quiz`} className={`${primaryButton} inline-block mt-8`}>ทำข้อสอบอีกครั้ง</Link>
        </PageShell>
    );
}
