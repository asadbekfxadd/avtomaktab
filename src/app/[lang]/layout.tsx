import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getBranches } from "@/lib/site";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [s, branches] = await Promise.all([getSettings(), getBranches()]);
  return (
    <>
      <Header lang={lang} name={s.schoolName} logoUrl={s.logoUrl} phone={s.phone} />
      <main>{children}</main>
      <Footer lang={lang} s={s} branches={branches} />
    </>
  );
}
