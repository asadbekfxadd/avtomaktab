/** Ограничитель попыток в памяти (один сервер на Railway). Ключ — например «login:IP:логин». */
const hits = new Map<string, number[]>();

export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return true; }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return false;
}

export function resetLimit(key: string) { hits.delete(key); }

/** Первый адрес в X-Forwarded-For присылает сам клиент, его можно подделать. Берём X-Real-IP от прокси Railway или последний адрес цепочки. */
export function clientIp(h: { get(name: string): string | null }): string {
  const real = (h.get("x-real-ip") || "").trim();
  if (real) return real;
  const chain = (h.get("x-forwarded-for") || "").split(",").map((x) => x.trim()).filter(Boolean);
  return chain[chain.length - 1] || "local";
}
