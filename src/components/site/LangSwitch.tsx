"use client";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";

export function LangSwitch({ lang }: { lang: Lang }) {
  const path = usePathname() || `/${lang}`;
  const to = (l: Lang) => "/" + l + path.replace(/^\/(uz|ru)/, "");
  const set = (l: Lang) => {
    document.cookie = `lang=${l};path=/;max-age=31536000`;
  };
  return (
    <div className="flex rounded-lg border border-concrete-200 p-0.5 text-sm font-semibold" role="group" aria-label="Til / Язык">
      {(["uz", "ru"] as Lang[]).map((l) => (
        <a
          key={l}
          href={to(l)}
          onClick={() => set(l)}
          aria-current={l === lang ? "true" : undefined}
          className={`rounded-md px-2.5 py-1 ${l === lang ? "bg-asphalt text-white" : "text-asphalt-500 hover:text-asphalt"}`}
        >
          {l === "uz" ? "UZ" : "RU"}
        </a>
      ))}
    </div>
  );
}
