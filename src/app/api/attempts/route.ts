import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({ mode: z.enum(["exam", "ticket", "topic", "mistakes"]), correct: z.number().int().min(0).max(500), total: z.number().int().min(1).max(500), passed: z.boolean() });

export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false }, { status: 400 });
  await db.testAttempt.create({ data: p.data });
  return NextResponse.json({ ok: true });
}
