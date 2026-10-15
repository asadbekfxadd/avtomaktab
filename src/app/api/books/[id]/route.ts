import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Считает скачивание и перенаправляет на файл */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await db.book.findUnique({ where: { id: Number(id) } });
  if (!book?.fileUrl || !book.published) return NextResponse.redirect(new URL("/", req.url));
  await db.book.update({ where: { id: book.id }, data: { downloads: { increment: 1 } } });
  const dl = req.nextUrl.searchParams.get("dl") === "1";
  const target = book.fileUrl.startsWith("/api/files/") && dl ? `${book.fileUrl}?dl=1` : book.fileUrl;
  return NextResponse.redirect(new URL(target, req.url));
}
