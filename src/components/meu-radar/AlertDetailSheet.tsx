import { X, Trash2 } from "lucide-react";
import { openCheckout, MP_DEFESA_URL } from "@/lib/funnel";

export type AlertDetail = {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  origem: string;
  data: string;
  dados: string;
  level: "ALTO" | "MÉDIO" | "BAIXO";
  meaning: string;
};

const lvlStyle = (l: string) =>
  l === "ALTO"
    ? { color: "#F87171", bg: "rgba(239,68,68,0.2)" }
    : l === "MÉDIO"
    ? { color: "#FBBF24", bg: "rgba(245,158,11,0.2)" }
    : { color: "#34D399", bg: "rgba(34,197,94,0.2)" };

const ACTIONS = [
  "Troque a senha deste serviço imediatamente",
  "Ative autenticação em dois fatores",
  "Verifique outros serviços com a mesma senha",
];

export function AlertDetailSheet({ alert, onClose }: { alert: AlertDetail; onClose: () => void }) {
  const Icon = alert.Icon;
  const lvl = lvlStyle(alert.level);
  const rows = [
    { label: "Origem", value: alert.origem },
    { label: "Data", value: alert.data },
    { label: "Dados expostos", value: alert.dados },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="flex h-[75vh] w-full flex-col rounded-t-3xl animate-sheet-up"
        style={{ backgroundColor: "#0A0A0F", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-1 mt-3 h-1 w-10 rounded-full bg-gray-700" />
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: `${lvl.bg}` }}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-semibold text-white">{alert.title}</p>
              <span className="text-[11px] font-bold" style={{ color: lvl.color }}>{alert.level} RISCO</span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="grid h-8 w-8 place-items-center rounded-full bg-gray-800 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* detail rows */}
          <div className="rounded-xl px-4 py-2" style={{ backgroundColor: "#12121A" }}>
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
                <span className="text-sm text-gray-400">{r.label}</span>
                <span className="text-sm font-medium text-white">{r.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-400">Risco</span>
              <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ color: lvl.color, backgroundColor: lvl.bg }}>{alert.level}</span>
            </div>
          </div>

          {/* meaning */}
          <p className="mt-5 font-medium text-white">O que isso significa?</p>
          <div className="mt-2 rounded-xl px-4 py-3 text-sm leading-relaxed text-gray-300" style={{ backgroundColor: "#12121A" }}>
            {alert.meaning}
          </div>

          {/* actions */}
          <p className="mt-5 font-medium text-white">O que fazer agora?</p>
          <div className="mt-2 space-y-2">
            {ACTIONS.map((act, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#12121A" }}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">{i + 1}</span>
                <span className="flex-1 text-sm text-gray-200">{act}</span>
              </div>
            ))}
          </div>

          {/* remove CTA */}
          <div className="mt-5 rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#1a0a2e,#2d1a4e)", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div className="flex items-center gap-2">
              <Trash2 className="h-[18px] w-[18px] text-red-400" />
              <p className="text-base font-semibold text-white">Remover seus dados desta base</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Solicitar exclusão oficial via LGPD. Processo iniciado em até 48h.
            </p>
            <button
              onClick={() => openCheckout(MP_DEFESA_URL)}
              className="mt-4 w-full rounded-xl py-4 font-bold text-white"
              style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}
            >
              Solicitar remoção — R$29,90/mês →
            </button>
            <p className="mt-2 text-center text-xs text-gray-600">Cancele quando quiser · LGPD garantida</p>
          </div>
        </div>
      </div>
    </div>
  );
}
