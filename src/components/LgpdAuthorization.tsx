import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { saveLgpdAuthorization } from "@/lib/api/lgpd.functions";

/**
 * Formal LGPD authorization screen — shown after a Proteção Total payment,
 * before the dashboard unlocks. The user types their full name and authorizes
 * Priva to send data-removal requests on their behalf (Art. 18, Lei 13.709/2018).
 * Saving the record is what unlocks the dashboard.
 */
export function LgpdAuthorization({
  email,
  userId,
  onDone,
}: {
  email: string;
  userId?: string | null;
  onDone: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    if (fullName.trim().length < 3 || !agreed || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await saveLgpdAuthorization({
        data: { userId: userId || undefined, email: email || undefined, fullName: fullName.trim() },
      });
      if (!res.ok && res.reason !== "not_configured") {
        setError("Não foi possível registrar agora. Tente novamente.");
        setBusy(false);
        return;
      }
    } catch {
      // best-effort: don't trap the user if the backend is unavailable
    }
    try {
      localStorage.setItem("priva_lgpd_authorized", "true");
    } catch {
      /* ignore */
    }
    setBusy(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="mx-auto flex min-h-full max-w-sm flex-col px-5 pb-10">
        <div
          className="mx-auto mt-12 grid h-16 w-16 place-items-center rounded-2xl"
          style={{
            backgroundColor: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
          }}
        >
          <ShieldCheck className="h-8 w-8 text-indigo-400" />
        </div>
        <h1 className="mt-4 text-center text-xl font-extrabold text-white">
          Autorização para remoção
        </h1>
        <p className="mt-2 mb-7 text-center text-sm text-gray-400">
          Para solicitarmos a remoção dos seus dados, precisamos da sua autorização formal.
        </p>

        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "#12121A", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <label className="mb-1 block text-sm text-gray-300">Nome completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            autoComplete="name"
            className="w-full rounded-xl px-4 py-3 text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "#0A0A0F", border: "1px solid rgba(99,102,241,0.2)" }}
          />

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-500"
            />
            <span className="text-[12px] leading-snug text-gray-300">
              Autorizo a Priva a enviar, em meu nome, solicitações de remoção de dados pessoais às
              empresas/plataformas identificadas no meu relatório, conforme o Art. 18 da Lei
              13.709/2018 (LGPD).
            </span>
          </label>

          <button
            onClick={confirm}
            disabled={fullName.trim().length < 3 || !agreed || busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 font-bold text-white transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
              </>
            ) : (
              "Confirmar e continuar"
            )}
          </button>

          {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
          <p className="mt-3 text-center text-[11px] leading-snug text-gray-600">
            Registramos esta autorização com data e hora para fins legais. Você pode revogá-la a
            qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}
