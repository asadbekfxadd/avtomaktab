import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { courseOptions } from "@/lib/site";
import { toQuizQuestions } from "@/lib/quiz";
import { Quiz } from "@/components/site/Quiz";

export default async function TopicPage({ params }: { params: Promise<{ lang: Lang; id: string }> }) {
  const { lang, id } = await params;
  const topic = await db.topic.findUnique({
    where: { id: Number(id) || -1 },
    include: { questions: { orderBy: [{ ticketId: "asc" }, { position: "asc" }], include: { answers: { orderBy: { position: "asc" } } } } },
  });
  if (!topic) notFound();
  const [s, courses] = await Promise.all([getSettings(), courseOptions(lang)]);
  return <Quiz lang={lang} mode="topic" title={pick(topic, "name", lang)} questions={toQuizQuestions(topic.questions, lang)} maxErrors={s.examMaxErrors} phone={s.phone} courses={courses} />;
}
