"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { QuizQuestion } from "@/lib/quiz";
import { LeadForm } from "./LeadForm";

export type QuizMode = "ticket" | "topic" | "exam" | "mistakes";
const MISTAKES_KEY = "am_mistakes";

export function readMistakes(): number[] {
  try {
    return JSON.parse(localStorage.getItem(MISTAKES_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeMistakes(ids: number[]) {
  try {
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(Array.from(new Set(ids)).slice(-500)));
  } catch {}
}

export function Quiz({
  lang,
  title,
  questions,
  mode,
  minutes = 25,
  maxErrors = 2,
  phone,
  courses,
}: {
  lang: Lang;
  title: string;
  questions: QuizQuestion[];
  mode: QuizMode;
  minutes?: number;
  maxErrors?: number;
  phone: string;
  courses: { id: number; label: string }[];
}) {
  const d = t(lang).tests;
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [done, setDone] = useState<null | "finished" | "errors" | "time">(null);
  const [left, setLeft] = useState(minutes * 60);
  const reported = useRef(false);
  const isExam = mode === "exam";

  const q = questions[idx];
  const correctOf = useCallback((qq: QuizQuestion) => qq.answers.find((a) => a.correct)?.id, []);
  const errors = useMemo(() => questions.filter((qq) => picked[qq.id] !== undefined && picked[qq.id] !== correctOf(qq)).length, [questions, picked, correctOf]);
  const answeredCount = Object.keys(picked).length;
  const correctCount = answeredCount - errors;

  // таймер экзамена
  useEffect(() => {
    if (!isExam || done) return;
    const tm = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(tm);
  }, [isExam, done]);
  useEffect(() => {
    if (isExam && left === 0 && !done) setDone("time");
  }, [left, isExam, done]);

  const choose = useCallback(
    (answerId: number) => {
      if (!q || picked[q.id] !== undefined || done) return;
      const next = { ...picked, [q.id]: answerId };
      setPicked(next);
      const right = answerId === correctOf(q);
      const m = readMistakes();
      writeMistakes(right ? m.filter((x) => x !== q.id) : [...m, q.id]);
      const errs = questions.filter((qq) => next[qq.id] !== undefined && next[qq.id] !== correctOf(qq)).length;
      if (isExam && errs > maxErrors) setDone("errors");
      else if (isExam && Object.keys(next).length === questions.length) setTimeout(() => setDone("finished"), 600);
    },
    [q, picked, done, correctOf, questions, isExam, maxErrors]
  );

  const goNext = useCallback(() => {
    // к следующему неотвеченному
    for (let k = 1; k <= questions.length; k++) {
      const j = (idx + k) % questions.length;
      if (picked[questions[j].id] === undefined) return setIdx(j);
    }
    if (idx < questions.length - 1) setIdx(idx + 1);
  }, [idx, questions, picked]);

  // клавиатура: 1–5 выбор ответа, Enter/→ дальше
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (done || !q) return;
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.answers.length) choose(q.answers[n - 1].id);
      if ((e.key === "Enter" || e.key === "ArrowRight") && picked[q.id] !== undefined) goNext();
      if (e.key === "ArrowLeft" && idx > 0) setIdx(idx - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [q, choose, goNext, picked, idx, done]);

  const passed = done !== null && done !== "errors" && done !== "time" && errors <= maxErrors;

  useEffect(() => {
    if (!done || reported.current) return;
    reported.current = true;
    fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, correct: correctCount, total: questions.length, passed }),
    }).catch(() => {});
  }, [done, mode, correctCount, questions.length, passed]);

  function restart() {
    if (isExam) return window.location.reload();
    setPicked({});
    setIdx(0);
    setDone(null);
    reported.current = false;
  }

  if (!questions.length) {
    return (
      <div className="container-x py-16">
        <p className="text-asphalt-500">{d.empty}</p>
        <Link href={`/${lang}/tests`} className="btn-ghost mt-4">{d.back}</Link>
      </div>
    );
  }

  if (done) {
    const wrong = questions.filter((qq) => picked[qq.id] !== undefined && picked[qq.id] !== correctOf(qq));
    return (
      <div className="container-x max-w-3xl py-10">
        <div className={`rounded-2xl p-6 sm:p-8 ${passed ? "bg-go text-white" : "bg-stop text-white"}`}>
          <p className="text-sm text-white/80">{title}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {done === "time" ? d.timeUp : passed ? d.passed : d.failed}
          </h1>
          <p className="mt-2 text-lg">{d.result(correctCount, questions.length)}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={restart} className="btn bg-white text-asphalt hover:bg-concrete-50">{d.retry}</button>
            <Link href={`/${lang}/tests`} className="btn border border-white/40 text-white hover:bg-white/10">{d.back}</Link>
          </div>
        </div>

        {wrong.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">{d.errors}: {wrong.length}</h2>
            <ul className="mt-4 space-y-4">
              {wrong.map((qq) => (
                <li key={qq.id} className="rounded-xl border border-concrete-200 p-5">
                  <p className="font-medium">{qq.text}</p>
                  <p className="mt-2 text-sm text-stop line-through">{qq.answers.find((a) => a.id === picked[qq.id])?.text}</p>
                  <p className="mt-1 text-sm font-medium text-go">{qq.answers.find((a) => a.correct)?.text}</p>
                  {qq.explanation && <p className="mt-2 text-sm text-asphalt-500">{qq.explanation}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 rounded-2xl bg-concrete-50 p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">{d.ctaTitle}</h2>
          <p className="mt-1 text-asphalt-500">{d.ctaText}</p>
          <div className="mt-5">
            <LeadForm lang={lang} courses={courses} source="tests" phone={phone} />
          </div>
        </section>
      </div>
    );
  }

  const chosen = picked[q.id];
  const answered = chosen !== undefined;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="container-x max-w-4xl py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/${lang}/tests`} className="text-sm text-asphalt-500 hover:text-brand">{d.back}</Link>
          <h1 className="font-display text-xl font-semibold sm:text-2xl">{title}</h1>
        </div>
        {isExam && (
          <div className="flex items-center gap-3 text-sm">
            <span className={`rounded-lg px-3 py-1.5 font-semibold tabular-nums ${left < 120 ? "bg-stop text-white" : "bg-asphalt text-white"}`} aria-label={d.timeLeft}>
              {mm}:{ss}
            </span>
            <span className="rounded-lg border border-concrete-200 px-3 py-1.5">
              {d.errors}: <b className={errors ? "text-stop" : ""}>{errors}</b> / {maxErrors}
            </span>
          </div>
        )}
      </div>

      {/* навигация по вопросам */}
      <ol className="mt-5 flex flex-wrap gap-1.5" aria-label={d.question}>
        {questions.map((qq, i) => {
          const p = picked[qq.id];
          const st = p === undefined ? "" : p === correctOf(qq) ? "bg-go text-white border-go" : "bg-stop text-white border-stop";
          return (
            <li key={qq.id}>
              <button
                onClick={() => setIdx(i)}
                aria-current={i === idx ? "step" : undefined}
                className={`h-9 w-9 rounded-md border text-sm font-semibold tabular-nums ${st || "border-concrete-200 bg-white"} ${i === idx ? "ring-2 ring-brand ring-offset-1" : ""}`}
              >
                {i + 1}
              </button>
            </li>
          );
        })}
      </ol>

      <article className="mt-6 overflow-hidden rounded-2xl border border-concrete-200">
        {q.image && (
          <div className="flex justify-center bg-concrete-50 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={q.image} alt="" className="max-h-56 w-auto object-contain" />
          </div>
        )}
        <div className="p-5 sm:p-7">
          <p className="text-sm text-asphalt-500">
            {d.question} {idx + 1} {d.of} {questions.length}
          </p>
          <h2 className="mt-2 text-lg font-semibold leading-snug sm:text-xl">{q.text}</h2>
          <ul className="mt-5 grid gap-2.5">
            {q.answers.map((a, i) => {
              let cls = "border-concrete-200 hover:border-brand hover:bg-brand/5";
              if (answered) {
                if (a.correct) cls = "border-go bg-go/10";
                else if (a.id === chosen) cls = "border-stop bg-stop/10";
                else cls = "border-concrete-200 opacity-60";
              }
              return (
                <li key={a.id}>
                  <button
                    onClick={() => choose(a.id)}
                    disabled={answered}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${cls}`}
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-concrete text-xs font-bold text-asphalt-700">{i + 1}</span>
                    <span>{a.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {answered && (
            <div className="mt-5" aria-live="polite">
              <p className={`font-semibold ${chosen === correctOf(q) ? "text-go" : "text-stop"}`}>
                {chosen === correctOf(q) ? t(lang).tryTest.right : t(lang).tryTest.wrong}
              </p>
              {!isExam && q.explanation && (
                <p className="mt-2 rounded-lg bg-concrete-50 p-4 text-[15px] text-asphalt-700">
                  <b>{d.explanation}.</b> {q.explanation}
                </p>
              )}
              <div className="mt-4 flex gap-3">
                {answeredCount < questions.length ? (
                  <button onClick={goNext} className="btn-brand">{d.next}</button>
                ) : (
                  <button onClick={() => setDone("finished")} className="btn-brand">{d.finish}</button>
                )}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
