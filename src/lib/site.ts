import { cache } from "react";
import { db } from "./db";
import type { Lang } from "./i18n";
import { pick } from "./i18n";

export const getCourses = cache(() => db.course.findMany({ where: { active: true }, orderBy: [{ sort: "asc" }, { id: "asc" }] }));
export const getBranches = cache(() => db.branch.findMany({ where: { active: true }, orderBy: [{ sort: "asc" }, { id: "asc" }] }));

export async function courseOptions(lang: Lang) {
  return (await getCourses()).map((c) => ({ id: c.id, label: `${c.category} — ${pick(c, "title", lang)}` }));
}
export async function branchOptions(lang: Lang) {
  return (await getBranches()).map((b) => ({ id: b.id, label: pick(b, "name", lang) }));
}
