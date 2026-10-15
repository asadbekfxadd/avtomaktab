import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { queueWhere, visibleWhere, ago, SOURCES, RESULT, STATUS } from "@/lib/crm";
import { prettyPhone, telHref, fmtDateTime } from "@/lib/format";
import { CallForm } from "@/components/admin/CallForm";
import { StatusBadge, PageHead, Empty } from "@/components/admin/ui";
import { takeLeadAction } from "../../actions";

export const metadata = { title: "Обзвон" };

export default async function CallsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const now = new Date();

  const [fresh, due, upcoming] = await Promise.all([
    db.lead.findMany({ where: { AND: [queueWhere(u, now), { status: "NEW" }] }, orderBy: { createdAt: "desc" }, include: { course: true }, take: 100 }),
    db.lead.findMany({ where: { AND: [queueWhere(u, now), { status: { not: "NEW" } }] }, orderBy: [{ nextCallAt: "asc" }, { updatedAt: "asc" }], include: { course: true }, take: 100 }),
    db.lead.count({
      where: { AND: [visibleWhere(u), { status: { in: ["NO_ANSWER", "CALLBACK", "THINKING"] } }, { nextCallAt: { gt: now } }] },
    }),
  ]);
  const queue = [...fresh, ...due];

  const selectedId = Number(sp.id) || queue[0]?.id;
  const lead = selectedId
    ? await db.lead.findFirst({
        where: { AND: [{ id: selectedId }, visibleWhere(u)] },
        include: { course: true, branch: true, manager: true, calls: { orderBy: { createdAt: "desc" }, include: { user: true }, take: 20 } },
      })
    : null;

  return (
    <>
      <PageHead title="Обзвон" sub={`В очереди: ${queue.length}${upcoming ? ` · запланировано позже: ${upcoming}` : ""}`}>
        <Link href="/admin/leads/new" className="a-btn-ghost">Добавить заявку</Link>
      </PageHead>

      {queue.length === 0 && !lead ? (
        <Empty>
          Очередь пуста — все заявки обработаны.
          <br />
          Новые заявки с сайта появятся здесь автоматически.
        </Empty>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <ul className="a-card order-2 max-h-[75vh] divide-y lg:order-none divide-concrete-200 overflow-y-auto">
            {queue.map((l) => (
              <li key={l.id}>
                <Link href={`/admin/calls?id=${l.id}`} className={`block px-4 py-3 ${l.id === lead?.id ? "bg-brand/5 shadow-[inset_3px_0_0_rgb(var(--brand))]" : "hover:bg-concrete-50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{l.name}</span>
                    <StatusBadge s={l.status} />
                  </div>
                  <div className="mt-0.5 flex justify-between gap-2 text-xs text-asphalt-500">
                    <span className="tabular-nums">{prettyPhone(l.phone)}</span>
                    <span>{l.status === "NEW" ? ago(l.createdAt) : l.nextCallAt ? `перезвон ${fmtDateTime(l.nextCallAt)}` : ago(l.updatedAt)}</span>
                  </div>
                  {l.course && <p className="mt-0.5 text-xs text-asphalt-500">Категория {l.course.category}</p>}
                </Link>
              </li>
            ))}
          </ul>

          {lead && (
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <section className="a-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-asphalt-500">Заявка #{lead.id} · {fmtDateTime(lead.createdAt)}</p>
                    <h2 className="mt-1 text-2xl font-semibold">{lead.name}</h2>
                  </div>
                  <StatusBadge s={lead.status} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={telHref(lead.phone)} className="a-btn-primary px-5 py-3 text-lg tabular-nums">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z"/></svg>
                    {prettyPhone(lead.phone)}
                  </a>
                  <a href={`https://t.me/${lead.phone}`} target="_blank" rel="noopener" className="a-btn-ghost py-3">Telegram</a>
                  <Link href={`/admin/leads/${lead.id}`} className="a-btn-ghost py-3">Карточка</Link>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-asphalt-500">Курс</dt><dd className="font-medium">{lead.course ? `${lead.course.category} — ${lead.course.titleRu}` : "Не выбран"}</dd></div>
                  <div><dt className="text-asphalt-500">Филиал</dt><dd className="font-medium">{lead.branch?.nameRu ?? "—"}</dd></div>
                  <div><dt className="text-asphalt-500">Источник</dt><dd className="font-medium">{SOURCES[lead.source] ?? lead.source}{lead.utmSource ? ` / ${lead.utmSource}` : ""}</dd></div>
                  <div><dt className="text-asphalt-500">Звонков</dt><dd className="font-medium">{lead.callCount}</dd></div>
                  <div><dt className="text-asphalt-500">Менеджер</dt><dd className="font-medium">{lead.manager?.name ?? "Не назначен"}</dd></div>
                  <div><dt className="text-asphalt-500">Перезвонить</dt><dd className="font-medium">{fmtDateTime(lead.nextCallAt)}</dd></div>
                </dl>

                {!lead.managerId && (
                  <form action={takeLeadAction} className="mt-4">
                    <input type="hidden" name="id" value={lead.id} />
                    <button className="a-btn-ghost">Взять заявку себе</button>
                  </form>
                )}

                {lead.comment && <p className="mt-5 whitespace-pre-line rounded-lg bg-concrete-50 p-3 text-sm">{lead.comment}</p>}

                <h3 className="mt-7 text-sm font-semibold">История звонков</h3>
                {lead.calls.length === 0 ? (
                  <p className="mt-2 text-sm text-asphalt-500">Ещё не звонили. Новым заявкам лучше звонить в первые 15 минут.</p>
                ) : (
                  <ol className="mt-3 space-y-3 border-l-2 border-concrete-200 pl-4">
                    {lead.calls.map((c) => (
                      <li key={c.id} className="text-sm">
                        <p>
                          <span className="font-medium">{RESULT[c.result]}</span>
                          <span className="text-asphalt-500"> → {STATUS[c.statusAfter].label}</span>
                        </p>
                        <p className="text-xs text-asphalt-500">{fmtDateTime(c.createdAt)} · {c.user?.name ?? "—"}</p>
                        {c.note && <p className="mt-1 whitespace-pre-line text-asphalt-700">{c.note}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="a-card h-fit p-5">
                <h3 className="mb-4 font-semibold">Записать звонок</h3>
                <CallForm key={lead.id} leadId={lead.id} back="queue" current={lead.status} />
              </section>
            </div>
          )}
        </div>
      )}
    </>
  );
}
