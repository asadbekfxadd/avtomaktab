"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { QuizQuestion } from "@/lib/quiz";
import { Quiz, readMistakes } from "./Quiz";

export function MistakesLink({ lang }: { lang: Lang }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => setN(readMistakes().length), []);
  const d = t(lang).tests;
  return (
    <Link href={`/${lang}/tests/mistakes`} className="group flex items-center justify-between rounded-xl border border-concrete-200 p-5 hover:border-brand">
      <span>
        <span className="block font-semibold">{d.mistakes}</span>
        <span className="text-sm text-asphalt-500">{d.mistakesText}</span>
      </span>
      {n !== null && n > 0 && <span className="rounded-full bg-stop px-2.5 py-0.5 text-sm font-semibold text-white">{n}</span>}
    </Link>
  );
}

export function MistakesQuiz({ lang, phone, courses }: { lang: Lang; phone: string; courses: { id: number; label: string }[] }) {
  const [qs, setQs] = useState<QuizQuestion[] | null>(null);
  useEffect(() => {
    const ids = readMistakes();
    if (!ids.length) return setQs([]);
    fetch(`/api/questions?lang=${lang}&ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then(setQs)
      .catch(() => setQs([]));
  }, [lang]);
  const d = t(lang).tests;
  if (qs === null) return <div className="container-x py-16 text-asphalt-500">…</div>;
  if (!qs.length)
    return (
      <div className="container-x py-16">
        <h1 className="font-display text-2xl font-semibold">{d.mistakes}</h1>
        <p className="mt-2 text-asphalt-500">{d.noMistakes}</p>
        <Link href={`/${lang}/tests`} className="btn-brand mt-6">{d.tickets}</Link>
      </div>
    );
  return <Quiz lang={lang} title={d.mistakes} questions={qs} mode="mistakes" phone={phone} courses={courses} />;
}
