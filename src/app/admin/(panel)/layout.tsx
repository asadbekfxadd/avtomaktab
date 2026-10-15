import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { queueWhere } from "@/lib/crm";
import { logoutAction } from "../actions";
import { Sidebar } from "@/components/admin/Sidebar";

export const metadata = { title: "Админка", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  const [s, queue] = await Promise.all([getSettings(), db.lead.count({ where: queueWhere(u) })]);
  const admin = u.role === "ADMIN";
  const items = [
    { href: "/admin/calls", label: "Обзвон", badge: queue, group: "Продажи" },
    { href: "/admin/leads", label: "Заявки", group: "Продажи" },
    ...(admin
      ? [
          { href: "/admin", label: "Аналитика", group: "Продажи" },
          { href: "/admin/tests", label: "Билеты ПДД", group: "Обучение" },
          { href: "/admin/r/topics", label: "Темы вопросов", group: "Обучение" },
          { href: "/admin/r/books", label: "Библиотека", group: "Обучение" },
          { href: "/admin/r/courses", label: "Курсы и цены", group: "Сайт" },
          { href: "/admin/r/branches", label: "Филиалы", group: "Сайт" },
          { href: "/admin/r/reviews", label: "Отзывы", group: "Сайт" },
          { href: "/admin/r/faq", label: "Частые вопросы", group: "Сайт" },
          { href: "/admin/users", label: "Сотрудники", group: "Система" },
          { href: "/admin/settings", label: "Настройки", group: "Система" },
        ]
      : []),
  ];
  const logout = (
    <form action={logoutAction}>
      <button className="text-white/60 hover:text-white">Выйти</button>
    </form>
  );
  return (
    <div className="min-h-screen bg-concrete-50">
      <Sidebar items={items} school={s.schoolName} user={{ name: u.name, role: u.role }} logout={logout} />
      <div className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
