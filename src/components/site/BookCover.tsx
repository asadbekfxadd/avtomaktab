export function BookCover({ title, cover, large = false }: { title: string; cover: string | null; large?: boolean }) {
  const size = large ? "h-40 w-28" : "h-24 w-[68px]";
  if (cover)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={cover} alt="" className={`${size} shrink-0 rounded-md object-cover shadow`} />;
  return (
    <div aria-hidden className={`${size} relative shrink-0 overflow-hidden rounded-md bg-asphalt p-2 shadow`}>
      <span className="absolute inset-y-0 left-1.5 w-px bg-white/20" />
      <p className={`pl-1.5 font-display font-semibold leading-tight text-white ${large ? "text-sm" : "text-[9px]"} line-clamp-4`}>{title}</p>
      <span className="absolute bottom-2 left-3 right-2 h-1 rounded bg-mark" />
    </div>
  );
}
