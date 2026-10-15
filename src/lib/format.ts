export function formatPrice(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n).replace(/ /g, " ");
}

/** Normalizes any Uzbek phone input to +998XXXXXXXXX, or null if invalid */
export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  let n = d;
  if (n.length === 9) n = "998" + n;
  if (n.length !== 12 || !n.startsWith("998")) return null;
  return "+" + n;
}

export function prettyPhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.length !== 12) return p;
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
}

export function telHref(p: string) {
  return "tel:" + p.replace(/[^\d+]/g, "");
}

export function hexToRgb(hex: string) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return "29 95 191";
  return m.slice(1).map((x) => parseInt(x, 16)).join(" ");
}

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const x = new Date(d);
  return x.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" });
}

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Tashkent" });
}
