import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { queueWhere, STATUS, STATUS_ORDER, SOURCES } from "@/lib/crm";
import { PageHead } from "@/components/admin/ui";
import { LeadsChart } from "@/components/admin/LeadsChart";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Аналитика" };

const TZ = 5 * 3600_000;
const dayKey = (d: Date) => new Date(d.getTime() + TZ).toISOString().slice(0, 10);
function startOfTodayTashkent() {
  const k = dayKey(new Date());
  return new Date(new Date(k + "T00:00:00Z").getTime() - TZ);
}

function Kpi({ label, value, hint, href, tone }: { label: string; value: string | number; hint?: string; href?: string; tone?: "warn" }) {
  const body = (
    <>
      <p className="text-sm text-asphalt-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${tone === "warn" ? "text-stop" : ""}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-asphalt-500">{hint}</p>}
    </>
  );
  return href ? <Link href={href} className="a-card block p-4 hover:border-brand">{body}</Link> : <div className="a-card p-4">{body}</div>;
}

export default async function Dashboard() {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/admin/calls");

  const now = new Date();
  const today = startOfTodayTashkent();
  const d7 = new Date(today.getTime() - 6 * 86400_000);
  const d30 = new Date(today.getTime() - 29 * 86400_000);

  const [todayCount, weekCount, queue, overdue, leads30, statusCounts, managers, callsToday, calls7, attempts7, examPassed7, examTotal7] = await Promise.all([
    db.lead.count({ where: { createdAt: { gte: today } } }),
    db.lead.count({ where: { createdAt: { gte: d7 } } }),
    db.lead.count({ where: queueWhere(u, now) }),
    db.lead.count({ where: { status: { in: ["NO_ANSWER", "CALLBACK", "THINKING"] }, nextCallAt: { lt: new Date(now.getTime() - 3600_000) } } }),
    db.lead.findMany({
      where: { createdAt: { gte: d30 } },
      select: { id: true, createdAt: true, status: true, source: true, courseId: true, course: { select: { category: true } }, calls: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 } },
    }),
    db.lead.groupBy({ by: ["status"], _count: true }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.callLog.groupBy({ by: ["userId"], where: { createdAt: { gte: today } }, _count: true }),
    db.callLog.groupBy({ by: ["userId"], where: { createdAt: { gte: d7 } }, _count: true }),
    db.testAttempt.count({ where: { createdAt: { gte: d7 } } }),
    db.testAttempt.count({ where: { createdAt: { gte: d7 }, mode: "exam", passed: true } }),
    db.testAttempt.count({ where: { createdAt: { gte: d7 }, mode: "exam" } }),
  ]);

  const enrolledByManager = await db.lead.groupBy({ by: ["managerId"], where: { status: "ENROLLED", updatedAt: { gte: d30 } }, _count: true });
  const inWorkByManager = await db.lead.groupBy({ by: ["managerId"], where: { status: { in: ["NEW", "NO_ANSWER", "CALLBACK", "THINKING"] } }, _count: true });

  // график по дням
  const days: { key: string; day: string; leads: number; enrolled: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(d30.getTime() + i * 86400_000 + TZ);
    days.push({ key: d.toISOString().slice(0, 10), day: d.toISOString().slice(8, 10) + "." + d.toISOString().slice(5, 7), leads: 0, enrolled: 0 });
  }
  for (const l of leads30) {
    const row = days.find((x) => x.key === dayKey(l.createdAt));
    if (row) {
      row.leads++;
      if (l.status === "ENROLLED") row.enrolled++;
    }
  }

  const enrolled30 = leads30.filter((l) => l.status === "ENROLLED").length;
  const conv = leads30.length ? Math.round((enrolled30 / leads30.length) * 100) : 0;
  const responses = leads30.filter((l) => l.calls[0]).map((l) => (l.calls[0].createdAt.getTime() - l.createdAt.getTime()) / 60000).sort((a, b) => a - b);
  const median = responses.length ? responses[Math.floor(responses.length / 2)] : null;
  const fmtMin = (m: number) => (m < 60 ? `${Math.round(m)} мин` : m < 1440 ? `${(m / 60).toFixed(1)} ч` : `${(m / 1440).toFixed(1)} дн`);

  const bySource = Object.entries(
    leads30.reduce<Record<string, { all: number; won: number }>>((acc, l) => {
      acc[l.source] ??= { all: 0, won: 0 };
      acc[l.source].all++;
      if (l.status === "ENROLLED") acc[l.source].won++;
      return acc;
    }, {})
  ).sort((a, b) => b[1].all - a[1].all);

  const byCourse = Object.entries(
    leads30.reduce<Record<string, number>>((acc, l) => {
      const k = l.course?.category ?? "Не выбран";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const cnt = (arr: { _count: number; userId?: number | null; managerId?: number | null }[], id: number, key: "userId" | "managerId") => arr.find((x) => x[key] === id)?._count ?? 0;
  const totalStatus = statusCounts.reduce((s, x) => s + x._count, 0) || 1;

  return (
    <>
      <PageHead title="Аналитика" sub="Заявки, обзвон и подготовка учеников" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Заявок сегодня" value={todayCount} hint={`за 7 дней: ${weekCount}`} href="/admin/leads" />
        <Kpi label="Ждут звонка сейчас" value={queue} href="/admin/calls" tone={queue > 10 ? "warn" : undefined} />
        <Kpi label="Конверсия в запись" value={`${conv}%`} hint={`записались ${enrolled30} из ${leads30.length} за 30 дней`} />
        <Kpi label="Первый звонок (медиана)" value={median === null ? "—" : fmtMin(median)} hint="от заявки до звонка, 30 дней" />
      </div>
      {overdue > 0 && (
        <Link href="/admin/calls" className="mt-3 block rounded-lg bg-stop/10 px-4 py-2.5 text-sm font-medium text-stop">
          Просрочено перезвонов: {overdue}. Откройте очередь обзвона.
        </Link>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="a-card p-5">
          <h2 className="font-semibold">Заявки за 30 дней</h2>
          <div className="mt-4"><LeadsChart data={days} color={(await getSettings()).primaryColor} /></div>
        </section>
        <section className="a-card p-5">
          <h2 className="font-semibold">Воронка — все заявки</h2>
          <ul className="mt-4 space-y-3">
            {STATUS_ORDER.map((s) => {
              const n = statusCounts.find((x) => x.status === s)?._count ?? 0;
              return (
                <li key={s}>
                  <Link href={`/admin/leads?status=${s}`} className="flex justify-between text-sm hover:text-brand">
                    <span>{STATUS[s].label}</span>
                    <span className="tabular-nums text-asphalt-500">{n}</span>
                  </Link>
                  <div className="mt-1 h-1.5 rounded-full bg-concrete">
                    <div className={`h-full rounded-full ${s === "ENROLLED" ? "bg-go" : s === "REJECTED" ? "bg-asphalt-300" : "bg-brand"}`} style={{ width: `${(n / totalStatus) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="a-card p-5 lg:col-span-2">
          <h2 className="font-semibold">Менеджеры</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-concrete-200">
                  <th className="a-th pl-0">Сотрудник</th>
                  <th className="a-th text-right">Звонков сегодня</th>
                  <th className="a-th text-right">За 7 дней</th>
                  <th className="a-th text-right">В работе</th>
                  <th className="a-th text-right">Записал (30 дн)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-200">
                {managers.map((m) => (
                  <tr key={m.id}>
                    <td className="a-td pl-0 font-medium">{m.name}</td>
                    <td className="a-td text-right tabular-nums">{cnt(callsToday, m.id, "userId")}</td>
                    <td className="a-td text-right tabular-nums">{cnt(calls7, m.id, "userId")}</td>
                    <td className="a-td text-right tabular-nums">{cnt(inWorkByManager, m.id, "managerId")}</td>
                    <td className="a-td text-right font-semibold tabular-nums text-go">{cnt(enrolledByManager, m.id, "managerId")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="a-card p-5">
          <h2 className="font-semibold">Тесты на сайте, 7 дней</h2>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{attempts7}</p>
          <p className="text-sm text-asphalt-500">пройдено билетов и экзаменов</p>
          <p className="mt-4 text-sm">
            Экзамен сдают: <b>{examTotal7 ? Math.round((examPassed7 / examTotal7) * 100) : 0}%</b>
            <span className="text-asphalt-500"> ({examPassed7} из {examTotal7})</span>
          </p>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="a-card p-5">
          <h2 className="font-semibold">Источники, 30 дней</h2>
          <table className="mt-3 w-full">
            <thead><tr className="border-b border-concrete-200"><th className="a-th pl-0">Источник</th><th className="a-th text-right">Заявок</th><th className="a-th text-right">Записались</th><th className="a-th text-right">Конверсия</th></tr></thead>
            <tbody className="divide-y divide-concrete-200">
              {bySource.length === 0 && <tr><td colSpan={4} className="a-td pl-0 text-asphalt-500">Нет данных</td></tr>}
              {bySource.map(([k, v]) => (
                <tr key={k}>
                  <td className="a-td pl-0">{SOURCES[k] ?? k}</td>
                  <td className="a-td text-right tabular-nums">{v.all}</td>
                  <td className="a-td text-right tabular-nums">{v.won}</td>
                  <td className="a-td text-right tabular-nums">{Math.round((v.won / v.all) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="a-card p-5">
          <h2 className="font-semibold">Спрос по категориям, 30 дней</h2>
          <ul className="mt-4 space-y-3">
            {byCourse.length === 0 && <li className="text-sm text-asphalt-500">Нет данных</li>}
            {byCourse.map(([k, n]) => (
              <li key={k} className="flex items-center gap-3 text-sm">
                <span className="plate h-7 w-12 shrink-0 text-xs">{k.length > 4 ? "—" : k}</span>
                <div className="h-2 flex-1 rounded-full bg-concrete"><div className="h-full rounded-full bg-brand" style={{ width: `${(n / leads30.length) * 100}%` }} /></div>
                <span className="w-8 text-right tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
