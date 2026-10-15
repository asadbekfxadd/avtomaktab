"use client";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type Opt = { id: number; label: string };

function maskPhone(raw: string) {
  // «+998 » — фиксированный префикс; остальное — 9 цифр номера
  const rest = raw.startsWith("+998") ? raw.slice(4) : raw;
  let d = rest.replace(/\D/g, "");
  if (d.length > 9 && d.startsWith("998")) d = d.slice(3); // вставили номер целиком
  d = d.slice(0, 9);
  const p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return "+998 " + p.join(" ");
}

export const PICK_COURSE_EVENT = "pick-course";

export function LeadForm({
  lang,
  courses = [],
  branches = [],
  variant = "full",
  source = "site",
  phone,
}: {
  lang: Lang;
  courses?: Opt[];
  branches?: Opt[];
  variant?: "hero" | "full";
  source?: string;
  phone: string;
}) {
  const d = t(lang).form;
  const [name, setName] = useState("");
  const [tel, setTel] = useState("+998 ");
  const [courseId, setCourseId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: Event) => setCourseId(String((e as CustomEvent<number>).detail));
    window.addEventListener(PICK_COURSE_EVENT, h);
    return () => window.removeEventListener(PICK_COURSE_EVENT, h);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (name.trim().length < 2) return setErr(d.errName);
    if (tel.replace(/\D/g, "").length !== 12) return setErr(d.errPhone);
    setErr(null);
    setState("sending");
    const q = new URLSearchParams(window.location.search);
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: tel,
          courseId: courseId ? Number(courseId) : null,
          branchId: branchId ? Number(branchId) : null,
          source,
          utmSource: q.get("utm_source"),
          utmCampaign: q.get("utm_campaign"),
          website: fd.get("website") || "",
        }),
      });
      if (!r.ok) throw new Error();
      setState("ok");
    } catch {
      setState("error");
    }
  }

  const dark = variant === "hero";

  if (state === "ok") {
    return (
      <div role="status" className={`rounded-xl p-6 ${dark ? "bg-white/10 text-white" : "bg-go/10 text-asphalt"}`}>
        <p className="font-display text-xl font-semibold">{d.okTitle}</p>
        <p className={`mt-2 ${dark ? "text-white/80" : "text-asphalt-700"}`}>{d.okText}</p>
        <a href={`/${lang}/tests`} className={`${dark ? "btn-mark" : "btn-brand"} mt-4`}>{t(lang).nav.tests}</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={variant === "hero" ? "grid gap-3 sm:grid-cols-[1fr_1fr_auto]" : "grid gap-3"}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="sr-only" htmlFor={`n-${variant}`}>{d.name}</label>
      <input id={`n-${variant}`} className="field" placeholder={d.name} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
      <label className="sr-only" htmlFor={`p-${variant}`}>{d.phone}</label>
      <input
        id={`p-${variant}`}
        className="field"
        inputMode="tel"
        autoComplete="tel"
        value={tel}
        onChange={(e) => setTel(maskPhone(e.target.value))}
        onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
      />
      {variant === "full" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-asphalt-500" htmlFor="c-full">{d.course}</label>
            <select id="c-full" className="field" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">{d.anyCourse}</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          {branches.length > 0 && (
            <div>
              <label className="mb-1 block text-sm text-asphalt-500" htmlFor="b-full">{d.branch}</label>
              <select id="b-full" className="field" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">{d.anyBranch}</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
      <button className={dark ? "btn-mark whitespace-nowrap" : "btn-brand"} disabled={state === "sending"}>
        {state === "sending" ? d.sending : variant === "hero" ? t(lang).hero.cta : d.submit}
      </button>
      {(err || state === "error") && (
        <p role="alert" className={`text-sm ${dark ? "sm:col-span-3" : ""} ${dark ? "text-mark" : "text-stop"}`}>
          {err ?? <>{d.errServer} <a className="underline" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a></>}
        </p>
      )}
      <p className={`text-xs ${dark ? "text-white/50 sm:col-span-3" : "text-asphalt-300"}`}>{d.privacy}</p>
    </form>
  );
}

export function ChooseCourseButton({ id, label }: { id: number; label: string }) {
  return (
    <button
      type="button"
      className="btn-ghost px-4 py-2"
      onClick={() => {
        window.dispatchEvent(new CustomEvent(PICK_COURSE_EVENT, { detail: id }));
        document.getElementById("signup")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {label}
    </button>
  );
}
