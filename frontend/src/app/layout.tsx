import type { Metadata } from "next";
import { Anuphan, Prompt } from "next/font/google";
import { BRAND, DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/brand";
import "./globals.css";

// Anuphan: เนื้อหา/UI ทั่วไป | Prompt: หัวข้อใหญ่
const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
});

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — เรียนรู้ในแบบที่เป็นคุณ`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
};

// ตั้งธีมสีที่ผู้ใช้เลือกไว้ก่อนหน้าเว็บแสดงผล (กันสีกระพริบตอนโหลด)
const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" data-theme={DEFAULT_THEME} className={`${anuphan.variable} ${prompt.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
