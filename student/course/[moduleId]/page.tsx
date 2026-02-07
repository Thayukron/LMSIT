"use client";
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, Sparkles } from 'lucide-react';

export default function CourseContentPage({ params }: { params: Promise<{ moduleId: string }> }) {
    const { moduleId } = React.use(params);
    const [view, setView] = useState<'selection' | 'study'>('selection');
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // ข้อมูล Vibe เรียงตามรูป image_4c68f7.png
    const learningVibes = [
        { id: 'peer_to_peer', title: 'PEER TALK', sub: 'คุยภาษาเพื่อน กันเองสุดๆ', emoji: '🤝' },
        { id: 'summary', title: 'THE ESSENCE', sub: 'เนื้อเน้นๆ ประหยัดเวลา', emoji: '🎯' },
        { id: 'example_based', title: 'REAL CASE', sub: 'เรียนจากเหตุการณ์จริง', emoji: '💡' },
        { id: 'gamified', title: 'QUEST MODE', sub: 'สนุกเหมือนทำภารกิจ', emoji: '🎮' },
    ];

    const loadAIContent = async (style: string) => {
        setLoading(true); 
        setView('study');
        try {
            const res = await fetch(`http://localhost:5000/api/courses/modules/${moduleId}/content?style=${style}`);
            const data = await res.json();
            const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
            setContent(parsed);
        } catch (e) { 
            console.error(e);
            setContent({ headline: "Error", intro: "AI Failed to parse content", sections: [], key_points: [] });
        }
        setLoading(false);
    };

    // --- ส่วนที่ 1: หน้าเลือก Vibe (จัดแนวนอน 4 ช่องสวยๆ) ---
    if (view === 'selection') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
                {/* Header Section - ปรับขนาด Pixel ลงให้พอดีหน้าจอ */}
                <div className="text-center mb-12">
                    <span className="text-blue-600 font-black tracking-[0.3em] text-[12px] uppercase mb-2 block">
                        AI ADAPTIVE MODE
                    </span>
                    <h1 className="text-[52px] md:text-[64px] font-black italic uppercase leading-none tracking-tighter text-black">
                        CHOOSE YOUR<br/>LEARNING VIBE
                    </h1>
                </div>

                {/* แนวนอนเรียงกัน 4 ช่อง (Grid 4 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
                    {learningVibes.map((vibe) => (
                        <button 
                            key={vibe.id} 
                            onClick={() => loadAIContent(vibe.id)} 
                            className="bg-white aspect-[3/4.2] rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center justify-center p-6 border border-gray-100 group"
                        >
                            <div className="text-[60px] mb-8 transform group-hover:scale-110 transition-transform duration-500">
                                {vibe.emoji}
                            </div>
                            <h3 className="text-[22px] font-black uppercase tracking-tighter text-gray-900 mb-1 leading-none text-center">
                                {vibe.title}
                            </h3>
                            <p className="text-gray-400 font-bold text-[12px] tracking-tight text-center">
                                {vibe.sub}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- ส่วนที่ 2: หน้าเรียน (ธีมม่วง Indigo) ---
    return (
        <div className="min-h-screen bg-white">
            <nav className="bg-[#6366f1] p-4 text-white shadow-lg sticky top-0 z-50 flex justify-between items-center px-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('selection')} className="hover:bg-[#4f46e5] p-2 rounded-full transition-colors flex items-center gap-1 font-bold text-sm">
                        <ChevronLeft size={20} /> กลับ
                    </button>
                    <h1 className="text-lg font-bold">🎓 AI Smart Learning</h1>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                    <span className="bg-[#4f46e5] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-2">
                        <Sparkles size={12} /> AI Optimized
                    </span>
                </div>
            </nav>

            {loading ? (
                <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="text-xl font-black italic text-indigo-600 uppercase tracking-widest animate-pulse">
                        Generating...
                    </div>
                </div>
            ) : (
                <main className="max-w-4xl mx-auto px-6 py-16">
                    <header className="mb-20">
                        <h1 className="text-5xl md:text-6xl font-black leading-none tracking-tighter uppercase mb-8 text-gray-900">
                            {content?.headline}
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed font-bold italic border-l-[8px] border-[#6366f1] pl-6">
                            {content?.intro}
                        </p>
                    </header>

                    <div className="space-y-24">
                        {content?.sections?.map((sec: any, i: number) => (
                            <section key={i} className="group border-b border-gray-50 pb-20 last:border-0">
                                <div className="text-[10px] font-black text-[#6366f1] mb-4 tracking-[0.3em] uppercase opacity-60">
                                    PART 0{i+1}
                                </div>
                                <h2 className="text-3xl font-black mb-6 text-gray-900 uppercase tracking-tighter">
                                    {sec.title}
                                </h2>
                                <div className="prose prose-lg prose-slate leading-relaxed text-gray-600">
                                    <ReactMarkdown>{sec.content}</ReactMarkdown>
                                </div>
                            </section>
                        ))}
                    </div>

                    <footer className="mt-32 bg-gray-900 rounded-[50px] p-12 text-white shadow-2xl">
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-10">
                            Core Summary
                        </h3>
                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            {content?.key_points?.map((p: string, i: number) => (
                                <div key={i} className="flex gap-4 border-t border-white/10 pt-6">
                                    <span className="text-[#6366f1] font-black text-xl italic">0{i+1}</span>
                                    <p className="text-md font-bold uppercase tracking-tight opacity-70 leading-snug">{p}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-6 bg-[#6366f1] text-white rounded-[24px] text-xl font-black uppercase italic tracking-tighter hover:bg-white hover:text-[#6366f1] transition-all shadow-xl">
                            Start Assessment →
                        </button>
                    </footer>
                </main>
            )}
        </div>
    );
}