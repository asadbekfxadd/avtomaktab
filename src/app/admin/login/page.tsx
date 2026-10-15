import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Вход", robots: { index: false } };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  const s = await getSettings();
  return (
    <div className="flex min-h-screen flex-col bg-asphalt">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-7">
          <p className="font-display text-lg font-semibold">{s.schoolName}</p>
          <p className="text-sm text-asphalt-500">Вход для сотрудников</p>
          <LoginForm />
        </div>
      </div>
      <div className="lane h-10 bg-asphalt-700 bg-[length:96px_5px]" aria-hidden />
    </div>
  );
}
