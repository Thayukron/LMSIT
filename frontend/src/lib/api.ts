// เรียก Backend ผ่าน /api (Next.js ส่งต่อให้ตาม rewrites ใน next.config.ts)

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

/**
 * fetch แบบส่ง cookie อัตโนมัติ, แปลง JSON ให้ และโยน ApiError พร้อมข้อความจาก Backend ถ้าไม่สำเร็จ
 * ถ้าเซสชันหมดอายุ (401) จะพาไปหน้า Login
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const isJsonBody = init.body !== undefined && !(init.body instanceof FormData);
    const res = await fetch(path, {
        ...init,
        credentials: 'same-origin',
        headers: {
            ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
            ...init.headers,
        },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        if (res.status === 401 && !path.startsWith('/api/auth/')) {
            // ฟังก์ชันนี้อยู่นอก React component จึงใช้ useRouter() ไม่ได้
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
        throw new ApiError(res.status, data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
    return data as T;
}
