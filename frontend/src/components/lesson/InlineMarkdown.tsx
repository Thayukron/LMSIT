import React from 'react';
import ReactMarkdown from 'react-markdown';

// แสดง Markdown แบบบรรทัดเดียว (ตัวหนา/ตัวเอียง/โค้ด) ไม่ห่อด้วย <p>
// ใช้กับข้อความสั้นจาก AI เช่น คำถาม ตัวเลือก สรุป ที่ AI มักใส่ **ตัวหนา** มาด้วย
export default function InlineMarkdown({ children }: { children: string }) {
    return (
        <ReactMarkdown
            allowedElements={['p', 'strong', 'em', 'code', 'del']}
            unwrapDisallowed
            components={{ p: ({ children: c }) => <>{c}</> }}
        >
            {children}
        </ReactMarkdown>
    );
}
