"use client";
import { useActionState } from "react";
import { importQuestionsAction } from "../../actions";

export function ImportBox() {
  const [state, action, pending] = useActionState(importQuestionsAction, null);
  return (
    <form action={action} className="a-card space-y-3 p-4">
      <p className="text-sm font-semibold">Импорт из Excel</p>
      <p className="text-xs text-asphalt-500">Заполните шаблон: один вопрос — одна строка. Билеты и темы создадутся сами.</p>
      <input type="file" name="file" accept=".xlsx" required className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-concrete file:px-2 file:py-1.5" />
      <label className="flex items-start gap-2 text-xs text-asphalt-500">
        <input type="checkbox" name="replace" className="mt-0.5" /> Заменить все текущие вопросы и билеты
      </label>
      <button className="a-btn-primary w-full" disabled={pending}>{pending ? "Загружаем…" : "Загрузить"}</button>
      {state?.ok && <p className="text-sm font-medium text-go">{state.ok}</p>}
      {state?.error && <p className="whitespace-pre-line text-sm text-stop">{state.error}</p>}
    </form>
  );
}
