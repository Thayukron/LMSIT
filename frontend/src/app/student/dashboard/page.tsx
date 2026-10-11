"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { ModuleSummary } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { BookOpen } from 'lucide-react';

export default function StudentDashboard() {
    const [modules, setModules] = useState<ModuleSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ดึงข้อมูลจาก API หลังบ้าน
        apiFetch<ModuleSummary[]>('/api/courses')
            .then(data => setModules(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error("Fetch Error:", err);
                setModules([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <Navbar />

            <div className="container mx-auto mt-10 p-4 max-w-6xl">
                {/* หัวข้อหน้า พร้อมขีดข้างสีม่วง */}
                <h2 className="text-3xl mb-10 font-bold text-gray-800 border-l-8 border-indigo-600 pl-4">
                    ห้องเรียนของฉัน
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {modules.length > 0 ? modules.map((m) => (
                            <Link href={`/student/course/${m.id}`} key={m.id}>
                                <div className="group bg-white p-8 rounded-[2rem] shadow-sm cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-indigo-100 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="mb-6 w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                            <BookOpen size={32} />
                                        </div>
                                        <h3 className="font-bold text-2xl mb-3 text-gray-900 leading-tight">
                                            {m.title}
                                        </h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            เริ่มเรียนรู้วิชา {m.title} ด้วยระบบ AI อัจฉริยะที่สรุปเนื้อหาให้คุณเข้าใจง่ายขึ้น
                                        </p>
                                    </div>
                                    <div className="mt-8 flex items-center text-indigo-600 text-sm font-black uppercase tracking-widest">
                                        เข้าเรียน &rarr;
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 text-lg italic font-medium">ไม่พบวิชาในระบบ โปรดตรวจสอบฐานข้อมูล</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}