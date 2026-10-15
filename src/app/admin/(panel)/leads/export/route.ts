import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadWhere } from "@/lib/leadFilters";
import { STATUS, SOURCES } from "@/lib/crm";
import { prettyPhone } from "@/lib/format";

export async function GET(req: NextRequest) {
  const u = await getSession();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const leads = await db.lead.findMany({ where: leadWhere(u, sp), orderBy: { createdAt: "desc" }, include: { course: true, branch: true, manager: true }, take: 20000 });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Заявки");
  ws.columns = [
    { header: "№", key: "id", width: 7 },
    { header: "Дата", key: "createdAt", width: 18, style: { numFmt: "dd.mm.yyyy hh:mm" } },
    { header: "Имя", key: "name", width: 24 },
    { header: "Телефон", key: "phone", width: 18 },
    { header: "Категория", key: "course", width: 22 },
    { header: "Филиал", key: "branch", width: 20 },
    { header: "Статус", key: "status", width: 16 },
    { header: "Менеджер", key: "manager", width: 18 },
    { header: "Источник", key: "source", width: 18 },
    { header: "UTM", key: "utm", width: 18 },
    { header: "Звонков", key: "calls", width: 9 },
    { header: "Комментарий", key: "comment", width: 40 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const l of leads) {
    ws.addRow({
      id: l.id,
      createdAt: new Date(l.createdAt.getTime() + 5 * 3600_000), // Ташкент
      name: l.name,
      phone: prettyPhone(l.phone),
      course: l.course ? `${l.course.category} — ${l.course.titleRu}` : "",
      branch: l.branch?.nameRu ?? "",
      status: STATUS[l.status].label,
      manager: l.manager?.name ?? "",
      source: SOURCES[l.source] ?? l.source,
      utm: [l.utmSource, l.utmCampaign].filter(Boolean).join(" / "),
      calls: l.callCount,
      comment: l.comment ?? "",
    });
  }
  ws.autoFilter = { from: "A1", to: "L1" };
  const buf = await wb.xlsx.writeBuffer();
  const name = `leads-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(buf as ArrayBuffer, {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}"` },
  });
}
