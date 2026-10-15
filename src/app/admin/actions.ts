"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { CallResult, LeadStatus, Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { createSession, requireAdmin, requireUser, SESSION_COOKIE } from "@/lib/auth";
import { normalizePhone } from "@/lib/format";
import { getResource } from "@/lib/resources";
import { visibleWhere } from "@/lib/crm";
import { notifyTelegram } from "@/lib/telegram";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const strOrNull = (fd: FormData, k: string) => str(fd, k) || null;
const intOrNull = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (!v) return null;
  const n = Number(v.replace(/\s/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
};

const MAX_FILE = 25 * 1024 * 1024;

async function saveUpload(f: FormDataEntryValue | null): Promise<string | null> {
  if (!f || typeof f === "string" || f.size === 0) return null;
  if (f.size > MAX_FILE) throw new Error("Файл больше 25 МБ");
  const data = Buffer.from(await f.arrayBuffer());
  const row = await db.storedFile.create({ data: { name: f.name || "file", mime: f.type || "application/octet-stream", size: data.length, data } });
  return `/api/files/${row.id}`;
}

async function deleteStored(url: string | null | undefined) {
  if (url?.startsWith("/api/files/")) await db.storedFile.deleteMany({ where: { id: url.slice("/api/files/".length) } });
}

/* ---------------- auth ---------------- */

export async function loginAction(_: unknown, fd: FormData) {
  const login = str(fd, "login");
  const password = str(fd, "password");
  const u = await db.user.findUnique({ where: { login } });
  if (!u || !u.active || !(await bcrypt.compare(password, u.passwordHash))) return { error: "Неверный логин или пароль", login };
  await createSession({ uid: u.id, role: u.role, name: u.name });
  redirect(u.role === "ADMIN" ? "/admin" : "/admin/calls");
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ---------------- leads ---------------- */

const STATUSES: LeadStatus[] = ["NEW", "NO_ANSWER", "CALLBACK", "THINKING", "ENROLLED", "REJECTED"];
const RESULTS: CallResult[] = ["REACHED", "NO_ANSWER", "BUSY", "WRONG_NUMBER"];

function parseNextCall(fd: FormData): Date | null | undefined {
  const preset = str(fd, "nextPreset");
  const now = new Date();
  if (preset === "none") return null;
  if (preset === "2h") return new Date(now.getTime() + 2 * 3600_000);
  if (preset === "evening") {
    // сегодня 18:00 по Ташкенту (UTC+5)
    const d = new Date(now);
    d.setUTCHours(13, 0, 0, 0);
    return d > now ? d : new Date(now.getTime() + 2 * 3600_000);
  }
  if (preset === "tomorrow") {
    const d = new Date(now.getTime() + 24 * 3600_000);
    d.setUTCHours(5, 0, 0, 0); // 10:00 Ташкент
    return d;
  }
  if (preset === "3d") {
    const d = new Date(now.getTime() + 3 * 24 * 3600_000);
    d.setUTCHours(5, 0, 0, 0);
    return d;
  }
  const custom = str(fd, "nextCallAt");
  if (custom) return new Date(custom + ":00+05:00");
  return undefined;
}

async function assertCanAccess(leadId: number) {
  const u = await requireUser();
  const lead = await db.lead.findFirst({ where: { AND: [{ id: leadId }, visibleWhere(u)] } });
  if (!lead) throw new Error("Нет доступа к заявке");
  return { u, lead };
}

export async function logCallAction(fd: FormData) {
  const leadId = Number(str(fd, "leadId"));
  const { u, lead } = await assertCanAccess(leadId);
  const result = str(fd, "result") as CallResult;
  if (!RESULTS.includes(result)) throw new Error("Выберите результат звонка");
  let status = str(fd, "status") as LeadStatus;
  if (!STATUSES.includes(status)) status = result === "REACHED" ? "THINKING" : result === "WRONG_NUMBER" ? "REJECTED" : "NO_ANSWER";
  let nextCallAt = parseNextCall(fd);
  if (nextCallAt === undefined) {
    if (status === "NO_ANSWER") nextCallAt = new Date(Date.now() + 2 * 3600_000);
    else if (status === "ENROLLED" || status === "REJECTED") nextCallAt = null;
    else nextCallAt = lead.nextCallAt;
  }
  if (status === "ENROLLED" || status === "REJECTED") nextCallAt = null;
  const note = strOrNull(fd, "note");

  await db.$transaction([
    db.callLog.create({ data: { leadId, userId: u.id, result, statusAfter: status, note } }),
    db.lead.update({
      where: { id: leadId },
      data: {
        status,
        nextCallAt,
        lastCallAt: new Date(),
        callCount: { increment: 1 },
        managerId: lead.managerId ?? u.id,
      },
    }),
  ]);

  if (status === "ENROLLED" && lead.status !== "ENROLLED") notifyTelegram(`✅ <b>Записан</b>: ${lead.name} (#${lead.id}) — менеджер ${u.name}`);

  revalidatePath("/admin", "layout");
  const back = str(fd, "back");
  if (back === "queue") redirect("/admin/calls");
  redirect(`/admin/leads/${leadId}`);
}

export async function saveLeadAction(fd: FormData) {
  const u = await requireUser();
  const id = Number(str(fd, "id")) || null;
  if (id) await assertCanAccess(id);
  const phone = normalizePhone(str(fd, "phone"));
  if (!phone) throw new Error("Неверный номер телефона");
  const status = str(fd, "status") as LeadStatus;
  const managerRaw = intOrNull(fd, "managerId");
  const data = {
    name: str(fd, "name") || "Без имени",
    phone,
    status: STATUSES.includes(status) ? status : "NEW",
    source: str(fd, "source") || "call",
    comment: strOrNull(fd, "comment"),
    courseId: intOrNull(fd, "courseId"),
    branchId: intOrNull(fd, "branchId"),
    managerId: u.role === "ADMIN" ? managerRaw : managerRaw === u.id || managerRaw === null ? managerRaw : u.id,
    nextCallAt: str(fd, "nextCallAt") ? new Date(str(fd, "nextCallAt") + ":00+05:00") : null,
  };
  const lead = id ? await db.lead.update({ where: { id }, data }) : await db.lead.create({ data: { ...data, managerId: data.managerId ?? u.id } });
  revalidatePath("/admin", "layout");
  redirect(`/admin/leads/${lead.id}?saved=1`);
}

export async function deleteLeadAction(fd: FormData) {
  await requireAdmin();
  await db.lead.delete({ where: { id: Number(str(fd, "id")) } });
  revalidatePath("/admin", "layout");
  redirect("/admin/leads");
}

export async function takeLeadAction(fd: FormData) {
  const u = await requireUser();
  const id = Number(str(fd, "id"));
  await db.lead.updateMany({ where: { id, managerId: null }, data: { managerId: u.id } });
  revalidatePath("/admin", "layout");
  redirect(`/admin/calls?id=${id}`);
}

/* ---------------- generic resources ---------------- */

type Delegate = {
  create: (a: { data: Record<string, unknown> }) => Promise<{ id: number }>;
  update: (a: { where: { id: number }; data: Record<string, unknown> }) => Promise<{ id: number }>;
  delete: (a: { where: { id: number } }) => Promise<unknown>;
  findUnique: (a: { where: { id: number } }) => Promise<Record<string, unknown> | null>;
};
const delegate = (model: string) => (db as unknown as Record<string, Delegate>)[model];

export async function saveResourceAction(fd: FormData) {
  await requireAdmin();
  const res = getResource(str(fd, "_resource"));
  if (!res) throw new Error("Неизвестный раздел");
  const id = Number(str(fd, "_id")) || null;
  const prev = id ? await delegate(res.model).findUnique({ where: { id } }) : null;
  const data: Record<string, unknown> = {};
  for (const f of res.fields) {
    if (f.type === "bool") data[f.name] = fd.get(f.name) === "on";
    else if (f.type === "number") {
      const n = intOrNull(fd, f.name);
      data[f.name] = f.name === "oldPrice" ? n : n ?? 0;
    } else if (f.type === "file" || f.type === "image") {
      const uploaded = await saveUpload(fd.get(f.name + "__file"));
      const link = str(fd, f.name);
      const old = (prev?.[f.name] as string | null) ?? null;
      if (uploaded) {
        data[f.name] = uploaded;
        if (old !== uploaded) await deleteStored(old);
      } else if (fd.get(f.name + "__remove") === "on") {
        data[f.name] = null;
        await deleteStored(old);
      } else data[f.name] = link || null;
    } else if (f.type === "select" && f.numeric) data[f.name] = Number(str(fd, f.name)) || 0;
    else {
      const v = str(fd, f.name);
      if (f.required && !v) throw new Error(`Заполните поле «${f.label}»`);
      data[f.name] = v === "" && !f.required && ["phone", "hours", "mapUrl", "author", "category"].includes(f.name) ? null : v;
    }
  }
  if (id) await delegate(res.model).update({ where: { id }, data });
  else await delegate(res.model).create({ data });
  revalidatePath("/", "layout");
  redirect(`/admin/r/${res.key}?saved=1`);
}

export async function deleteResourceAction(fd: FormData) {
  await requireAdmin();
  const res = getResource(str(fd, "_resource"));
  if (!res) throw new Error("Неизвестный раздел");
  const id = Number(str(fd, "_id"));
  const prev = await delegate(res.model).findUnique({ where: { id } });
  for (const f of res.fields) if (f.type === "file" || f.type === "image") await deleteStored(prev?.[f.name] as string | null);
  await delegate(res.model).delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect(`/admin/r/${res.key}`);
}

/* ---------------- questions ---------------- */

export async function saveQuestionAction(fd: FormData) {
  await requireAdmin();
  const id = Number(str(fd, "id")) || null;
  const answers: { textRu: string; textUz: string; isCorrect: boolean; position: number }[] = [];
  const correct = Number(str(fd, "correct"));
  for (let i = 1; i <= 6; i++) {
    const ru = str(fd, `a${i}Ru`);
    const uz = str(fd, `a${i}Uz`);
    if (!ru && !uz) continue;
    answers.push({ textRu: ru || uz, textUz: uz || ru, isCorrect: correct === i, position: answers.length + 1 });
  }
  if (answers.length < 2) throw new Error("Нужно минимум 2 варианта ответа");
  if (!answers.some((a) => a.isCorrect)) throw new Error("Отметьте правильный ответ");

  const prev = id ? await db.question.findUnique({ where: { id } }) : null;
  let imageUrl = strOrNull(fd, "imageUrl");
  const up = await saveUpload(fd.get("image__file"));
  if (up) imageUrl = up;
  if (fd.get("image__remove") === "on") imageUrl = null;
  if (prev?.imageUrl && prev.imageUrl !== imageUrl) await deleteStored(prev.imageUrl);

  const data = {
    textRu: str(fd, "textRu") || str(fd, "textUz"),
    textUz: str(fd, "textUz") || str(fd, "textRu"),
    explanationRu: str(fd, "explanationRu"),
    explanationUz: str(fd, "explanationUz"),
    ticketId: intOrNull(fd, "ticketId"),
    topicId: intOrNull(fd, "topicId"),
    position: intOrNull(fd, "position") ?? 0,
    imageUrl,
  };
  if (!data.textRu) throw new Error("Введите текст вопроса");

  const q = id
    ? await db.$transaction(async (tx) => {
        await tx.answer.deleteMany({ where: { questionId: id } });
        return tx.question.update({ where: { id }, data: { ...data, answers: { create: answers } } });
      })
    : await db.question.create({ data: { ...data, answers: { create: answers } } });

  revalidatePath("/", "layout");
  redirect(`/admin/tests?ticket=${q.ticketId ?? "none"}&saved=1`);
}

export async function deleteQuestionAction(fd: FormData) {
  await requireAdmin();
  const q = await db.question.delete({ where: { id: Number(str(fd, "id")) } });
  await deleteStored(q.imageUrl);
  revalidatePath("/", "layout");
  redirect(`/admin/tests?ticket=${q.ticketId ?? "none"}`);
}

export async function createTicketAction() {
  await requireAdmin();
  const last = await db.ticket.findFirst({ orderBy: { number: "desc" } });
  const t = await db.ticket.create({ data: { number: (last?.number ?? 0) + 1 } });
  revalidatePath("/", "layout");
  redirect(`/admin/tests?ticket=${t.id}`);
}

export async function deleteTicketAction(fd: FormData) {
  await requireAdmin();
  const id = Number(str(fd, "id"));
  if (fd.get("withQuestions") === "on") await db.question.deleteMany({ where: { ticketId: id } });
  await db.ticket.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/tests");
}

/** Импорт вопросов из Excel по шаблону (см. /admin/tests/template) */
export async function importQuestionsAction(_: unknown, fd: FormData): Promise<{ ok?: string; error?: string }> {
  await requireAdmin();
  const f = fd.get("file");
  if (!f || typeof f === "string" || f.size === 0) return { error: "Выберите файл .xlsx" };
  const replace = fd.get("replace") === "on";
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(Buffer.from(await f.arrayBuffer()) as unknown as ArrayBuffer);
  } catch {
    return { error: "Не удалось прочитать файл. Сохраните его в формате .xlsx" };
  }
  const ws = wb.worksheets[0];
  if (!ws) return { error: "В файле нет листов" };

  const header: Record<string, number> = {};
  ws.getRow(1).eachCell((c, col) => (header[String(c.text).trim().toLowerCase()] = col));
  const col = (row: ExcelJS.Row, name: string) => (header[name] ? String(row.getCell(header[name]).text ?? "").trim() : "");
  if (!header["question_ru"] && !header["question_uz"]) return { error: "Не найдены колонки question_ru / question_uz. Скачайте шаблон." };

  type Parsed = Prisma.QuestionCreateInput & { _ticket: number | null; _topic: string };
  const parsed: Parsed[] = [];
  const errors: string[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const qRu = col(row, "question_ru");
    const qUz = col(row, "question_uz");
    if (!qRu && !qUz) return;
    const answers = [];
    for (let i = 1; i <= 6; i++) {
      const ru = col(row, `answer${i}_ru`);
      const uz = col(row, `answer${i}_uz`);
      if (ru || uz) answers.push({ textRu: ru || uz, textUz: uz || ru, position: answers.length + 1, isCorrect: false });
    }
    const correct = Number(col(row, "correct"));
    if (answers.length < 2) return errors.push(`Строка ${n}: меньше двух ответов`);
    if (!correct || correct > answers.length) return errors.push(`Строка ${n}: неверный номер правильного ответа`);
    answers[correct - 1].isCorrect = true;
    parsed.push({
      textRu: qRu || qUz,
      textUz: qUz || qRu,
      explanationRu: col(row, "explanation_ru"),
      explanationUz: col(row, "explanation_uz"),
      imageUrl: col(row, "image_url") || null,
      position: Number(col(row, "position")) || 0,
      answers: { create: answers },
      _ticket: Number(col(row, "ticket")) || null,
      _topic: col(row, "topic_ru"),
    });
  });

  if (errors.length) return { error: errors.slice(0, 8).join("\n") + (errors.length > 8 ? `\n…и ещё ${errors.length - 8}` : "") };
  if (!parsed.length) return { error: "В файле нет вопросов" };

  await db.$transaction(
    async (tx) => {
      if (replace) {
        await tx.question.deleteMany({});
        await tx.ticket.deleteMany({});
      }
      const ticketIds = new Map<number, number>();
      const topicIds = new Map<string, number>();
      const pos = new Map<number, number>();
      for (const p of parsed) {
        let ticketId: number | null = null;
        if (p._ticket) {
          if (!ticketIds.has(p._ticket)) {
            const t = await tx.ticket.upsert({ where: { number: p._ticket }, update: {}, create: { number: p._ticket } });
            ticketIds.set(p._ticket, t.id);
          }
          ticketId = ticketIds.get(p._ticket)!;
        }
        let topicId: number | null = null;
        if (p._topic) {
          if (!topicIds.has(p._topic)) {
            const existing = await tx.topic.findFirst({ where: { nameRu: p._topic } });
            const t = existing ?? (await tx.topic.create({ data: { nameRu: p._topic, nameUz: p._topic } }));
            topicIds.set(p._topic, t.id);
          }
          topicId = topicIds.get(p._topic)!;
        }
        const position = p.position || (ticketId ? (pos.get(ticketId) ?? 0) + 1 : 0);
        if (ticketId) pos.set(ticketId, position);
        const { _ticket, _topic, ...q } = p;
        void _ticket;
        void _topic;
        await tx.question.create({
          data: { ...q, position, ...(ticketId ? { ticket: { connect: { id: ticketId } } } : {}), ...(topicId ? { topic: { connect: { id: topicId } } } : {}) },
        });
      }
    },
    { timeout: 120_000 }
  );
  revalidatePath("/", "layout");
  return { ok: `Импортировано вопросов: ${parsed.length}` };
}

