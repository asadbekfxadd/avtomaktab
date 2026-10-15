/**
 * Описание простых справочников для универсального CRUD в админке.
 * Чтобы добавить новую сущность — достаточно описать её здесь.
 */
export type FieldType = "text" | "textarea" | "number" | "bool" | "select" | "file" | "image";
export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
  half?: boolean;
  accept?: string;
  numeric?: boolean;
};
export type Resource = {
  key: string;
  model: "course" | "branch" | "faq" | "review" | "book" | "topic";
  title: string;
  single: string;
  fields: Field[];
  columns: { name: string; label: string }[];
  orderBy: Record<string, "asc" | "desc">[];
  adminOnly?: boolean;
};

export const RESOURCES: Resource[] = [
  {
    key: "courses",
    model: "course",
    title: "Курсы и цены",
    single: "курс",
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    columns: [
      { name: "category", label: "Категория" },
      { name: "titleRu", label: "Название" },
      { name: "price", label: "Цена, сум" },
      { name: "active", label: "На сайте" },
    ],
    fields: [
      { name: "category", label: "Категория (A, B, BC…)", type: "text", required: true, half: true },
      { name: "price", label: "Цена, сум", type: "number", half: true },
      { name: "titleRu", label: "Название (RU)", type: "text", required: true, half: true },
      { name: "titleUz", label: "Название (UZ)", type: "text", required: true, half: true },
      { name: "descRu", label: "Описание (RU)", type: "textarea", half: true },
      { name: "descUz", label: "Описание (UZ)", type: "textarea", half: true },
      { name: "durationRu", label: "Срок (RU), напр. «3 месяца»", type: "text", half: true },
      { name: "durationUz", label: "Срок (UZ), напр. «3 oy»", type: "text", half: true },
      { name: "theoryHours", label: "Теория, часов", type: "number", half: true },
      { name: "practiceHours", label: "Практика, часов", type: "number", half: true },
      { name: "oldPrice", label: "Старая цена (зачёркнутая)", type: "number", half: true },
      { name: "sort", label: "Порядок", type: "number", half: true },
      { name: "featured", label: "Выделить как популярный", type: "bool" },
      { name: "active", label: "Показывать на сайте", type: "bool" },
    ],
  },
  {
    key: "branches",
    model: "branch",
    title: "Филиалы",
    single: "филиал",
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    columns: [
      { name: "nameRu", label: "Название" },
      { name: "addressRu", label: "Адрес" },
      { name: "phone", label: "Телефон" },
      { name: "active", label: "На сайте" },
    ],
    fields: [
      { name: "nameRu", label: "Название (RU)", type: "text", required: true, half: true },
      { name: "nameUz", label: "Название (UZ)", type: "text", required: true, half: true },
      { name: "addressRu", label: "Адрес (RU)", type: "text", required: true, half: true },
      { name: "addressUz", label: "Адрес (UZ)", type: "text", required: true, half: true },
      { name: "phone", label: "Телефон", type: "text", half: true },
      { name: "hours", label: "Часы работы", type: "text", half: true },
      { name: "mapUrl", label: "Ссылка на карту (Яндекс/Google)", type: "text" },
      { name: "sort", label: "Порядок", type: "number", half: true },
      { name: "active", label: "Показывать на сайте", type: "bool" },
    ],
  },
  {
    key: "books",
    model: "book",
    title: "Библиотека",
    single: "книгу",
    orderBy: [{ sort: "asc" }, { id: "desc" }],
    columns: [
      { name: "titleRu", label: "Название" },
      { name: "lang", label: "Язык" },
      { name: "downloads", label: "Открытий" },
      { name: "published", label: "На сайте" },
    ],
    fields: [
      { name: "titleRu", label: "Название (RU)", type: "text", required: true, half: true },
      { name: "titleUz", label: "Название (UZ)", type: "text", required: true, half: true },
      { name: "descRu", label: "Описание (RU)", type: "textarea", half: true },
      { name: "descUz", label: "Описание (UZ)", type: "textarea", half: true },
      { name: "author", label: "Автор", type: "text", half: true },
      {
        name: "lang",
        label: "Язык книги",
        type: "select",
        half: true,
        options: [
          { value: "uz", label: "Узбекский" },
          { value: "ru", label: "Русский" },
          { value: "both", label: "Оба языка" },
        ],
      },
      { name: "fileUrl", label: "Файл книги (PDF, до 25 МБ)", type: "file", accept: "application/pdf,.pdf,.epub,.doc,.docx", hint: "Или вставьте ссылку на внешний файл" },
      { name: "coverUrl", label: "Обложка", type: "image", hint: "Если не загрузить — нарисуем обложку автоматически" },
      { name: "sort", label: "Порядок", type: "number", half: true },
      { name: "published", label: "Показывать на сайте", type: "bool" },
    ],
  },
  {
    key: "topics",
    model: "topic",
    title: "Темы вопросов",
    single: "тему",
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    columns: [
      { name: "nameRu", label: "Тема" },
      { name: "nameUz", label: "Mavzu" },
    ],
    fields: [
      { name: "nameRu", label: "Название (RU)", type: "text", required: true, half: true },
      { name: "nameUz", label: "Название (UZ)", type: "text", required: true, half: true },
      { name: "sort", label: "Порядок", type: "number", half: true },
    ],
  },
  {
    key: "faq",
    model: "faq",
    title: "Частые вопросы",
    single: "вопрос",
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    columns: [{ name: "questionRu", label: "Вопрос" }],
    fields: [
      { name: "questionRu", label: "Вопрос (RU)", type: "text", required: true, half: true },
      { name: "questionUz", label: "Вопрос (UZ)", type: "text", required: true, half: true },
      { name: "answerRu", label: "Ответ (RU)", type: "textarea", required: true, half: true },
      { name: "answerUz", label: "Ответ (UZ)", type: "textarea", required: true, half: true },
      { name: "sort", label: "Порядок", type: "number", half: true },
    ],
  },
  {
    key: "reviews",
    model: "review",
    title: "Отзывы",
    single: "отзыв",
    orderBy: [{ createdAt: "desc" }],
    columns: [
      { name: "name", label: "Имя" },
      { name: "text", label: "Отзыв" },
      { name: "published", label: "На сайте" },
    ],
    fields: [
      { name: "name", label: "Имя ученика", type: "text", required: true, half: true },
      { name: "category", label: "Категория", type: "text", half: true },
      { name: "text", label: "Текст отзыва", type: "textarea", required: true },
      {
        name: "rating",
        label: "Оценка",
        type: "select",
        numeric: true,
        half: true,
        options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: "★".repeat(n) })),
      },
      { name: "published", label: "Показывать на сайте", type: "bool" },
    ],
  },
];

export const getResource = (key: string) => RESOURCES.find((r) => r.key === key);
