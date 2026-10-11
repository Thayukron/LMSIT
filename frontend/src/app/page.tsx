import { ArrowRight, Wand2, FileUp, BarChart3, ListChecks, ShieldCheck, Sparkles, Brain, Trophy, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui';
import { LEARNING_STYLES } from '@/lib/visual';
import { BRAND } from '@/lib/brand';

// หน้าแรกสำหรับผู้ที่ยังไม่ login (ผู้ที่ login แล้วจะถูก proxy.ts พาไปหน้าหลักของตัวเอง)

function HeroPreview() {
    return (
        <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
            <div className="absolute -inset-10 bg-gradient-to-tr from-brand-400/30 via-fuchsia-400/20 to-orange-300/30 blur-3xl rounded-full" />
            {/* การ์ดบทเรียนจำลอง */}
            <div className="relative rounded-3xl bg-white shadow-lift ring-1 ring-slate-200/70 overflow-hidden animate-fade-up">
                <div className="bg-gradient-to-br from-sky-400 to-cyan-500 p-6 text-white">
                    <div className="text-xs font-semibold opacity-80 mb-2">🤝 เพื่อนติวเพื่อน · 6 นาที</div>
                    <div className="font-display text-2xl font-bold leading-snug">คอมพิวเตอร์คิดยังไง? 🧠</div>
                    <div className="mt-3 h-1.5 rounded-full bg-white/30"><div className="h-full w-2/5 rounded-full bg-white" /></div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-100 p-4">
                        <div className="text-xs font-bold text-amber-700 mb-1">⚙️ ลองเปรียบเทียบดูนะ</div>
                        <div className="text-sm text-slate-600 leading-6">CPU ก็เหมือน <b>เชฟในครัว</b> ส่วน RAM คือ <b>โต๊ะเตรียมอาหาร</b> ยิ่งโต๊ะใหญ่ ยิ่งทำได้หลายเมนูพร้อมกัน</div>
                    </div>
                    <div className="rounded-2xl ring-1 ring-brand-100 bg-brand-50/50 p-4">
                        <div className="text-xs font-bold text-brand-700 mb-2">🤔 เช็กความเข้าใจ</div>
                        <div className="text-sm font-semibold mb-2">ข้อใดคือฮาร์ดแวร์?</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-2">Windows</div>
                            <div className="rounded-xl bg-emerald-50 ring-2 ring-emerald-400 px-3 py-2 font-semibold text-emerald-700 flex items-center gap-1"><CheckCircle2 size={14} /> CPU</div>
                        </div>
                    </div>
                </div>
            </div>
            {/* ป้ายลอย */}
            <div className="absolute -left-3 sm:-left-8 -bottom-8 rounded-2xl bg-white shadow-lift ring-1 ring-slate-200/70 px-4 py-3 flex items-center gap-3 animate-float">
                <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Trophy size={18} /></span>
                <div className="leading-tight"><div className="text-xs text-slate-400">ผลสอบ</div><div className="font-bold text-ink">9/10 · ผ่าน 🎉</div></div>
            </div>
            <div className="absolute -right-3 sm:-right-8 -top-8 rounded-2xl bg-white shadow-lift ring-1 ring-slate-200/70 px-4 py-3 flex items-center gap-3 animate-float [animation-delay:1.5s]">
                <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Sparkles size={18} /></span>
                <div className="leading-tight"><div className="text-xs text-slate-400">AI สร้างบทเรียน</div><div className="font-bold text-ink">4 สไตล์</div></div>
            </div>
        </div>
    );
}

const STEPS = [
    { icon: <FileUp size={22} />, title: 'ครูอัปโหลดเนื้อหาครั้งเดียว', text: 'PDF, Word, ลิงก์เว็บไซต์ หรือพิมพ์เอง ระบบอ่านและเก็บเป็นต้นฉบับให้' },
    { icon: <Wand2 size={22} />, title: 'AI เรียบเรียงเป็น 4 สไตล์', text: 'บทเรียนแบบมีตัวอย่าง เปรียบเทียบ คำถามชวนคิด ไม่ใช่ข้อความยาวน่าเบื่อ' },
    { icon: <Brain size={22} />, title: 'นักเรียนเรียน สอบ และรู้ผลทันที', text: 'เลือกสไตล์ที่ชอบ ทำแบบทดสอบ ดูเฉลยละเอียด และติดตามความก้าวหน้า' },
];

const TEACHER_FEATURES = [
    { icon: <ListChecks size={20} />, title: 'AI ออกข้อสอบให้', text: 'สร้างข้อสอบจากเนื้อหา หรือวางข้อสอบเดิมให้ AI จัดรูปแบบ แล้วตรวจก่อนบันทึก' },
    { icon: <BarChart3 size={20} />, title: 'รายงานผลการเรียน', text: 'ดูคะแนนรายคน รายบท และสถิติรายข้อว่าข้อไหนนักเรียนผิดเยอะ' },
    { icon: <ShieldCheck size={20} />, title: 'ผลสอบเชื่อถือได้', text: 'ตรวจคะแนนฝั่ง server เก็บสำเนาข้อสอบ ณ วันสอบ แก้ข้อสอบภายหลังก็ไม่กระทบผลเดิม' },
];

export default function LandingPage() {
    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[720px] bg-dots [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />

            {/* แถบบน */}
            <header className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 h-20 flex items-center justify-between">
                <Logo />
                <div className="flex items-center gap-2">
                    <Button href="/login" variant="ghost" size="sm">เข้าสู่ระบบ</Button>
                    <Button href="/register" size="sm">เริ่มเรียนฟรี</Button>
                </div>
            </header>

            {/* Hero */}
            <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-16 items-center">
                <div className="animate-fade-up">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 shadow-soft">
                        <Sparkles size={15} /> ขับเคลื่อนด้วย Google Gemini
                    </span>
                    <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.15] text-ink">
                        บทเรียนเดียว<br />
                        <span className="text-gradient">เรียนได้ในแบบ<br className="hidden sm:block" />ที่เป็นคุณ</span>
                    </h1>
                    <p className="mt-6 text-lg text-slate-600 max-w-xl leading-8">
                        ครูอัปโหลดเนื้อหาครั้งเดียว AI เปลี่ยนเป็นบทเรียน 4 สไตล์ ให้นักเรียนเลือกแบบที่เข้าใจง่ายที่สุดสำหรับตัวเอง
                        พร้อมแบบทดสอบและรายงานผลครบในที่เดียว
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button href="/register" size="lg">เริ่มเรียนเลย <ArrowRight size={18} /></Button>
                        <Button href="/login" size="lg" variant="secondary">ฉันเป็นครูผู้สอน</Button>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                        {['ฟรีสำหรับนักเรียน', 'ใช้งานผ่านมือถือได้', 'ภาษาไทยเต็มรูปแบบ'].map(t => (
                            <span key={t} className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> {t}</span>
                        ))}
                    </div>
                </div>
                <HeroPreview />
            </section>

            {/* 4 สไตล์ */}
            <section className="relative bg-white border-y border-slate-200/70 py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="text-sm font-bold text-brand-600 mb-3">LEARNING STYLES</div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-ink">ทุกคนเรียนรู้ไม่เหมือนกัน</h2>
                        <p className="mt-4 text-slate-500 text-lg">เลือกสไตล์ที่ใช่ แล้ว AI จะเรียบเรียงบทเรียนให้เข้ากับคุณ</p>
                    </div>
                    <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {LEARNING_STYLES.map(style => (
                            <div key={style.id} className="group rounded-3xl bg-canvas p-2 ring-1 ring-slate-200/70 hover:-translate-y-1 hover:shadow-lift transition-all duration-300">
                                <div className={`rounded-2xl bg-gradient-to-br ${style.gradient} h-32 flex items-center justify-center text-6xl`}>
                                    <span className="group-hover:scale-110 transition-transform duration-300">{style.emoji}</span>
                                </div>
                                <div className="p-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{style.en}</div>
                                    <h3 className="text-xl font-bold text-ink mt-1">{style.name}</h3>
                                    <p className="text-sm text-slate-500 mt-2 leading-6">{style.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ขั้นตอน */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 py-24">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="text-sm font-bold text-brand-600 mb-3">HOW IT WORKS</div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-ink">จากไฟล์เดียว สู่ห้องเรียนที่มีชีวิต</h2>
                </div>
                <ol className="mt-14 grid md:grid-cols-3 gap-6">
                    {STEPS.map((step, i) => (
                        <li key={step.title} className="relative rounded-3xl bg-white p-8 ring-1 ring-slate-200/70 shadow-soft">
                            <span className="absolute top-6 right-7 font-display text-6xl font-extrabold text-slate-100">{i + 1}</span>
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">{step.icon}</div>
                            <h3 className="relative mt-6 text-xl font-bold text-ink">{step.title}</h3>
                            <p className="relative mt-2 text-slate-500 leading-7">{step.text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* สำหรับครู */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
                <div className="rounded-[2.5rem] bg-ink text-white p-8 sm:p-14 grid lg:grid-cols-5 gap-12 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-600/40 blur-3xl" aria-hidden="true" />
                    <div className="lg:col-span-2 relative">
                        <div className="text-sm font-bold text-brand-300 mb-3">FOR TEACHERS</div>
                        <h2 className="text-3xl sm:text-4xl font-bold leading-tight">ลดงานเตรียมสอน<br />เพิ่มเวลาดูแลนักเรียน</h2>
                        <p className="mt-4 text-white/60 leading-7">ทุกอย่างที่ครูต้องใช้ ตั้งแต่สร้างบทเรียน ออกข้อสอบ จนถึงวิเคราะห์ผล</p>
                    </div>
                    <div className="lg:col-span-3 grid sm:grid-cols-3 gap-4 relative">
                        {TEACHER_FEATURES.map(f => (
                            <div key={f.title} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
                                <div className="w-10 h-10 rounded-xl bg-white/10 text-brand-200 flex items-center justify-center">{f.icon}</div>
                                <h3 className="mt-4 font-bold">{f.title}</h3>
                                <p className="mt-1.5 text-sm text-white/60 leading-6">{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-24 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-ink">พร้อมเรียนในแบบของคุณแล้วหรือยัง?</h2>
                <p className="mt-4 text-slate-500 text-lg">สมัครฟรี ใช้เวลาไม่ถึงนาที</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Button href="/register" size="lg">สร้างบัญชีนักเรียน <ArrowRight size={18} /></Button>
                    <Button href="/login" size="lg" variant="secondary">เข้าสู่ระบบ</Button>
                </div>
            </section>

            <footer className="border-t border-slate-200/70 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                    <Logo />
                    <span>© {BRAND.name} · {BRAND.tagline}</span>
                </div>
            </footer>
        </div>
    );
}
