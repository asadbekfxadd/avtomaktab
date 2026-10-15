import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHead, Saved } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/Buttons";
import { saveUserAction } from "../../actions";
import type { User } from "@prisma/client";

export const metadata = { title: "Сотрудники" };

function UserForm({ u }: { u?: User }) {
  return (
    <form action={saveUserAction} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto]">
      {u && <input type="hidden" name="id" value={u.id} />}
      <div>
        <label className="a-label">Имя</label>
        <input name="name" defaultValue={u?.name} required className="a-input" />
      </div>
      <div>
        <label className="a-label">Логин</label>
        <input name="login" defaultValue={u?.login} required className="a-input" autoComplete="off" />
      </div>
      <div>
        <label className="a-label">{u ? "Новый пароль" : "Пароль"}</label>
        <input name="password" type="password" placeholder={u ? "не менять" : "минимум 6 символов"} required={!u} minLength={u ? undefined : 6} className="a-input" autoComplete="new-password" />
      </div>
      <div>
        <label className="a-label">Роль</label>
        <select name="role" defaultValue={u?.role ?? "MANAGER"} className="a-input">
          <option value="MANAGER">Менеджер</option>
          <option value="ADMIN">Администратор</option>
        </select>
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={u ? u.active : true} /> Активен
      </label>
      <SubmitButton>{u ? "Сохранить" : "Добавить"}</SubmitButton>
    </form>
  );
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const users = await db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  return (
    <>
      <PageHead title="Сотрудники" sub="Менеджеры видят только свои и нераспределённые заявки. Администратор видит всё." />
      <Saved show={!!sp.saved} />
      <section className="a-card mb-6 p-5">
        <h2 className="mb-3 font-semibold">Новый сотрудник</h2>
        <UserForm />
      </section>
      <div className="space-y-3">
        {users.map((u) => (
          <section key={u.id} className={`a-card p-5 ${u.active ? "" : "opacity-60"}`}>
            <UserForm u={u} />
          </section>
        ))}
      </div>
    </>
  );
}
