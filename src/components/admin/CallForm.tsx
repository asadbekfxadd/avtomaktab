"use client";
import { useState } from "react";
import type { LeadStatus } from "@prisma/client";
import { logCallAction } from "@/app/admin/actions";
import { STATUS, RESULT } from "@/lib/crm";
import { SubmitButton } from "./Buttons";

type R = keyof typeof RESULT;

const DEFAULT_STATUS: Record<R, LeadStatus> = { REACHED: "THINKING", NO_ANSWER: "NO_ANSWER", BUSY: "NO_ANSWER", WRONG_NUMBER: "REJECTED" };
const PRESETS = [
  { v: "2h", l: "Через 2 часа" },
  { v: "evening", l: "Сегодня в 18:00" },
  { v: "tomorrow", l: "Завтра в 10:00" },
  { v: "3d", l: "Через 3 дня" },
  { v: "custom", l: "Выбрать время" },
  { v: "none", l: "Не перезванивать" },
];

export function CallForm({ leadId, back, current }: { leadId: number; back: "queue" | "lead"; current: LeadStatus }) {
  const [result, setResult] = useState<R | null>(null);
  const [status, setStatus] = useState<LeadStatus>(current);
  const [preset, setPreset] = useState("");

  function pickResult(r: R) {
    setResult(r);
    const s = DEFAULT_STATUS[r];
    setStatus(s);
    setPreset(s === "NO_ANSWER" ? "2h" : s === "REJECTED" ? "none" : "tomorrow");
  }
  const final = status === "ENROLLED" || status === "REJECTED";

  return (
    <form action={logCallAction} className="space-y-4">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="result" value={result ?? ""} />
      <input type="hidden" name="nextPreset" value={final ? "none" : preset === "custom" ? "" : preset} />

      <div>
        <p className="a-label">Результат звонка</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(RESULT) as R[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => pickResult(r)}
              aria-pressed={result === r}
              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium ${result === r ? "border-brand bg-brand/5 text-brand" : "border-concrete-200 hover:border-asphalt-300"}`}
            >
              {RESULT[r]}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <>
          <div>
            <p className="a-label">Статус после звонка</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS) as LeadStatus[])
                .filter((s) => s !== "NEW")
                .map((s) => (
                  <label key={s} className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${status === s ? "border-asphalt bg-asphalt text-white" : "border-concrete-200 hover:border-asphalt-300"}`}>
                    <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
                    {STATUS[s].label}
                  </label>
                ))}
            </div>
          </div>

          {!final && (
            <div>
              <p className="a-label">Когда перезвонить</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.v}
                    type="button"
                    onClick={() => setPreset(p.v)}
                    className={`rounded-full border px-3 py-1 text-sm ${preset === p.v ? "border-brand bg-brand text-white" : "border-concrete-200 hover:border-asphalt-300"}`}
                  >
                    {p.l}
                  </button>
                ))}
              </div>
              {preset === "custom" && <input type="datetime-local" name="nextCallAt" required className="a-input mt-2 max-w-xs" />}
            </div>
          )}

          <div>
            <label className="a-label" htmlFor={`note-${leadId}`}>Комментарий</label>
            <textarea id={`note-${leadId}`} name="note" rows={3} className="a-input" placeholder="О чём договорились, возражения, удобное время…" />
          </div>

          <SubmitButton className="a-btn-primary w-full py-2.5 text-base">{back === "queue" ? "Сохранить и к следующему" : "Сохранить звонок"}</SubmitButton>
        </>
      )}
    </form>
  );
}
