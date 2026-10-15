import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

/** Шаблон для импорта. С ?export=1 выгружает текущую базу вопросов в том же формате */
export async function GET(req: Request) {
  const u = await getSession();
  if (!u || u.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });
  const exportAll = new URL(req.url).searchParams.get("export") === "1";

  const cols = ["ticket", "position", "topic_ru", "question_ru", "question_uz"];
  for (let i = 1; i <= 5; i++) cols.push(`answer${i}_ru`, `answer${i}_uz`);
  cols.push("correct", "explanation_ru", "explanation_uz", "image_url");

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("questions");
  ws.columns = cols.map((c) => ({ header: c, key: c, width: c.startsWith("question") || c.startsWith("explanation") ? 40 : c.startsWith("answer") ? 24 : 12 }));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const qs = await db.question.findMany({
    take: exportAll ? undefined : 2,
    orderBy: [{ ticket: { number: "asc" } }, { position: "asc" }],
    include: { ticket: true, topic: true, answers: { orderBy: { position: "asc" } } },
  });
  for (const q of qs) {
    const row: Record<string, unknown> = {
      ticket: q.ticket?.number ?? "",
      position: q.position || "",
      topic_ru: q.topic?.nameRu ?? "",
      question_ru: q.textRu,
      question_uz: q.textUz,
      correct: q.answers.findIndex((a) => a.isCorrect) + 1,
      explanation_ru: q.explanationRu,
      explanation_uz: q.explanationUz,
      image_url: q.imageUrl?.startsWith("/") ? "" : q.imageUrl ?? "",
    };
    q.answers.slice(0, 5).forEach((a, i) => {
      row[`answer${i + 1}_ru`] = a.textRu;
      row[`answer${i + 1}_uz`] = a.textUz;
    });
    ws.addRow(row);
  }

  const help = wb.addWorksheet("инструкция");
  help.getColumn(1).width = 110;
  [
    "Как заполнить:",
    "• ticket — номер билета (1, 2, 3…). Пусто — вопрос попадёт в «Без билета» и будет участвовать в экзамене.",
    "• position — номер вопроса в билете. Можно не заполнять — пронумеруем по порядку строк.",
    "• topic_ru — тема (например «Дорожные знаки»). Новые темы создадутся автоматически.",
    "• question_ru / question_uz — текст вопроса. Достаточно заполнить хотя бы один язык.",
    "• answer1…answer5 — варианты ответа (минимум 2). correct — номер правильного (1–5).",
    "• image_url — ссылка на картинку (https://…). Картинку можно загрузить и позже в карточке вопроса.",
    "Импорт: Админка → Билеты ПДД → Импорт из Excel.",
  ].forEach((t, i) => (help.getCell(i + 1, 1).value = t));

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${exportAll ? "questions-export" : "questions-template"}.xlsx"`,
    },
  });
}
