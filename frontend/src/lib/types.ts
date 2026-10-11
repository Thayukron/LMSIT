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
    visited_count: number; // บทที่ผู้ใช้คนนี้เข้าเรียนแล้ว
    passed_count: number;  // บทที่ผู้ใช้คนนี้สอบผ่านแล้ว
    quiz_count: number;    // ข้อสอบทั้งหมดในวิชา
    student_count: number; // นักเรียนที่เคยเข้าเรียน/สอบ
}

// บทเรียนในรายการของวิชา
export interface ModuleSummary {
    id: number;
    title: string;
    created_at: string;
    quiz_count: number;
}

// รายละเอียดวิชา (GET /api/courses/:courseId)
export interface CourseDetail extends Omit<CourseSummary, 'module_count' | 'visited_count' | 'passed_count' | 'quiz_count' | 'student_count'> {
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

// เนื้อหาที่ AI ปรับสไตล์แล้ว (GET /api/modules/:moduleId/content) — ต้องตรงกับ schema ใน ai.service.js
export type LessonBlockType = 'concept' | 'example' | 'analogy' | 'steps' | 'tip' | 'warning' | 'story' | 'mission' | 'fact';

export interface LessonBlock {
    type: LessonBlockType;
    emoji: string;
    title: string;
    content: string;
    highlight?: string;
}

export interface QuickCheck {
    after_section: number;
    question: string;
    choices: string[];
    answer_index: number;
    explanation: string;
}

export interface StyledContent {
    headline: string;
    emoji: string;
    intro: string;
    estimated_minutes: number;
    objectives: string[];
    sections: LessonBlock[];
    quick_checks: QuickCheck[];
    key_terms: { term: string; meaning: string }[];
    key_points: string[];
    closing: string;
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

// สรุปผลสอบของนักเรียน 1 คนใน 1 บทเรียน (ใช้ครั้งที่คะแนนสูงสุด)
export interface ModuleResult {
    visited: boolean;
    attempt_count: number;
    best_percent: number | null;
    best_score: number | null;
    best_total: number | null;
    best_attempt_id: number | null;
    passed: boolean;
    last_attempt_at: string | null;
}

// ความก้าวหน้าของฉันในวิชา (GET /api/courses/:courseId/progress)
export interface CourseProgress {
    course_id: number;
    pass_percent: number;
    total_modules: number;
    visited_modules: number;
    passed_modules: number;
    modules: (ModuleResult & { module_id: number; title: string; quiz_count: number; last_visited_at: string | null })[];
}

// รายงานผลการเรียนทั้งวิชา (GET /api/courses/:courseId/report)
export interface CourseReport {
    course_id: number;
    course_title: string;
    pass_percent: number;
    modules: {
        id: number;
        title: string;
        quiz_count: number;
        visited_count: number;
        attempted_count: number;
        passed_count: number;
        average_best_percent: number | null;
    }[];
    students: {
        id: number;
        name: string;
        email: string;
        visited_modules: number;
        passed_modules: number;
        results: Record<number, ModuleResult>;
    }[];
}

// สถิติรายข้อ (GET /api/modules/:moduleId/quiz-stats) — key คือ quiz id
export interface QuizStat {
    answered: number;
    correct: number;
    correct_percent: number;
    choices: Record<AnswerKey | 'blank', number>;
}
export type QuizStats = Record<number, QuizStat>;
