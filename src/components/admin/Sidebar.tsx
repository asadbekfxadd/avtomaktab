"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Item = { href: string; label: string; badge?: number; group?: string };

export function Sidebar({ items, school, user, logout }: { items: Item[]; school: string; user: { name: string; role: string }; logout: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  let lastGroup: string | undefined;

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4 text-sm">
      {items.map((it) => {
        const header = it.group && it.group !== lastGroup ? it.group : null;
        lastGroup = it.group;
        return (
          <div key={it.href}>
            {header && <p className="mb-1 mt-5 px-3 text-xs font-medium text-white/40">{header}</p>}
            <Link
              href={it.href}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between rounded-md px-3 py-2 ${isActive(it.href) ? "bg-white/10 font-semibold text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
            >
              {it.label}
              {!!it.badge && <span className="rounded-full bg-mark px-2 text-xs font-bold text-asphalt">{it.badge}</span>}
            </Link>
          </div>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4 text-sm">
      <p className="font-medium text-white">{user.name}</p>
      <p className="text-xs text-white/50">{user.role === "ADMIN" ? "Администратор" : "Менеджер"}</p>
      <div className="mt-3 flex gap-3 text-xs">
        <a href="/" target="_blank" className="text-white/60 hover:text-white">Открыть сайт</a>
        {logout}
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-asphalt lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-5">
          <span className="h-4 w-1 rounded-sm bg-mark" />
          <span className="truncate font-display text-sm font-semibold text-white">{school}</span>
        </div>
        {nav}
        {footer}
      </aside>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-asphalt px-4 lg:hidden">
        <span className="font-display text-sm font-semibold text-white">{school}</span>
        <button onClick={() => setOpen(!open)} className="rounded-md px-3 py-1.5 text-sm text-white ring-1 ring-white/20" aria-expanded={open}>
          Меню
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 top-14 z-30 flex flex-col bg-asphalt lg:hidden">
          {nav}
          {footer}
        </div>
      )}
    </>
  );
}