/* ---------------- users ---------------- */

export async function saveUserAction(fd: FormData) {
  const me = await requireAdmin();
  const id = Number(str(fd, "id")) || null;
  const password = str(fd, "password");
  const role = str(fd, "role") === "ADMIN" ? "ADMIN" : "MANAGER";
  const active = fd.get("active") === "on";
  const base = { name: str(fd, "name"), login: str(fd, "login").toLowerCase(), phone: strOrNull(fd, "phone"), role, active } as const;
  if (!base.name || !base.login) throw new Error("Заполните имя и логин");
  if (id === me.id && (!active || role !== "ADMIN")) throw new Error("Нельзя снять права или отключить самого себя");
  if (id) {
    await db.user.update({ where: { id }, data: { ...base, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) } });
  } else {
    if (password.length < 6) throw new Error("Пароль — минимум 6 символов");
    await db.user.create({ data: { ...base, passwordHash: await bcrypt.hash(password, 10) } });
  }
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=1");
}

/* ---------------- settings ---------------- */

export async function saveSettingsAction(fd: FormData) {
  await requireAdmin();
  const prev = await db.settings.findUnique({ where: { id: 1 } });
  let logoUrl = prev?.logoUrl ?? null;
  const up = await saveUpload(fd.get("logo__file"));
  if (up) {
    await deleteStored(logoUrl);
    logoUrl = up;
  } else if (fd.get("logo__remove") === "on") {
    await deleteStored(logoUrl);
    logoUrl = null;
  }
  const color = (k: string, def: string) => (/^#[0-9a-f]{6}$/i.test(str(fd, k)) ? str(fd, k) : def);
  const num = (k: string, def: number) => intOrNull(fd, k) ?? def;
  const data = {
    schoolName: str(fd, "schoolName") || "Avtomaktab",
    logoUrl,
    primaryColor: color("primaryColor", "#1D5FBF"),
    accentColor: color("accentColor", "#FFC72C"),
    phone: str(fd, "phone") || "+998",
    phone2: strOrNull(fd, "phone2"),
    email: strOrNull(fd, "email"),
    instagram: strOrNull(fd, "instagram"),
    telegram: strOrNull(fd, "telegram"),
    licenseNo: strOrNull(fd, "licenseNo"),
    heroTitleRu: str(fd, "heroTitleRu"),
    heroTitleUz: str(fd, "heroTitleUz"),
    heroTextRu: str(fd, "heroTextRu"),
    heroTextUz: str(fd, "heroTextUz"),
    statGraduates: num("statGraduates", 0),
    statPassRate: Math.min(100, num("statPassRate", 0)),
    statYears: num("statYears", 0),
    statCars: num("statCars", 0),
    examQuestions: Math.max(1, num("examQuestions", 20)),
    examMinutes: Math.max(1, num("examMinutes", 25)),
    examMaxErrors: Math.max(0, num("examMaxErrors", 2)),
    tgBotToken: strOrNull(fd, "tgBotToken"),
    tgChatId: strOrNull(fd, "tgChatId"),
  };
  await db.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

export async function testTelegramAction() {
  await requireAdmin();
  await notifyTelegram("🔔 Тестовое уведомление: заявки с сайта будут приходить сюда.");
  redirect("/admin/settings?tg=1");
}
