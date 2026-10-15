import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import { t, pick } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { MistakesLink } from "@/components/site/Mistakes";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).tests.title };
}

export default async function Tests({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang).tests;
  const [s, tickets, topics, total] = await Promise.all([
    getSettings(),
    db.ticket.findMany({ orderBy: { number: "asc" }, include: { _count: { select: { questions: true } } } }),
    db.topic.findMany({ orderBy: { sort: "asc" }, include: { _count: { select: { questions: true } } } }),
    db.question.count(),
  ]);
  const examQ = Math.min(s.examQuestions, total);

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">{d.title}</h1>
      <p className="mt-2 max-w-[60ch] text-asphalt-500">{d.lead}</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col justify-between gap-6 rounded-2xl bg-asphalt p-6 text-white sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-semibold">{d.exam}</h2>
            <p className="mt-2 max-w-[48ch] text-white/75">{d.examText(examQ, s.examMinutes, s.examMaxErrors)}</p>
          </div>
          <div>
            {total > 0 ? <Link href={`/${lang}/tests/exam`} className="btn-mark">{d.startExam}</Link> : <p className="text-white/60">{d.empty}</p>}
          </div>
        </div>
        <MistakesLink lang={lang} />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">{d.tickets}</h2>
        {tickets.length === 0 ? (
          <p className="mt-3 text-asphalt-500">{d.empty}</p>
        ) : (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-10">
            {tickets.map((tk) => (
              <li key={tk.id}>
                <Link
                  href={`/${lang}/tests/ticket/${tk.number}`}
                  className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-concrete-200 hover:border-brand hover:text-brand"
                >
                  <span className="font-display text-2xl font-semibold tabular-nums">{tk.number}</span>
                  <span className="text-xs text-asphalt-500">{d.questionsCount(tk._count.questions)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {topics.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">{d.topics}</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {topics.filter((tp) => tp._count.questions > 0).map((tp) => (
              <li key={tp.id}>
                <Link href={`/${lang}/tests/topic/${tp.id}`} className="flex items-center justify-between rounded-xl border border-concrete-200 px-5 py-4 hover:border-brand">
                  <span className="font-medium">{pick(tp, "name", lang)}</span>
                  <span className="text-sm text-asphalt-500">{d.questionsCount(tp._count.questions)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
