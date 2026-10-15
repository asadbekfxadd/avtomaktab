import type { Metadata } from "next";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { courseOptions } from "@/lib/site";
import { toQuizQuestions, shuffle } from "@/lib/quiz";
import { Quiz } from "@/components/site/Quiz";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).tests.exam, robots: { index: false } };
}

export default async function ExamPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const [s, courses] = await Promise.all([getSettings(), courseOptions(lang)]);
  const ids = await db.question.findMany({ select: { id: true } });
  const chosen = shuffle(ids).slice(0, s.examQuestions).map((x) => x.id);
  const qs = await db.question.findMany({ where: { id: { in: chosen } }, include: { answers: { orderBy: { position: "asc" } } } });
  const ordered = chosen.map((id) => qs.find((q) => q.id === id)!).filter(Boolean);
  return (
    <Quiz
      lang={lang}
      mode="exam"
      title={t(lang).tests.exam}
      questions={toQuizQuestions(ordered, lang)}
      minutes={s.examMinutes}
      maxErrors={s.examMaxErrors}
      phone={s.phone}
      courses={courses}
    />
  );
}
