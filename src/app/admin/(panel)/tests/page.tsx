import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHead, Saved, Empty } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/admin/Buttons";
import { createTicketAction, deleteTicketAction } from "../../actions";
import { ImportBox } from "./ImportBox";

export const metadata = { title: "Билеты ПДД" };

export default async function TestsAdmin({ searchParams }: { searchParams: Promise<{ ticket?: string; saved?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [tickets, noTicket, total, topics] = await Promise.all([
    db.ticket.findMany({ orderBy: { number: "asc" }, include: { _count: { select: { questions: true } } } }),
    db.question.count({ where: { ticketId: null } }),
    db.question.count(),
    db.topic.findMany(),
  ]);
  const sel = sp.ticket === "none" ? "none" : Number(sp.ticket) || tickets[0]?.id;
  const ticket = typeof sel === "number" ? tickets.find((t) => t.id === sel) : null;
  const questions = sel
    ? await db.question.findMany({
        where: { ticketId: sel === "none" ? null : sel },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        include: { answers: { orderBy: { position: "asc" } } },
      })
    : [];
  const topicName = (id: number | null) => topics.find((t) => t.id === id)?.nameRu;

  return (
    <>
      <PageHead title="Билеты ПДД" sub={`Билетов: ${tickets.length} · вопросов: ${total}`}>
        <a href="/admin/tests/template" className="a-btn-ghost">Шаблон Excel</a>
        <a href="/admin/tests/template?export=1" className="a-btn-ghost">Выгрузить все вопросы</a>
        <form action={createTicketAction}><button className="a-btn-ghost">Новый билет</button></form>
        <Link href={`/admin/tests/q/new${ticket ? `?ticket=${ticket.id}` : ""}`} className="a-btn-primary">Добавить вопрос</Link>
      </PageHead>
      <Saved show={!!sp.saved} />

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <nav className="a-card max-h-[60vh] overflow-y-auto p-2">
            {tickets.map((t) => (
              <Link key={t.id} href={`/admin/tests?ticket=${t.id}`} className={`flex justify-between rounded-md px-3 py-2 text-sm ${t.id === sel ? "bg-brand text-white" : "hover:bg-concrete-50"}`}>
                <span>Билет {t.number}</span>
                <span className="opacity-70">{t._count.questions}</span>
              </Link>
            ))}
            {noTicket > 0 && (
              <Link href="/admin/tests?ticket=none" className={`flex justify-between rounded-md px-3 py-2 text-sm ${sel === "none" ? "bg-brand text-white" : "hover:bg-concrete-50"}`}>
                <span>Без билета</span>
                <span className="opacity-70">{noTicket}</span>
              </Link>
            )}
            {tickets.length === 0 && noTicket === 0 && <p className="p-3 text-sm text-asphalt-500">Билетов нет</p>}
          </nav>
          <ImportBox />
        </aside>

        <section>
          {ticket && (
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Билет {ticket.number}</h2>
              <form action={deleteTicketAction} className="flex items-center gap-3 text-sm">
                <input type="hidden" name="id" value={ticket.id} />
                <label className="flex items-center gap-1.5 text-asphalt-500"><input type="checkbox" name="withQuestions" /> вместе с вопросами</label>
                <ConfirmSubmit message="Удалить билет?" className="a-btn-danger py-1.5">Удалить билет</ConfirmSubmit>
              </form>
            </div>
          )}
          {questions.length === 0 ? (
            <Empty>В этом билете пока нет вопросов. Добавьте вручную или загрузите Excel.</Empty>
          ) : (
            <ol className="space-y-3">
              {questions.map((q, i) => (
                <li key={q.id} className="a-card flex gap-4 p-4">
                  <span className="w-6 shrink-0 text-sm font-semibold text-asphalt-500 tabular-nums">{q.position || i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {q.imageUrl && <img src={q.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded bg-concrete-50 object-contain p-1" />}
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/tests/q/${q.id}`} className="font-medium hover:text-brand">{q.textRu}</Link>
                    <p className="text-sm text-asphalt-500">{q.textUz}</p>
                    <p className="mt-1.5 text-sm"><span className="text-go">✓ {q.answers.find((a) => a.isCorrect)?.textRu}</span> <span className="text-asphalt-300">· вариантов: {q.answers.length}{topicName(q.topicId) ? ` · ${topicName(q.topicId)}` : ""}</span></p>
                  </div>
                  <Link href={`/admin/tests/q/${q.id}`} className="shrink-0 text-sm text-brand">Изменить</Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
