import type { Metadata } from "next";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import { t, pick } from "@/lib/i18n";
import { BookCover } from "@/components/site/BookCover";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).library.title };
}

const LANG_LABEL: Record<string, string> = { uz: "Oʻzbekcha", ru: "Русский", both: "UZ / RU" };

export default async function Library({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang).library;
  const books = await db.book.findMany({ where: { published: true }, orderBy: [{ sort: "asc" }, { id: "desc" }] });
  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">{d.title}</h1>
      <p className="mt-2 max-w-[60ch] text-asphalt-500">{d.lead}</p>
      {books.length === 0 ? (
        <p className="mt-10 text-asphalt-500">{d.empty}</p>
      ) : (
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {books.map((b) => (
            <li key={b.id} className="flex gap-5 rounded-2xl border border-concrete-200 p-5">
              <BookCover title={pick(b, "title", lang)} cover={b.coverUrl} large />
              <div className="flex min-w-0 flex-col">
                <h2 className="text-lg font-semibold leading-snug">{pick(b, "title", lang)}</h2>
                {b.author && <p className="text-sm text-asphalt-500">{b.author}</p>}
                <p className="mt-2 text-[15px] text-asphalt-700">{pick(b, "desc", lang)}</p>
                <p className="mt-2 text-xs text-asphalt-300">{LANG_LABEL[b.lang] ?? b.lang}</p>
                {b.fileUrl && (
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <a href={`/api/books/${b.id}`} target="_blank" rel="noopener" className="btn-brand px-4 py-2">{d.open}</a>
                    <a href={`/api/books/${b.id}?dl=1`} className="btn-ghost px-4 py-2">{d.download}</a>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
