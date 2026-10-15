export function Logo({ name, logoUrl, dark = false }: { name: string; logoUrl?: string | null; dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-9 w-9 rounded-md object-contain" />
      ) : (
        <span aria-hidden className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-asphalt ${dark ? "ring-1 ring-white/25" : ""}`}>
          <span className="absolute left-1/2 top-[5px] h-[11px] w-[5px] -translate-x-1/2 rounded-sm bg-mark" />
          <span className="absolute bottom-[5px] left-1/2 h-[11px] w-[5px] -translate-x-1/2 rounded-sm bg-mark" />
        </span>
      )}
      <span className={`font-display text-[17px] font-semibold tracking-tight ${dark ? "text-white" : "text-asphalt"}`}>{name}</span>
    </span>
  );
}
