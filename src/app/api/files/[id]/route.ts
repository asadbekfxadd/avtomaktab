import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await db.storedFile.findUnique({ where: { id } });
  if (!f) return new NextResponse("Not found", { status: 404 });
  const dl = req.nextUrl.searchParams.get("dl") === "1";
  return new NextResponse(new Uint8Array(f.data), {
    headers: {
      "Content-Type": f.mime,
      "Content-Length": String(f.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `${dl ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
    },
  });
}
