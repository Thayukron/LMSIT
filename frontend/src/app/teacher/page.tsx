import Link from 'next/link';
import Navbar from '@/components/Navbar';

// หน้าหลักของครู: เครื่องมือจัดการวิชา/เนื้อหา/ข้อสอบ จะเพิ่มในระยะที่ 2
export default function TeacherHome() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <Navbar />
            <div className="container mx-auto mt-10 p-4 max-w-6xl">
                <h2 className="text-3xl mb-6 font-bold text-gray-800 border-l-8 border-indigo-600 pl-4">
                    ห้องพักครู
                </h2>
                <div className="bg-white rounded-[2rem] p-8 shadow-sm">
                    <p className="text-gray-500 mb-6">
                        ระบบจัดการวิชา อัปโหลดเนื้อหา และสร้างข้อสอบ กำลังพัฒนา (ระยะที่ 2)
                    </p>
                    <Link href="/student/dashboard" className="text-indigo-600 font-bold hover:underline">
                        ดูบทเรียนในมุมมองนักเรียน &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
