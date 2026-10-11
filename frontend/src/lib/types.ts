// โมดูลที่แสดงบน Dashboard (GET /api/courses)
export interface ModuleSummary {
    id: number;
    title: string;
}

// เนื้อหาที่ AI ปรับสไตล์แล้ว (GET /api/courses/modules/:moduleId/content)
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
