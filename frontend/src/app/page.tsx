import { redirect } from "next/navigation";

// ปกติ proxy.ts จะพาไปหน้า Login หรือหน้าหลักของแต่ละ role ก่อนถึงหน้านี้
export default function Home() {
  redirect("/login");
}
