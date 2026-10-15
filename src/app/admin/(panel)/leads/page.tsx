import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS, STATUS_ORDER, SOURCES } from "@/lib/crm";
import { leadWhere, type LeadQuery } from "@/lib/leadFilters";
import { prettyPhone, fmtDateTime } from "@/lib/format";
import { StatusBadge, PageHead, Empty } from "@/components/admin/ui";

export const metadata = { title: "Заявки" };
const PER = 50;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<LeadQuery> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const where = leadWhere(u, sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const [leads, total, managers, courses, counts] = await Promise.all([
    db.lead.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { course: true, manager: true } }),
    db.lead.count({ where }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.course.findMany({ orderBy: { sort: "asc" } }),
    db.lead.groupBy({ by: ["status"], where: leadWhere(u, { ...sp, status: undefined }), _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const qs = (patch: Partial<LeadQuery>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/leads?${p.toString()}`;
  };
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();
  const pages = Math.ceil(total / PER);

  return (
    <>
      <PageHead title="Заявки" sub={`Найдено: ${total}`}>
        <a href={`/admin/leads/export?${exportQs}`} className="a-btn-ghost">Выгрузить в Excel</a>
        <Link href="/admin/leads/new" className="a-btn-primary">Новая заявка</Link>
      </PageHead>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link href={qs({ status: undefined, page: undefined })} className={`rounded-full border px-3 py-1 text-sm ${!sp.status ? "border-asphalt bg-asphalt text-white" : "border-concrete-200 bg-white"}`}>
          Все
        </Link>
        {STATUS_ORDER.map((s) => (
          <Link key={s} href={qs({ status: s, page: undefined })} className={`rounded-full border px-3 py-1 text-sm ${sp.status === s ? "border-asphalt bg-asphalt text-white" : "border-concrete-200 bg-white"}`}>
            {STATUS[s].label} <span className="opacity-60">{countOf(s)}</span>
          </Link>
        ))}
      </div>

      <form className="a-card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input name="q" defaultValue={sp.q} placeholder="Имя, телефон или №" className="a-input lg:col-span-2" />
        {u.role === "ADMIN" && (
          <select name="manager" defaultValue={sp.manager ?? ""} className="a-input">
            <option value="">Все менеджеры</option>
            <option value="none">Не назначен</option>
            {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        <select name="course" defaultValue={sp.course ?? ""} className="a-input">
          <option value="">Все курсы</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.category} — {c.titleRu}</option>)}
        </select>
        <select name="source" defaultValue={sp.source ?? ""} className="a-input">
          <option value="">Все источники</option>
          {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="date" name="from" defaultValue={sp.from} className="a-input" aria-label="С даты" />
          <input type="date" name="to" defaultValue={sp.to} className="a-input" aria-label="По дату" />
        </div>
        <div className="flex gap-2 lg:col-span-6">
          <button className="a-btn-primary">Применить</button>
          <Link href="/admin/leads" className="a-btn-ghost">Сбросить</Link>
        </div>
      </form>

      {leads.length === 0 ? (
        <Empty>Заявок по этим условиям нет.</Empty>
      ) : (
        <div className="a-card overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-concrete-200 bg-concrete-50">
              <tr>
                <th className="a-th">№</th>
                <th className="a-th">Дата</th>
                <th className="a-th">Имя</th>
                <th className="a-th">Телефон</th>
                <th className="a-th">Курс</th>
                <th className="a-th">Статус</th>
                <th className="a-th">Менеджер</th>
                <th className="a-th">Перезвонить</th>
                <th className="a-th text-right">Звонков</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-concrete-200">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-concrete-50">
                  <td className="a-td text-asphalt-500">{l.id}</td>
                  <td className="a-td whitespace-nowrap text-asphalt-500">{fmtDateTime(l.createdAt)}</td>
                  <td className="a-td font-medium"><Link href={`/admin/leads/${l.id}`} className="hover:text-brand">{l.name}</Link></td>
                  <td className="a-td whitespace-nowrap tabular-nums">{prettyPhone(l.phone)}</td>
                  <td className="a-td">{l.course?.category ?? "—"}</td>
                  <td className="a-td"><StatusBadge s={l.status} /></td>
                  <td className="a-td">{l.manager?.name ?? <span className="text-asphalt-300">—</span>}</td>
                  <td className={`a-td whitespace-nowrap ${l.nextCallAt && l.nextCallAt < new Date() ? "font-medium text-stop" : ""}`}>{l.nextCallAt ? fmtDateTime(l.nextCallAt) : "—"}</td>
                  <td className="a-td text-right tabular-nums">{l.callCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {page > 1 && <Link href={qs({ page: String(page - 1) })} className="a-btn-ghost">Назад</Link>}
          <span className="text-asphalt-500">Страница {page} из {pages}</span>
          {page < pages && <Link href={qs({ page: String(page + 1) })} className="a-btn-ghost">Дальше</Link>}
        </div>
      )}
    </>
  );
}
