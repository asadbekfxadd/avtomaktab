import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getResource, type Field } from "@/lib/resources";
import { PageHead } from "@/components/admin/ui";
import { SubmitButton, ConfirmSubmit } from "@/components/admin/Buttons";
import { saveResourceAction, deleteResourceAction } from "../../../../actions";

type Row = Record<string, unknown> & { id: number };

const DEFAULTS: Record<string, unknown> = { active: true, published: true, rating: 5, lang: "both" };

function Input({ f, v }: { f: Field; v: unknown }) {
  const id = `f-${f.name}`;
  if (f.type === "bool")
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name={f.name} defaultChecked={Boolean(v)} className="h-4 w-4 accent-[rgb(var(--brand))]" />
        {f.label}
      </label>
    );
  const label = <label className="a-label" htmlFor={id}>{f.label}{f.required && " *"}</label>;
  if (f.type === "textarea")
    return <div>{label}<textarea id={id} name={f.name} rows={4} defaultValue={String(v ?? "")} required={f.required} className="a-input" /></div>;
  if (f.type === "select")
    return (
      <div>
        {label}
        <select id={id} name={f.name} defaultValue={String(v ?? "")} className="a-input">
          {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  if (f.type === "file" || f.type === "image") {
    const url = (v as string | null) ?? "";
    return (
      <div className="rounded-lg border border-dashed border-concrete-200 p-4">
        {label}
        {url && (
          <div className="mb-3 flex items-center gap-3 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {f.type === "image" && <img src={url} alt="" className="h-16 w-12 rounded object-cover" />}
            <a href={url} target="_blank" className="text-brand underline">Текущий файл</a>
            <label className="flex items-center gap-1.5 text-asphalt-500"><input type="checkbox" name={`${f.name}__remove`} /> удалить</label>
          </div>
        )}
        <input type="file" name={`${f.name}__file`} accept={f.type === "image" ? "image/*" : f.accept} className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-concrete file:px-3 file:py-2 file:text-sm file:font-medium" />
        {f.type === "file" && <input name={f.name} defaultValue={url.startsWith("/api/files/") ? "" : url} placeholder="https://… (ссылка вместо загрузки)" className="a-input mt-2" />}
        {f.type === "image" && <input type="hidden" name={f.name} value={url} />}
        {f.hint && <p className="mt-1.5 text-xs text-asphalt-500">{f.hint}</p>}
      </div>
    );
  }
  return (
    <div>
      {label}
      <input id={id} name={f.name} type={f.type === "number" ? "text" : "text"} inputMode={f.type === "number" ? "numeric" : undefined} defaultValue={v == null ? "" : String(v)} required={f.required} className="a-input" />
      {f.hint && <p className="mt-1 text-xs text-asphalt-500">{f.hint}</p>}
    </div>
  );
}

export default async function ResourceEdit({ params }: { params: Promise<{ resource: string; id: string }> }) {
  await requireAdmin();
  const { resource, id } = await params;
  const res = getResource(resource);
  if (!res) notFound();
  const isNew = id === "new";
  const row = isNew ? null : ((await (db as unknown as Record<string, { findUnique: (a: object) => Promise<Row | null> }>)[res.model].findUnique({ where: { id: Number(id) || -1 } })) as Row | null);
  if (!isNew && !row) notFound();
  const val = (f: Field) => (row ? row[f.name] : DEFAULTS[f.name] ?? (f.type === "number" && f.name !== "oldPrice" ? 0 : ""));

  return (
    <>
      <Link href={`/admin/r/${res.key}`} className="text-sm text-asphalt-500 hover:text-brand">{res.title}</Link>
      <PageHead title={isNew ? `Новый: ${res.single}` : "Редактирование"} />
      <div className="a-card max-w-4xl p-5 sm:p-6">
        <form action={saveResourceAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="_resource" value={res.key} />
          {row && <input type="hidden" name="_id" value={row.id} />}
          {res.fields.map((f) => (
            <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
              <Input f={f} v={val(f)} />
            </div>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <SubmitButton>Сохранить</SubmitButton>
            <Link href={`/admin/r/${res.key}`} className="a-btn-ghost">Отмена</Link>
          </div>
        </form>
      </div>
      {row && (
        <form action={deleteResourceAction} className="mt-4">
          <input type="hidden" name="_resource" value={res.key} />
          <input type="hidden" name="_id" value={row.id} />
          <ConfirmSubmit message="Удалить безвозвратно?">Удалить</ConfirmSubmit>
        </form>
      )}
    </>
  );
}
