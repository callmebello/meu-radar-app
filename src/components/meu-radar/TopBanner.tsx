export function TopBanner({ onScan }: { onScan: () => void }) {
  return (
    <div
      className="flex items-center gap-3 border-b px-4 py-3"
      style={{ backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)" }}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      <p className="flex-1 text-sm font-medium text-red-400">
        Análise pendente — toque em Scan para verificar
      </p>
      <button onClick={onScan} className="shrink-0 text-sm font-medium text-indigo-400">
        Scan →
      </button>
    </div>
  );
}
