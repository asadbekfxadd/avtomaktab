import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, prettyPhone } from "@/lib/format";
import { notifyTelegram, esc } from "@/lib/telegram";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().min(9).max(30),
  courseId: z.coerce.number().int().positive().optional().nullable(),
  branchId: z.coerce.number().int().positive().optional().nullable(),
  source: z.string().max(30).optional(),
  utmSource: z.string().max(100).optional().nullable(),
  utmCampaign: z.string().max(100).optional().nullable(),
  website: z.string().optional(), // honeypot
});

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // бот

  const phone = normalizePhone(d.phone);
  if (!phone) return NextResponse.json({ ok: false, error: "phone" }, { status: 400 });

  const courseId = d.courseId || null;
  const branchId = d.branchId || null;
  const source = ["site", "tests", "library"].includes(d.source ?? "") ? d.source! : "site";

  // Повторная заявка с того же номера за сутки — обновляем, а не плодим дубли
  const dayAgo = new Date(Date.now() - 24 * 3600_000);
  const dup = await db.lead.findFirst({ where: { phone, createdAt: { gte: dayAgo } }, orderBy: { createdAt: "desc" } });

  const lead = dup
    ? await db.lead.update({
        where: { id: dup.id },
        data: {
          name: d.name,
          courseId: courseId ?? dup.courseId,
          branchId: branchId ?? dup.branchId,
          status: dup.status === "REJECTED" ? "NEW" : dup.status,
          comment: [dup.comment, "Повторная заявка с сайта"].filter(Boolean).join("\n"),
        },
        include: { course: true, branch: true },
      })
    : await db.lead.create({
        data: { name: d.name, phone, courseId, branchId, source, utmSource: d.utmSource || null, utmCampaign: d.utmCampaign || null },
        include: { course: true, branch: true },
      });

  const lines = [
    `<b>${dup ? "Повторная заявка" : "Новая заявка"}</b> #${lead.id}`,
    `${esc(lead.name)} · ${prettyPhone(lead.phone)}`,
    lead.course ? `Категория: ${esc(lead.course.category)} — ${esc(lead.course.titleRu)}` : null,
    lead.branch ? `Филиал: ${esc(lead.branch.nameRu)}` : null,
    `Источник: ${source}${lead.utmSource ? ` / ${esc(lead.utmSource)}` : ""}`,
  ].filter(Boolean);
  notifyTelegram(lines.join("\n"));

  return NextResponse.json({ ok: true });
}
