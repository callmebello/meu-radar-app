import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { getRemovalRequest } from "@/lib/api/removal.functions";

type Status = "pending" | "sent" | "waiting" | "resolved" | "escalated";
const STATUS: Record<Status, { badge: string; badgeCls: string; desc: string }> = {
  pending: { badge: "Recebido", badgeCls: "bg-white/15 text-gray-200", desc: "Nossa equipe está preparando sua solicitação" },
  sent: { badge: "Enviado", badgeCls: "bg-indigo-500/25 text-indigo-200", desc: "Carta LGPD enviada · aguardando resposta das empresas" },
  waiting: { badge: "Aguardando", badgeCls: "bg-amber-500/25 text-amber-200", desc: "" },
  resolved: { badge: "Concluído ✓", badgeCls: "bg-emerald-500/25 text-emerald-200", desc: "Seus dados foram removidos" },
  escalated: { badge: "Em escalonamento", badgeCls: "bg-red-500/25 text-red-200", desc: "Sem resposta — reenvio em andamento" },
};
const fmt = (s?: string) => (s ? new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "");

/**
 * Persistent Proteção Total case tracker — shown above the score for
 * protecao_total users. Reads the case from localStorage for instant display,
 * then refreshes the live status from the server (admin updates it).
 */
export function ProtecaoTrackingCard() {
  const [caseId, setCaseId] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem("priva_case_id") || "" : ""));
  const [status, setStatus] = useState<Status>(() => ((typeof window !== "undefined" ? localStorage.getItem("priva_case_status") : "") as Status) || "pending");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [history, setHistory] = useState(false);

  useEffect(() => {
    (async () => {
      const userId = localStorage.getItem("priva_user_id");
      const email = sessionStorage.getItem("priva_email");
      try {
        const res = await getRemovalRequest({ data: { userId, email } });
        if (res.found && res.caseId) {
          setCaseId(res.caseId);
          setStatus((res.status as Status) || "pending");
          setUpdatedAt(res.updatedAt || "");
          setCreatedAt(res.createdAt || "");
          localStorage.setItem("priva_case_id", res.caseId);
          localStorage.setItem("priva_case_status", res.status || "pending");
        }
      } catch {
        /* keep the localStorage snapshot */
      }
    })();
  }, []);

  if (!caseId) return null;
  const s = STATUS[status];
  const dayX = status === "waiting" ? Math.min(15, Math.max(1, Math.ceil((Date.now() - new Date(updatedAt || createdAt || Date.now()).getTime()) / 86_400_000))) : 0;

  return (
    <>
      <div className="rounded-2xl border border-purple-500/20 p-4 text-white" style={{ background: "linear-gradient(135deg,#1a0a2e,#2d1264)" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 shrink-0 text-purple-300" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">Proteção Total — Caso {caseId}</p>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.badgeCls}`}>{s.badge}</span>
        </div>

        {status === "waiting" ? (
          <div className="mt-3">
            <p className="text-xs text-gray-300">Dia {dayX} de 15 — prazo legal</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${(dayX / 15) * 100}%` }} />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-300">
            {status === "sent" && updatedAt ? `Carta LGPD enviada em ${fmt(updatedAt)} · aguardando resposta` : s.desc}
          </p>
        )}

        <button onClick={() => setHistory(true)} className="mt-3 text-xs font-semibold text-purple-300">
          Ver histórico completo →
        </button>
      </div>

      {history && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => setHistory(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl" style={{ backgroundColor: "#0A0A0F" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">Caso {caseId}</p>
              <button onClick={() => setHistory(false)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mt-5 pl-4">
              {[
                { c: "#22C55E", done: true, title: "Solicitação recebida", desc: fmt(createdAt) || "Registrado" },
                { c: status === "pending" ? "#6B7280" : "#6366F1", done: status !== "pending", title: "Carta LGPD enviada às fontes", desc: status === "pending" ? "Em preparação (até 48h)" : `Enviado em ${fmt(updatedAt)}` },
                { c: ["waiting", "resolved", "escalated"].includes(status) ? "#F59E0B" : "#6B7280", done: ["waiting", "resolved", "escalated"].includes(status), title: "Aguardando resposta das empresas", desc: "Prazo legal de 15 dias úteis" },
                { c: status === "resolved" ? "#22C55E" : "#6B7280", done: status === "resolved", title: "Dados removidos", desc: status === "resolved" ? "Concluído ✓" : "Você será notificado por e-mail" },
              ].map((t, i, arr) => (
                <div key={i} className="relative mb-5 pl-6">
                  {i < arr.length - 1 && <span className="absolute left-[3px] top-4 h-full w-px bg-white/10" />}
                  <span className="absolute left-[-2px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full" style={{ backgroundColor: t.done ? t.c : "transparent", border: t.done ? "none" : `2px solid ${t.c}` }} />
                  <p className="text-sm font-bold text-white">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
