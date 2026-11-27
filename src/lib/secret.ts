/** Секрет подписи сессий. Без запасного значения в продакшене: известный секрет позволил бы подделать вход администратора. */
export function jwtSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!s || s.length < 32) throw new Error("Задайте JWT_SECRET (минимум 32 символа) в переменных окружения");
    return new TextEncoder().encode(s);
  }
  return new TextEncoder().encode(s || "dev-secret-change-me-please-32chars");
}
