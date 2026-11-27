import { afterEach, describe, expect, it, vi } from "vitest";
import { jwtSecret } from "@/lib/secret";
import { clientIp, rateLimited, resetLimit } from "@/lib/rate";
import { pwStamp } from "@/lib/auth";

afterEach(() => { vi.unstubAllEnvs(); });

describe("jwtSecret", () => {
  it("в продакшене без JWT_SECRET не подставляет известное значение", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("JWT_SECRET", "");
    expect(() => jwtSecret()).toThrow(/JWT_SECRET/);
  });
  it("в продакшене короткий секрет отклоняется", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("JWT_SECRET", "short");
    expect(() => jwtSecret()).toThrow();
  });
  it("в продакшене длинный секрет принимается", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("JWT_SECRET", "x".repeat(40));
    expect(jwtSecret().length).toBe(40);
  });
  it("в разработке запасной секрет остаётся", () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("JWT_SECRET", "");
    expect(jwtSecret().length).toBeGreaterThan(20);
  });
});

describe("rateLimited", () => {
  it("пропускает max попыток, потом блокирует, resetLimit снимает", () => {
    const k = "t:" + Math.random();
    expect([1, 2, 3].map(() => rateLimited(k, 3, 60_000))).toEqual([false, false, false]);
    expect(rateLimited(k, 3, 60_000)).toBe(true);
    resetLimit(k);
    expect(rateLimited(k, 3, 60_000)).toBe(false);
  });
  it("после окна снова пускает", () => {
    vi.useFakeTimers();
    const k = "w:" + Math.random();
    rateLimited(k, 1, 1000);
    expect(rateLimited(k, 1, 1000)).toBe(true);
    vi.advanceTimersByTime(1500);
    expect(rateLimited(k, 1, 1000)).toBe(false);
    vi.useRealTimers();
  });
});

describe("clientIp", () => {
  const h = (o: Record<string, string>) => ({ get: (n: string) => o[n] ?? null });
  it("берёт X-Real-IP", () => expect(clientIp(h({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9, 5.5.5.5" }))).toBe("1.2.3.4"));
  it("без него берёт последний адрес цепочки, а не подделанный первый", () => expect(clientIp(h({ "x-forwarded-for": "9.9.9.9, 5.5.5.5" }))).toBe("5.5.5.5"));
  it("без заголовков — local", () => expect(clientIp(h({}))).toBe("local"));
});

describe("pwStamp", () => {
  it("меняется вместе с паролем и не раскрывает хэш", () => {
    expect(pwStamp("hash-a")).toBe(pwStamp("hash-a"));
    expect(pwStamp("hash-a")).not.toBe(pwStamp("hash-b"));
    expect(pwStamp("hash-a")).not.toContain("hash");
  });
});
