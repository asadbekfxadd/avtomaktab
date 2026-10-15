import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me-please-32chars");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    const pref = req.cookies.get("lang")?.value;
    const lang = pref === "ru" ? "ru" : "uz";
    return NextResponse.redirect(new URL(`/${lang}`, req.url));
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("am_session")?.value;
    let ok = false;
    if (token) {
      try {
        await jwtVerify(token, secret());
        ok = true;
      } catch {}
    }
    if (!ok) return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const headers = new Headers(req.headers);
  const seg = pathname.split("/")[1];
  headers.set("x-lang", seg === "ru" ? "ru" : seg === "uz" ? "uz" : "ru");
  headers.set("x-path", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next|api|signs|favicon.ico|.*\\..*).*)"],
};
