"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="a-card mx-auto max-w-lg p-6">
      <h1 className="text-lg font-semibold">Не удалось выполнить действие</h1>
      <p className="mt-2 text-sm text-asphalt-500">
        {process.env.NODE_ENV === "development" ? error.message : "Проверьте заполненные поля и попробуйте снова. Если ошибка повторяется — обратитесь к администратору."}
      </p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => history.back()} className="a-btn-ghost">Назад</button>
        <button onClick={reset} className="a-btn-primary">Повторить</button>
      </div>
    </div>
  );
}
