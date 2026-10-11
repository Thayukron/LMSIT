// วงกลมหมุนระหว่างโหลด (ใช้ใน loading.tsx ของ route ที่มี [param])
export default function Spinner({ fullScreen = true }: { fullScreen?: boolean }) {
    return (
        <div className={`${fullScreen ? 'min-h-screen' : 'py-20'} flex items-center justify-center`}>
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );
}
