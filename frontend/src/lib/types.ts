export type Role = 'TEACHER' | 'STUDENT';

// ผู้ใช้ที่ login อยู่ (GET /api/auth/me)
export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
}

// วิชาในรายการ (GET /api/courses)
export interface CourseSummary {
    id: number;
    title: string;
    description: string | null;
    teacher_id: number | null;
    teacher_name: string | null;
    module_count: number;
    created_at: string;
}

// บทเรียนในรายการของวิชา
export interface ModuleSummary {
    id: number;
    title: string;
    created_at: string;
}

// รายละเอียดวิชา (GET /api/courses/:courseId)
export interface CourseDetail extends Omit<CourseSummary, 'module_count'> {
    modules: ModuleSummary[];
    can_edit: boolean;
}

// รายละเอียดบทเรียน (GET /api/modules/:moduleId) — original_content มีเฉพาะครูเจ้าของวิชา
export interface ModuleDetail {
    id: number;
    title: string;
    course_id: number;
    course_title: string;
    created_at: string;
    can_edit: boolean;
    original_content?: string;
}

// เนื้อหาที่ AI ปรับสไตล์แล้ว (GET /api/modules/:moduleId/content)
export interface StyledSection {
    title: string;
    content: string;
    image_keyword?: string;
}

export interface StyledContent {
    headline: string;
    intro: string;
    sections: StyledSection[];
    key_points: string[];
}
