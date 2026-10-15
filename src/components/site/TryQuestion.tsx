"use client";
import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { QuizQuestion } from "@/lib/quiz";

export function TryQuestion({ lang, q }: { lang: Lang; q: QuizQuestion }) {
  const d = t(lang);
  const [chosen, setChosen] = useState<number | null>(null);
  const correct = q.answers.find((a) => a.correct)?.id;
  return (
    <div className="grid gap-6 rounded-2xl border border-concrete-200 bg-white p-5 sm:grid-cols-[180px_1fr] sm:p-7">
      {q.image && (
        <div className="flex items-center justify-center rounded-xl bg-concrete-50 p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q.image} alt="" className="h-32 w-auto" />
        </div>
      )}
      <div className={q.image ? "" : "sm:col-span-2"}>
        <p className="text-lg font-semibold">{q.text}</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {q.answers.map((a) => {
            let cls = "border-concrete-200 hover:border-brand";
            if (chosen !== null) cls = a.correct ? "border-go bg-go/10" : a.id === chosen ? "border-stop bg-stop/10" : "border-concrete-200 opacity-60";
            return (
              <li key={a.id}>
                <button disabled={chosen !== null} onClick={() => setChosen(a.id)} className={`w-full rounded-xl border-2 px-4 py-3 text-left text-[15px] transition-colors ${cls}`}>
                  {a.text}
                </button>
              </li>
            );
          })}
        </ul>
        {chosen !== null && (
          <p aria-live="polite" className={`mt-4 font-semibold ${chosen === correct ? "text-go" : "text-stop"}`}>
            {chosen === correct ? d.tryTest.right : d.tryTest.wrong}{" "}
            <span className="font-normal text-asphalt-500">{q.explanation}</span>
          </p>
        )}
      </div>
    </div>
  );
}
