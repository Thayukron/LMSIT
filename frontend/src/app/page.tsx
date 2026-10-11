import { redirect } from "next/navigation";

// ยังไม่มีระบบ Login จึงพาไปหน้า Dashboard นักเรียนก่อน (จะเปลี่ยนเป็นหน้า Login ในระยะที่ 1)
export default function Home() {
  redirect("/student/dashboard");
}
