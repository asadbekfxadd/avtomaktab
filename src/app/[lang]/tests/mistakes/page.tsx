import type { Lang } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { courseOptions } from "@/lib/site";
import { MistakesQuiz } from "@/components/site/Mistakes";

export const metadata = { robots: { index: false } };

export default async function MistakesPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const [s, courses] = await Promise.all([getSettings(), courseOptions(lang)]);
  return <MistakesQuiz lang={lang} phone={s.phone} courses={courses} />;
}
