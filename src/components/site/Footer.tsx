import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { t, pick } from "@/lib/i18n";
import { Logo } from "./Logo";
import { telHref } from "@/lib/format";

type S = { schoolName: string; logoUrl: string | null; phone: string; phone2: string | null; email: string | null; instagram: string | null; telegram: string | null; licenseNo: string | null };
type B = { id: number; nameUz: string; nameRu: string; addressUz: string; addressRu: string };

export function Footer({ lang, s, branches }: { lang: Lang; s: S; branches: B[] }) {
  const d = t(lang);
  return (
    <footer className="bg-asphalt text-white">
      <div className="lane h-1.5 opacity-80" aria-hidden />
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo name={s.schoolName} logoUrl={s.logoUrl} dark />
          <div className="mt-5 space-y-1 text-[15px]">
            <a href={telHref(s.phone)} className="block text-lg font-semibold hover:text-mark">{s.phone}</a>
            {s.phone2 && <a href={telHref(s.phone2)} className="block text-asphalt-300 hover:text-white">{s.phone2}</a>}
            {s.email && <a href={`mailto:${s.email}`} className="block text-asphalt-300 hover:text-white">{s.email}</a>}
          </div>
          <div className="mt-4 flex gap-4 text-sm font-medium">
            {s.telegram && <a href={s.telegram} target="_blank" rel="noopener" className="text-asphalt-300 hover:text-white">Telegram</a>}
            {s.instagram && <a href={s.instagram} target="_blank" rel="noopener" className="text-asphalt-300 hover:text-white">Instagram</a>}
          </div>
        </div>
        <div>
          <p className="font-semibold">{d.branches.title}</p>
          <ul className="mt-3 space-y-3 text-sm text-asphalt-300">
            {branches.map((b) => (
              <li key={b.id}>
                <span className="block text-white">{pick(b, "name", lang)}</span>
                {pick(b, "address", lang)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <ul className="space-y-2 text-[15px]">
            <li><Link href={`/${lang}#courses`} className="text-asphalt-300 hover:text-white">{d.nav.courses}</Link></li>
            <li><Link href={`/${lang}/tests`} className="text-asphalt-300 hover:text-white">{d.nav.tests}</Link></li>
            <li><Link href={`/${lang}/library`} className="text-asphalt-300 hover:text-white">{d.nav.library}</Link></li>
            <li><Link href={`/${lang}/contacts`} className="text-asphalt-300 hover:text-white">{d.nav.contacts}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-1 py-5 text-xs text-asphalt-300 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {s.schoolName}. {d.footer.rights}</span>
          {s.licenseNo && <span>{d.footer.license} {s.licenseNo}</span>}
        </div>
      </div>
    </footer>
  );
}
