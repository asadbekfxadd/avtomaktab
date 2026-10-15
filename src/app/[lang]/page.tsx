import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import { t, pick } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCourses, getBranches, courseOptions, branchOptions } from "@/lib/site";
import { formatPrice, telHref } from "@/lib/format";
import { toQuizQuestions } from "@/lib/quiz";
import { LeadForm, ChooseCourseButton } from "@/components/site/LeadForm";
import { TryQuestion } from "@/components/site/TryQuestion";
import { BookCover } from "@/components/site/BookCover";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const s = await getSettings();
  return { title: { absolute: `${s.schoolName} — ${pick(s, "heroTitle", lang)}` }, description: pick(s, "heroText", lang) };
}

const ALL_CATS = ["A", "B", "C", "D", "BE", "CE"];

export default async function Home({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang);
  const [s, courses, branches, cOpts, bOpts, faqs, reviews, books, demoQ] = await Promise.all([
    getSettings(),
    getCourses(),
    getBranches(),
    courseOptions(lang),
    branchOptions(lang),
    db.faq.findMany({ orderBy: { sort: "asc" } }),
    db.review.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.book.findMany({ where: { published: true }, orderBy: [{ sort: "asc" }, { id: "desc" }], take: 3 }),
    db.question.findFirst({ where: { imageUrl: { not: null } }, orderBy: [{ ticketId: "asc" }, { position: "asc" }], include: { answers: { orderBy: { position: "asc" } } } }),
  ]);

  const offered = new Set(courses.flatMap((c) => c.category.match(/[A-E]E?/g) ?? []));
  const stats = [
    { v: s.statGraduates, suffix: "+", label: d.stats.graduates },
    { v: s.statPassRate, suffix: "%", label: d.stats.passRate },
    { v: s.statYears, suffix: "", label: d.stats.years },
    { v: s.statCars, suffix: "", label: d.stats.cars },
  ].filter((x) => x.v > 0);

  return (
    <>
      {/* HERO */}
      <section className="bg-asphalt text-white">
        <div className="container-x grid items-center gap-12 pb-14 pt-12 lg:grid-cols-[1.2fr_0.8fr] lg:pb-20 lg:pt-20">
          <div>
            <h1 className="max-w-[16ch] font-display text-[2.4rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.6rem]">
              {pick(s, "heroTitle", lang)}
            </h1>
            <p className="mt-5 max-w-[46ch] text-lg text-white/75">{pick(s, "heroText", lang)}</p>
            <div className="mt-8 max-w-2xl">
              <p className="mb-3 text-[15px] text-white/90">{d.hero.form}</p>
              <LeadForm lang={lang} variant="hero" phone={s.phone} />
            </div>
          </div>

          {/* Удостоверение — цель обучения */}
          <div aria-hidden className="mx-auto w-full max-w-sm rotate-[-3deg] rounded-2xl bg-concrete-50 p-5 text-asphalt shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold leading-tight text-asphalt-500">
                Haydovchilik guvohnomasi
                <br />
                Водительское удостоверение
              </span>
              <span className="rounded bg-brand px-2 py-1 font-display text-xs font-semibold text-white">UZ</span>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="flex h-24 w-20 shrink-0 items-end justify-center overflow-hidden rounded-md bg-concrete-200">
                <svg viewBox="0 0 40 48" className="h-20 w-16 text-asphalt-300"><circle cx="20" cy="16" r="9" fill="currentColor" /><path d="M2 48c2-12 9-18 18-18s16 6 18 18z" fill="currentColor" /></svg>
              </div>
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 w-4/5 rounded bg-concrete-200" />
                <div className="h-2.5 w-3/5 rounded bg-concrete-200" />
                <div className="h-2.5 w-2/3 rounded bg-concrete-200" />
                <p className="pt-1 font-display text-sm font-semibold">{s.schoolName}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-6 gap-1.5">
              {ALL_CATS.map((c) => (
                <div key={c} className={`flex h-10 items-center justify-center rounded-md border-2 font-display text-sm font-semibold ${offered.has(c) ? "border-asphalt bg-white" : "border-concrete-200 text-asphalt-300"}`}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="h-14 bg-asphalt-700">
          <div className="lane lane-drive h-full" />
        </div>
      </section>

      {/* STATS */}
      {stats.length > 0 && (
        <section className="border-b border-concrete-200">
          <dl className="container-x grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4">
            {stats.map((x) => (
              <div key={x.label} className="pr-4">
                <dt className="sr-only">{x.label}</dt>
                <dd className="font-display text-3xl font-semibold tabular-nums sm:text-4xl">
                  {formatPrice(x.v)}
                  <span className="text-brand">{x.suffix}</span>
                </dd>
                <dd className="mt-1 max-w-[22ch] text-[15px] text-asphalt-500">{x.label}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* COURSES */}
      <section id="courses" className="scroll-mt-20 py-16 sm:py-20">
        <div className="container-x">
          <h2 className="h-section">{d.courses.title}</h2>
          <p className="mt-2 max-w-[60ch] text-asphalt-500">{d.courses.lead}</p>
          <ul className="mt-8 divide-y divide-concrete-200 border-y border-concrete-200">
            {courses.map((c) => (
              <li key={c.id} className={`grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-4 py-6 md:grid-cols-[auto_1fr_auto_auto] ${c.featured ? "relative" : ""}`}>
                {c.featured && <span aria-hidden className="absolute -left-4 bottom-4 top-4 w-1 rounded bg-mark sm:-left-6" />}
                <span className="plate h-14 w-16 text-xl" aria-label={`${d.courses.category} ${c.category}`}>{c.category}</span>
                <div>
                  <h3 className="text-lg font-semibold">{pick(c, "title", lang)}</h3>
                  {pick(c, "desc", lang) && <p className="mt-0.5 text-[15px] text-asphalt-500">{pick(c, "desc", lang)}</p>}
                  <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-asphalt-500">
                    {pick(c, "duration", lang) && <span>{pick(c, "duration", lang)}</span>}
                    {c.theoryHours > 0 && <span>{d.courses.theory}: {c.theoryHours} {d.courses.hours}</span>}
                    {c.practiceHours > 0 && <span>{d.courses.practice}: {c.practiceHours} {d.courses.hours}</span>}
                  </p>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-4 md:contents">
                <div className="md:text-right">
                  {c.price > 0 && (
                    <p className="font-display text-xl font-semibold tabular-nums">
                      {formatPrice(c.price)} <span className="text-base font-medium">{d.courses.sum}</span>
                    </p>
                  )}
                  {c.oldPrice && c.oldPrice > c.price && <p className="text-sm text-asphalt-300 line-through tabular-nums">{formatPrice(c.oldPrice)}</p>}
                </div>
                <div>
                  <ChooseCourseButton id={c.id} label={d.courses.choose} />
                </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-asphalt-500">{d.courses.installments}</p>
        </div>
      </section>

      {/* STEPS — реальная последовательность, поэтому с номерами */}
      <section className="bg-concrete-50 py-16 sm:py-20">
        <div className="container-x">
          <h2 className="h-section">{d.steps.title}</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {d.steps.items.map(([title, text], i) => (
              <li key={title} className="relative">
                <span className="font-display text-4xl font-semibold text-brand">{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-asphalt-500">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TRY A TEST */}
      {demoQ && (
        <section className="py-16 sm:py-20">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="h-section">{d.tryTest.title}</h2>
                <p className="mt-2 max-w-[56ch] text-asphalt-500">{d.tryTest.text}</p>
              </div>
              <Link href={`/${lang}/tests`} className="btn-ghost">{d.tryTest.all}</Link>
            </div>
            <div className="mt-8">
              <TryQuestion lang={lang} q={toQuizQuestions([demoQ], lang)[0]} />
            </div>
          </div>
        </section>
      )}

      {/* LIBRARY */}
      {books.length > 0 && (
        <section className="border-t border-concrete-200 py-16 sm:py-20">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="h-section">{d.library.title}</h2>
                <p className="mt-2 text-asphalt-500">{d.library.lead}</p>
              </div>
              <Link href={`/${lang}/library`} className="btn-ghost">{d.library.all}</Link>
            </div>
            <ul className="mt-8 grid gap-5 sm:grid-cols-3">
              {books.map((b) => (
                <li key={b.id} className="flex gap-4 rounded-xl border border-concrete-200 p-4">
                  <BookCover title={pick(b, "title", lang)} cover={b.coverUrl} />
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{pick(b, "title", lang)}</p>
                    <p className="mt-1 line-clamp-3 text-sm text-asphalt-500">{pick(b, "desc", lang)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section className="bg-concrete-50 py-16 sm:py-20">
          <div className="container-x">
            <h2 className="h-section">{d.reviews.title}</h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-xl bg-white p-6">
                  <p className="text-mark" aria-label={`${r.rating}/5`}>{"★".repeat(r.rating)}<span className="text-concrete-200">{"★".repeat(5 - r.rating)}</span></p>
                  <blockquote className="mt-3 text-[15px] leading-relaxed">{r.text}</blockquote>
                  <p className="mt-4 text-sm font-semibold">
                    {r.name}
                    {r.category && <span className="plate ml-2 h-6 px-1.5 text-xs">{r.category}</span>}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* BRANCHES */}
      {branches.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="container-x">
            <h2 className="h-section">{d.branches.title}</h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {branches.map((b) => (
                <li key={b.id} className="rounded-xl border border-concrete-200 p-6">
                  <h3 className="text-lg font-semibold">{pick(b, "name", lang)}</h3>
                  <p className="mt-1 text-asphalt-500">{pick(b, "address", lang)}</p>
                  {b.hours && <p className="mt-1 text-sm text-asphalt-500">{b.hours}</p>}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {b.phone && <a href={telHref(b.phone)} className="btn-ghost px-4 py-2">{b.phone}</a>}
                    {b.mapUrl && <a href={b.mapUrl} target="_blank" rel="noopener" className="btn-ghost px-4 py-2">{d.branches.map}</a>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="border-t border-concrete-200 py-16 sm:py-20">
          <div className="container-x max-w-3xl">
            <h2 className="h-section">{d.faq.title}</h2>
            <div className="mt-8 divide-y divide-concrete-200 border-y border-concrete-200">
              {faqs.map((f) => (
                <details key={f.id} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                    {pick(f, "question", lang)}
                    <span aria-hidden className="text-2xl leading-none text-brand transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-asphalt-700">{pick(f, "answer", lang)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SIGNUP */}
      <section id="signup" className="scroll-mt-16 bg-brand py-16 text-white sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{d.finalCta.title}</h2>
            <p className="mt-3 max-w-[44ch] text-lg text-white/80">{d.finalCta.text}</p>
            <a href={telHref(s.phone)} className="mt-6 inline-block font-display text-2xl font-semibold text-mark">{s.phone}</a>
          </div>
          <div className="rounded-2xl bg-white p-6 text-asphalt sm:p-8">
            <LeadForm lang={lang} courses={cOpts} branches={bOpts} phone={s.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
