export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex h-12 w-32 items-center rounded-lg bg-white px-2 shadow-sm ring-1 ring-slate-200" : "flex h-16 w-40 items-center rounded-lg bg-white px-3 shadow-sm ring-1 ring-slate-200"}>
      <img src="/logo-linha6uni.png" alt="Linha Uni - Linha 6 São Paulo" className="h-full w-full object-contain" />
    </div>
  );
}
