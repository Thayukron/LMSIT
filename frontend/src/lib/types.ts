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
    quiz_count: number;
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

export type AnswerKey = 'a' | 'b' | 'c' | 'd';

// ข้อสอบที่กำลังกรอก/แก้ไข หรือร่างจาก AI (ยังไม่มี id)
export interface QuizDraft {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: AnswerKey | '';
}

// ข้อสอบที่บันทึกแล้ว (GET /api/modules/:moduleId/quizzes) — correct_answer มีเฉพาะครูเจ้าของวิชา
export interface Quiz extends Omit<QuizDraft, 'correct_answer'> {
    id: number;
    module_id: number;
    correct_answer?: AnswerKey;
}

// คำตอบรายข้อในผลสอบ (สำเนาคำถาม/เฉลย ณ ตอนสอบ)
export interface AttemptAnswer {
    quiz_id: number | null;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: AnswerKey;
    selected_answer: AnswerKey | null;
    is_correct: boolean;
}

// ผลสอบ (POST /api/modules/:moduleId/attempts และ GET /api/attempts/:attemptId)
export interface AttemptResult {
    score: number;
    total: number;
    percent: number;
    passed: boolean;
    pass_percent: number;
    answers: AttemptAnswer[];
    saved?: boolean;
    attempt_id?: number;
    module_id?: number;
    module_title?: string;
    student_name?: string;
    created_at?: string;
}

// ประวัติการสอบ (GET /api/modules/:moduleId/attempts)
export interface AttemptSummary {
    id: number;
    score: number;
    total: number;
    percent: number;
    passed: boolean;
    created_at: string;
}
