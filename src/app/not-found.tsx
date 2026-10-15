import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-display text-6xl font-semibold">404</p>
      <p className="text-asphalt-500">Sahifa topilmadi · Страница не найдена</p>
      <Link href="/" className="btn-brand">Bosh sahifa / Главная</Link>
    </div>
  );
}
