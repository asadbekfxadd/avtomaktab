import type { LeadStatus, CallResult, Prisma, User } from "@prisma/client";

export const STATUS: Record<LeadStatus, { label: string; cls: string }> = {
  NEW: { label: "Новая", cls: "bg-brand/10 text-brand" },
  NO_ANSWER: { label: "Не дозвонились", cls: "bg-mark/25 text-asphalt" },
  CALLBACK: { label: "Перезвонить", cls: "bg-orange-100 text-orange-800" },
  THINKING: { label: "Думает", cls: "bg-violet-100 text-violet-800" },
  ENROLLED: { label: "Записан", cls: "bg-go/15 text-go" },
  REJECTED: { label: "Отказ", cls: "bg-concrete text-asphalt-500" },
};
export const STATUS_ORDER: LeadStatus[] = ["NEW", "NO_ANSWER", "CALLBACK", "THINKING", "ENROLLED", "REJECTED"];

export const RESULT: Record<CallResult, string> = {
  REACHED: "Дозвонился",
  NO_ANSWER: "Не взял трубку",
  BUSY: "Занято / сбросил",
  WRONG_NUMBER: "Неверный номер",
};

export const SOURCES: Record<string, string> = {
  site: "Сайт",
  tests: "Сайт — после теста",
  library: "Сайт — библиотека",
  instagram: "Instagram",
  telegram: "Telegram",
  call: "Входящий звонок",
  walkin: "Пришёл в офис",
  referral: "Рекомендация",
  other: "Другое",
};

/** Кого видит пользователь: админ — всех, менеджер — свои и нераспределённые */
export function visibleWhere(u: Pick<User, "id" | "role">): Prisma.LeadWhereInput {
  return u.role === "ADMIN" ? {} : { OR: [{ managerId: u.id }, { managerId: null }] };
}

/** Очередь обзвона: новые + все, кому пора перезвонить */
export function queueWhere(u: Pick<User, "id" | "role">, now = new Date()): Prisma.LeadWhereInput {
  return {
    AND: [
      visibleWhere(u),
      {
        OR: [
          { status: "NEW" },
          { status: { in: ["NO_ANSWER", "CALLBACK", "THINKING"] }, OR: [{ nextCallAt: null }, { nextCallAt: { lte: now } }] },
        ],
      },
    ],
  };
}

export function ago(d: Date) {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ч назад`;
  const days = Math.round(h / 24);
  return `${days} дн назад`;
}
