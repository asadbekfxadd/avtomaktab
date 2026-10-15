"use client";
import { useState } from "react";
import Link from "next/link";
import { telHref } from "@/lib/format";

export function MobileMenu({ links, phone, signup }: { links: { href: string; label: string }[]; phone: string; signup: { href: string; label: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-concrete-200"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
          {open ? (
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-concrete-200 bg-white shadow-lg">
          <nav className="container-x flex flex-col py-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-concrete py-3 text-lg font-medium">
                {l.label}
              </Link>
            ))}
            <a href={telHref(phone)} className="py-3 text-lg font-semibold text-brand">
              {phone}
            </a>
            <Link href={signup.href} onClick={() => setOpen(false)} className="btn-brand mt-2">
              {signup.label}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
