import type { Lang } from "./i18n";
import { pick } from "./i18n";

export type QuizQuestion = {
  id: number;
  text: string;
  image: string | null;
  explanation: string;
  answers: { id: number; text: string; correct: boolean }[];
};

type DbQ = {
  id: number; textUz: string; textRu: string; imageUrl: string | null; explanationUz: string; explanationRu: string;
  answers: { id: number; textUz: string; textRu: string; isCorrect: boolean }[];
};

export function toQuizQuestions(qs: DbQ[], lang: Lang): QuizQuestion[] {
  return qs.map((q) => ({
    id: q.id,
    text: pick(q, "text", lang),
    image: q.imageUrl,
    explanation: pick(q, "explanation", lang),
    answers: q.answers.map((a) => ({ id: a.id, text: pick(a, "text", lang), correct: a.isCorrect })),
  }));
}

export function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
