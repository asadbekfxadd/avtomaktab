import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getResource } from "@/lib/resources";
import { formatPrice } from "@/lib/format";
import { PageHead, Saved, Empty } from "@/components/admin/ui";

type Row = Record<string, unknown> & { id: number };

function cell(v: unknown, name: string) {
  if (typeof v === "boolean") return v ? <span className="text-go">Да</span> : <span className="text-asphalt-300">Нет</span>;
  if (typeof v === "number") return name === "price" ? formatPrice(v) : v;
  if (v == null || v === "") return <span className="text-asphalt-300">—</span>;
  const s = String(v);
  return s.length > 90 ? s.slice(0, 90) + "…" : s;
}

export default async function ResourceList({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { resource } = await params;
  const sp = await searchParams;
  const res = getResource(resource);
  if (!res) notFound();
  const rows = (await (db as unknown as Record<string, { findMany: (a: object) => Promise<Row[]> }>)[res.model].findMany({ orderBy: res.orderBy })) as Row[];

  return (
    <>
      <PageHead title={res.title} sub={`Всего: ${rows.length}`}>
        <Link href={`/admin/r/${res.key}/new`} className="a-btn-primary">Добавить {res.single}</Link>
      </PageHead>
      <Saved show={!!sp.saved} />
      {rows.length === 0 ? (
        <Empty>Здесь пока пусто. Нажмите «Добавить {res.single}».</Empty>
      ) : (
        <div className="a-card overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-concrete-200 bg-concrete-50">
              <tr>
                {res.columns.map((c) => <th key={c.name} className="a-th">{c.label}</th>)}
                <th className="a-th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-concrete-200">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-concrete-50">
                  {res.columns.map((c, i) => (
                    <td key={c.name} className={`a-td ${i === 0 ? "font-medium" : ""}`}>
                      {i === 0 ? <Link href={`/admin/r/${res.key}/${r.id}`} className="hover:text-brand">{cell(r[c.name], c.name)}</Link> : cell(r[c.name], c.name)}
                    </td>
                  ))}
                  <td className="a-td text-right"><Link href={`/admin/r/${res.key}/${r.id}`} className="text-sm text-brand">Изменить</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
