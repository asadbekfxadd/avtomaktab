import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHead, Saved } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/Buttons";
import { saveSettingsAction, testTelegramAction } from "../../actions";

export const metadata = { title: "Настройки" };

function F({ name, label, v, hint, type = "text", area }: { name: string; label: string; v: string | number | null; hint?: string; type?: string; area?: boolean }) {
  return (
    <div>
      <label className="a-label" htmlFor={name}>{label}</label>
      {area ? (
        <textarea id={name} name={name} defaultValue={v ?? ""} rows={2} className="a-input" />
      ) : (
        <input id={name} name={name} type={type} defaultValue={v ?? ""} className={type === "color" ? "h-10 w-20 cursor-pointer rounded-md border border-concrete-200" : "a-input"} />
      )}
      {hint && <p className="mt-1 text-xs text-asphalt-500">{hint}</p>}
    </div>
  );
}

function Block({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="a-card p-5 sm:p-6">
      <h2 className="font-semibold">{title}</h2>
      {sub && <p className="text-sm text-asphalt-500">{sub}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; tg?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const s = await getSettings();
  return (
    <>
      <PageHead title="Настройки" sub="Бренд, контакты и правила экзамена — всё меняется без программиста" />
      <Saved show={!!sp.saved} />
      <Saved show={!!sp.tg} text="Тестовое сообщение отправлено. Если оно не пришло — проверьте токен и ID чата." />

      <form action={saveSettingsAction} className="max-w-4xl space-y-5">
        <Block title="Бренд">
          <F name="schoolName" label="Название автошколы" v={s.schoolName} />
          <div>
            <p className="a-label">Логотип</p>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {s.logoUrl && <img src={s.logoUrl} alt="" className="h-10 w-10 rounded object-contain" />}
              <input type="file" name="logo__file" accept="image/*" className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-concrete file:px-3 file:py-2" />
            </div>
            {s.logoUrl && <label className="mt-1 flex items-center gap-1.5 text-xs text-asphalt-500"><input type="checkbox" name="logo__remove" /> удалить логотип</label>}
          </div>
          <F name="primaryColor" label="Основной цвет (кнопки, ссылки)" v={s.primaryColor} type="color" />
          <F name="accentColor" label="Акцентный цвет (разметка, выделения)" v={s.accentColor} type="color" />
        </Block>

        <Block title="Контакты">
          <F name="phone" label="Основной телефон" v={s.phone} />
          <F name="phone2" label="Дополнительный телефон" v={s.phone2} />
          <F name="email" label="Email" v={s.email} />
          <F name="licenseNo" label="Номер лицензии" v={s.licenseNo} hint="Показывается в подвале сайта" />
          <F name="telegram" label="Telegram (ссылка)" v={s.telegram} hint="https://t.me/…" />
          <F name="instagram" label="Instagram (ссылка)" v={s.instagram} />
        </Block>

        <Block title="Главный экран сайта">
          <F name="heroTitleRu" label="Заголовок (RU)" v={s.heroTitleRu} area />
          <F name="heroTitleUz" label="Sarlavha (UZ)" v={s.heroTitleUz} area />
          <F name="heroTextRu" label="Подзаголовок (RU)" v={s.heroTextRu} area />
          <F name="heroTextUz" label="Matn (UZ)" v={s.heroTextUz} area />
        </Block>

        <Block title="Цифры на сайте" sub="Оставьте 0, чтобы скрыть показатель">
          <F name="statGraduates" label="Выпускников" v={s.statGraduates} />
          <F name="statPassRate" label="Сдают с первой попытки, %" v={s.statPassRate} />
          <F name="statYears" label="Лет работы" v={s.statYears} />
          <F name="statCars" label="Учебных автомобилей" v={s.statCars} />
        </Block>

        <Block title="Экзамен на сайте">
          <F name="examQuestions" label="Вопросов в экзамене" v={s.examQuestions} />
          <F name="examMinutes" label="Время, минут" v={s.examMinutes} />
          <F name="examMaxErrors" label="Допустимо ошибок" v={s.examMaxErrors} />
        </Block>

        <Block title="Уведомления в Telegram" sub="Каждая новая заявка придёт в чат менеджеров">
          <F name="tgBotToken" label="Токен бота" v={s.tgBotToken} hint="Создайте бота у @BotFather и вставьте токен" />
          <F name="tgChatId" label="ID чата или группы" v={s.tgChatId} hint="Добавьте бота в группу; ID группы начинается с «-100»" />
        </Block>

        <div className="sticky bottom-0 -mx-1 bg-concrete-50/95 px-1 py-3 backdrop-blur">
          <SubmitButton className="a-btn-primary px-6 py-2.5">Сохранить настройки</SubmitButton>
        </div>
      </form>

      {s.tgBotToken && s.tgChatId && (
        <form action={testTelegramAction} className="mt-2">
          <button className="a-btn-ghost">Отправить тестовое уведомление</button>
        </form>
      )}
    </>
  );
}
