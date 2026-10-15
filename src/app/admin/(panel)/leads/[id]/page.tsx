import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibleWhere, RESULT, STATUS, SOURCES } from "@/lib/crm";
import { fmtDateTime, prettyPhone, telHref } from "@/lib/format";
import { PageHead, StatusBadge, Saved } from "@/components/admin/ui";
import { LeadEditForm } from "@/components/admin/LeadEditForm";
import { CallForm } from "@/components/admin/CallForm";
import { ConfirmSubmit } from "@/components/admin/Buttons";
import { deleteLeadAction } from "../../../actions";

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const lead = await db.lead.findFirst({
    where: { AND: [{ id: Number(id) || -1 }, visibleWhere(me)] },
    include: { calls: { orderBy: { createdAt: "desc" }, include: { user: true } } },
  });
  if (!lead) notFound();
  const [managers, courses, branches] = await Promise.all([
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.course.findMany({ orderBy: { sort: "asc" } }),
    db.branch.findMany({ orderBy: { sort: "asc" } }),
  ]);

  return (
    <>
      <Link href="/admin/leads" className="text-sm text-asphalt-500 hover:text-brand">Все заявки</Link>
      <PageHead title={`${lead.name}`} sub={`Заявка #${lead.id} · ${fmtDateTime(lead.createdAt)} · ${SOURCES[lead.source] ?? lead.source}`}>
        <StatusBadge s={lead.status} />
      </PageHead>
      <Saved show={!!sp.saved} />

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="a-card p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap gap-2">
              <a href={telHref(lead.phone)} className="a-btn-primary tabular-nums">Позвонить {prettyPhone(lead.phone)}</a>
              <a href={`https://t.me/${lead.phone}`} target="_blank" rel="noopener" className="a-btn-ghost">Telegram</a>
            </div>
            <LeadEditForm lead={lead} managers={managers} courses={courses} branches={branches} me={me} />
          </section>

          <section className="a-card p-5 sm:p-6">
            <h2 className="font-semibold">История звонков</h2>
            {lead.calls.length === 0 ? (
              <p className="mt-2 text-sm text-asphalt-500">Звонков ещё не было.</p>
            ) : (
              <ol className="mt-4 space-y-4 border-l-2 border-concrete-200 pl-4">
                {lead.calls.map((c) => (
                  <li key={c.id} className="text-sm">
                    <p><span className="font-medium">{RESULT[c.result]}</span><span className="text-asphalt-500"> → {STATUS[c.statusAfter].label}</span></p>
                    <p className="text-xs text-asphalt-500">{fmtDateTime(c.createdAt)} · {c.user?.name ?? "—"}</p>
                    {c.note && <p className="mt-1 whitespace-pre-line">{c.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="a-card p-5">
            <h2 className="mb-4 font-semibold">Записать звонок</h2>
            <CallForm leadId={lead.id} back="lead" current={lead.status} />
          </section>
          {me.role === "ADMIN" && (
            <form action={deleteLeadAction}>
              <input type="hidden" name="id" value={lead.id} />
              <ConfirmSubmit message="Удалить заявку вместе с историей звонков?">Удалить заявку</ConfirmSubmit>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
