import type { Prisma, LeadStatus, User } from "@prisma/client";
import { visibleWhere, STATUS_ORDER } from "./crm";

export type LeadQuery = { q?: string; status?: string; manager?: string; course?: string; source?: string; from?: string; to?: string; page?: string };

export function leadWhere(u: Pick<User, "id" | "role">, sp: LeadQuery): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [visibleWhere(u)];
  if (sp.q) {
    const digits = sp.q.replace(/\D/g, "");
    and.push({ OR: [{ name: { contains: sp.q, mode: "insensitive" } }, ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []), ...(Number(sp.q) ? [{ id: Number(sp.q) }] : [])] });
  }
  if (sp.status && STATUS_ORDER.includes(sp.status as LeadStatus)) and.push({ status: sp.status as LeadStatus });
  if (sp.manager === "none") and.push({ managerId: null });
  else if (sp.manager) and.push({ managerId: Number(sp.manager) });
  if (sp.course) and.push({ courseId: Number(sp.course) });
  if (sp.source) and.push({ source: sp.source });
  if (sp.from) and.push({ createdAt: { gte: new Date(sp.from + "T00:00:00+05:00") } });
  if (sp.to) and.push({ createdAt: { lte: new Date(sp.to + "T23:59:59+05:00") } });
  return { AND: and };
}
