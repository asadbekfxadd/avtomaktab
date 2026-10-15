import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isLang } from "@/lib/i18n";
import { toQuizQuestions } from "@/lib/quiz";

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 200);
  const l = req.nextUrl.searchParams.get("lang") ?? "ru";
  const lang = isLang(l) ? l : "ru";
  if (!ids.length) return NextResponse.json([]);
  const qs = await db.question.findMany({ where: { id: { in: ids } }, include: { answers: { orderBy: { position: "asc" } } } });
  return NextResponse.json(toQuizQuestions(qs, lang));
}
