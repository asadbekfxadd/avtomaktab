import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { courseOptions } from "@/lib/site";
import { toQuizQuestions } from "@/lib/quiz";
import { Quiz } from "@/components/site/Quiz";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang; n: string }> }): Promise<Metadata> {
  const { lang, n } = await params;
  return { title: `${t(lang).tests.ticket} ${n}` };
}

export default async function TicketPage({ params }: { params: Promise<{ lang: Lang; n: string }> }) {
  const { lang, n } = await params;
  const ticket = await db.ticket.findUnique({
    where: { number: Number(n) || -1 },
    include: { questions: { orderBy: { position: "asc" }, include: { answers: { orderBy: { position: "asc" } } } } },
  });
  if (!ticket) notFound();
  const [s, courses] = await Promise.all([getSettings(), courseOptions(lang)]);
  return (
    <Quiz
      lang={lang}
      mode="ticket"
      title={`${t(lang).tests.ticket} ${ticket.number}`}
      questions={toQuizQuestions(ticket.questions, lang)}
      maxErrors={s.examMaxErrors}
      phone={s.phone}
      courses={courses}
    />
  );
}
