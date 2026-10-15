import type { Lead, User, Course, Branch } from "@prisma/client";
import { saveLeadAction } from "@/app/admin/actions";
import { STATUS, STATUS_ORDER, SOURCES } from "@/lib/crm";
import { prettyPhone } from "@/lib/format";
import { SubmitButton } from "./Buttons";

function toLocalInput(d: Date | null) {
  if (!d) return "";
  return new Date(d.getTime() + 5 * 3600_000).toISOString().slice(0, 16);
}

export function LeadEditForm({ lead, managers, courses, branches, me }: { lead?: Lead; managers: User[]; courses: Course[]; branches: Branch[]; me: User }) {
  return (
    <form action={saveLeadAction} className="grid gap-4 sm:grid-cols-2">
      {lead && <input type="hidden" name="id" value={lead.id} />}
      <div>
        <label className="a-label" htmlFor="name">Имя</label>
        <input id="name" name="name" defaultValue={lead?.name} required className="a-input" />
      </div>
      <div>
        <label className="a-label" htmlFor="phone">Телефон</label>
        <input id="phone" name="phone" defaultValue={lead ? prettyPhone(lead.phone) : "+998 "} required className="a-input" inputMode="tel" />
      </div>
      <div>
        <label className="a-label" htmlFor="courseId">Курс</label>
        <select id="courseId" name="courseId" defaultValue={lead?.courseId ?? ""} className="a-input">
          <option value="">Не выбран</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.category} — {c.titleRu}</option>)}
        </select>
      </div>
      <div>
        <label className="a-label" htmlFor="branchId">Филиал</label>
        <select id="branchId" name="branchId" defaultValue={lead?.branchId ?? ""} className="a-input">
          <option value="">Не выбран</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.nameRu}</option>)}
        </select>
      </div>
      <div>
        <label className="a-label" htmlFor="status">Статус</label>
        <select id="status" name="status" defaultValue={lead?.status ?? "NEW"} className="a-input">
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
      </div>
      <div>
        <label className="a-label" htmlFor="source">Источник</label>
        <select id="source" name="source" defaultValue={lead?.source ?? "call"} className="a-input">
          {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="a-label" htmlFor="managerId">Менеджер</label>
        <select id="managerId" name="managerId" defaultValue={lead ? lead.managerId ?? "" : me.id} className="a-input" disabled={me.role !== "ADMIN" && !!lead?.managerId && lead.managerId !== me.id}>
          <option value="">Не назначен</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="a-label" htmlFor="nextCallAt">Перезвонить (время Ташкента)</label>
        <input id="nextCallAt" type="datetime-local" name="nextCallAt" defaultValue={toLocalInput(lead?.nextCallAt ?? null)} className="a-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="a-label" htmlFor="comment">Комментарий</label>
        <textarea id="comment" name="comment" rows={3} defaultValue={lead?.comment ?? ""} className="a-input" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{lead ? "Сохранить изменения" : "Создать заявку"}</SubmitButton>
      </div>
    </form>
  );
}
