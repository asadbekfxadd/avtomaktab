import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import { t, pick } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getBranches, courseOptions, branchOptions } from "@/lib/site";
import { telHref } from "@/lib/format";
import { LeadForm } from "@/components/site/LeadForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).contacts.title };
}

export default async function Contacts({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang);
  const [s, branches, cOpts, bOpts] = await Promise.all([getSettings(), getBranches(), courseOptions(lang), branchOptions(lang)]);
  return (
    <div className="container-x grid gap-12 py-10 sm:py-14 lg:grid-cols-[1fr_420px]">
      <div>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{d.contacts.title}</h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={telHref(s.phone)} className="btn-brand">{d.contacts.call}: {s.phone}</a>
          {s.telegram && <a href={s.telegram} target="_blank" rel="noopener" className="btn-ghost">{d.contacts.write}</a>}
        </div>
        <ul className="mt-10 space-y-6">
          {branches.map((b) => (
            <li key={b.id} className="border-t border-concrete-200 pt-6">
              <h2 className="text-lg font-semibold">{pick(b, "name", lang)}</h2>
              <p className="mt-1 text-asphalt-700">{pick(b, "address", lang)}</p>
              {b.hours && <p className="text-sm text-asphalt-500">{b.hours}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
                {b.phone && <a href={telHref(b.phone)} className="text-brand">{b.phone}</a>}
                {b.mapUrl && <a href={b.mapUrl} target="_blank" rel="noopener" className="text-brand">{d.branches.map}</a>}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="h-fit rounded-2xl border border-concrete-200 p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">{d.nav.signup}</h2>
        <div className="mt-5">
          <LeadForm lang={lang} courses={cOpts} branches={bOpts} phone={s.phone} />
        </div>
      </div>
    </div>
  );
}
