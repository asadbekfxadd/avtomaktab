import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHead } from "@/components/admin/ui";
import { SubmitButton, ConfirmSubmit } from "@/components/admin/Buttons";
import { saveQuestionAction, deleteQuestionAction } from "../../../../actions";

export default async function QuestionEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ticket?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const q = isNew ? null : await db.question.findUnique({ where: { id: Number(id) || -1 }, include: { answers: { orderBy: { position: "asc" } } } });
  if (!isNew && !q) notFound();
  const [tickets, topics] = await Promise.all([db.ticket.findMany({ orderBy: { number: "asc" } }), db.topic.findMany({ orderBy: { sort: "asc" } })]);
  const ticketId = q?.ticketId ?? (Number(sp.ticket) || null);
  const nextPos = isNew && ticketId ? (await db.question.count({ where: { ticketId } })) + 1 : q?.position ?? 0;
  const slots = Array.from({ length: 5 }, (_, i) => q?.answers[i]);
  const correct = (q?.answers.findIndex((a) => a.isCorrect) ?? 0) + 1 || 1;

  return (
    <>
      <Link href={`/admin/tests?ticket=${ticketId ?? "none"}`} className="text-sm text-asphalt-500 hover:text-brand">Билеты ПДД</Link>
      <PageHead title={isNew ? "Новый вопрос" : `Вопрос #${q!.id}`} />
      <form action={saveQuestionAction} className="a-card max-w-5xl space-y-6 p-5 sm:p-6">
        {q && <input type="hidden" name="id" value={q.id} />}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="a-label" htmlFor="ticketId">Билет</label>
            <select id="ticketId" name="ticketId" defaultValue={ticketId ?? ""} className="a-input">
              <option value="">Без билета</option>
              {tickets.map((t) => <option key={t.id} value={t.id}>Билет {t.number}</option>)}
            </select>
          </div>
          <div>
            <label className="a-label" htmlFor="position">Номер в билете</label>
            <input id="position" name="position" defaultValue={nextPos || ""} inputMode="numeric" className="a-input" />
          </div>
          <div>
            <label className="a-label" htmlFor="topicId">Тема</label>
            <select id="topicId" name="topicId" defaultValue={q?.topicId ?? ""} className="a-input">
              <option value="">Без темы</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.nameRu}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="a-label" htmlFor="textRu">Вопрос (RU)</label>
            <textarea id="textRu" name="textRu" rows={3} defaultValue={q?.textRu} className="a-input" />
          </div>
          <div>
            <label className="a-label" htmlFor="textUz">Savol (UZ)</label>
            <textarea id="textUz" name="textUz" rows={3} defaultValue={q?.textUz} className="a-input" />
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-concrete-200 p-4">
          <p className="a-label">Картинка (знак, ситуация на дороге)</p>
          {q?.imageUrl && (
            <div className="mb-3 flex items-center gap-3 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.imageUrl} alt="" className="h-20 w-20 rounded bg-concrete-50 object-contain p-1" />
              <label className="flex items-center gap-1.5 text-asphalt-500"><input type="checkbox" name="image__remove" /> удалить</label>
            </div>
          )}
          <input type="file" name="image__file" accept="image/*" className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-concrete file:px-3 file:py-2 file:text-sm" />
          <input type="hidden" name="imageUrl" value={q?.imageUrl ?? ""} />
        </div>

        <fieldset>
          <legend className="a-label">Варианты ответа — отметьте правильный</legend>
          <div className="space-y-2">
            {slots.map((a, i) => (
              <div key={i} className="grid items-center gap-2 sm:grid-cols-[28px_1fr_1fr]">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-asphalt-500">
                  <input type="radio" name="correct" value={i + 1} defaultChecked={correct === i + 1} className="h-4 w-4 accent-[#178A4E]" aria-label={`Правильный ответ ${i + 1}`} />
                </label>
                <input name={`a${i + 1}Ru`} defaultValue={a?.textRu} placeholder={`Ответ ${i + 1} (RU)`} className="a-input" />
                <input name={`a${i + 1}Uz`} defaultValue={a?.textUz} placeholder={`Javob ${i + 1} (UZ)`} className="a-input" />
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-asphalt-500">Пустые строки не сохраняются. Нужно минимум 2 варианта.</p>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="a-label" htmlFor="explanationRu">Пояснение (RU)</label>
            <textarea id="explanationRu" name="explanationRu" rows={3} defaultValue={q?.explanationRu} className="a-input" />
          </div>
          <div>
            <label className="a-label" htmlFor="explanationUz">Izoh (UZ)</label>
            <textarea id="explanationUz" name="explanationUz" rows={3} defaultValue={q?.explanationUz} className="a-input" />
          </div>
        </div>

        <div className="flex gap-2">
          <SubmitButton>Сохранить вопрос</SubmitButton>
          <Link href={`/admin/tests?ticket=${ticketId ?? "none"}`} className="a-btn-ghost">Отмена</Link>
        </div>
      </form>
      {q && (
        <form action={deleteQuestionAction} className="mt-4">
          <input type="hidden" name="id" value={q.id} />
          <ConfirmSubmit message="Удалить вопрос?">Удалить вопрос</ConfirmSubmit>
        </form>
      )}
    </>
  );
}
