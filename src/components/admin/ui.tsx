import type { LeadStatus } from "@prisma/client";
import { STATUS } from "@/lib/crm";

export function StatusBadge({ s }: { s: LeadStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[s].cls}`}>{STATUS[s].label}</span>;
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-asphalt-500">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Saved({ show, text = "Сохранено" }: { show: boolean; text?: string }) {
  if (!show) return null;
  return <div role="status" className="mb-4 rounded-md bg-go/10 px-4 py-2.5 text-sm font-medium text-go">{text}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="a-card px-6 py-12 text-center text-sm text-asphalt-500">{children}</div>;
}
