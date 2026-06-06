export function TopBanner({ onScan }: { onScan: () => void }) {
  return (
    <div
      className="flex items-center justify-between border-b px-4 py-2"
      style={{ backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)" }}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span className="text-xs font-medium text-red-400">Análise pendente</span>
      </div>
      <button
        onClick={onScan}
        className="shrink-0 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        Fazer scan grátis →
      </button>
    </div>
  );
}
