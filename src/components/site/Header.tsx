import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Logo } from "./Logo";
import { LangSwitch } from "./LangSwitch";
import { MobileMenu } from "./MobileMenu";
import { telHref } from "@/lib/format";

export function Header({ lang, name, logoUrl, phone }: { lang: Lang; name: string; logoUrl: string | null; phone: string }) {
  const d = t(lang);
  const links = [
    { href: `/${lang}#courses`, label: d.nav.courses },
    { href: `/${lang}/tests`, label: d.nav.tests },
    { href: `/${lang}/library`, label: d.nav.library },
    { href: `/${lang}/contacts`, label: d.nav.contacts },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-concrete-200 bg-white/95 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href={`/${lang}`} aria-label={name}>
          <Logo name={name} logoUrl={logoUrl} />
        </Link>
        <nav className="hidden items-center gap-7 text-[15px] font-medium lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-asphalt-700 hover:text-brand">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href={telHref(phone)} className="hidden font-semibold text-asphalt hover:text-brand md:block">
            {phone}
          </a>
          <LangSwitch lang={lang} />
          <Link href={`/${lang}#signup`} className="btn-brand hidden px-4 py-2 sm:inline-flex">
            {d.nav.signup}
          </Link>
          <MobileMenu links={links} phone={phone} signup={{ href: `/${lang}#signup`, label: d.nav.signup }} />
        </div>
      </div>
    </header>
  );
}
