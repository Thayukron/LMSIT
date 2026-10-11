import type { Metadata } from "next";
import { Anuphan, Prompt } from "next/font/google";
import { BRAND } from "@/lib/brand";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${anuphan.variable} ${prompt.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
