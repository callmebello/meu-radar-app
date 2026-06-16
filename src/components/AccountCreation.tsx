import { useEffect, useState } from "react";
import { CircleCheck } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { signUpWithPassword, signInWithEmail } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { markUserPaid } from "@/lib/api/account.functions";
import { track } from "@/lib/analytics";

/**
 * Post-payment account creation. Appears once when the user returns from
 * Mercado Pago (URL ?payment=... or localStorage priva_is_paid) and has no
 * account yet. Lets them set a password, request a magic link, or skip.
 */
export function AccountCreation() {
  const { setIsPremium } = useApp();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const paidNow = status === "success" || status === "approved" || status === "1";
    const isPaid = localStorage.getItem("priva_is_paid") === "true";
    const hasAccount = localStorage.getItem("priva_has_account") === "true";
    const prompted = localStorage.getItem("priva_account_prompted") === "true";

    if ((paidNow || isPaid) && !hasAccount && !prompted) {
      try {
        localStorage.setItem("priva_is_paid", "true");
      } catch {
        /* ignore */
      }
      setIsPremium(true);
      if (paidNow) track("Purchase", { value: 9.9, currency: "BRL" });
      setEmail(sessionStorage.getItem("priva_email") || "");
      setShow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;

  const finishAccount = () => {
    try {
      localStorage.setItem("priva_has_account", "true");
      localStorage.setItem("priva_account_prompted", "true");
    } catch {
      /* ignore */
    }
    setIsPremium(true);
    setShow(false);
  };

  const skip = () => {
    try {
      localStorage.setItem("priva_account_prompted", "true");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const createAccount = async () => {
    if (password.length < 8) {
      setError("A senha precisa ter ao menos 8 caracteres.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: e } = await signUpWithPassword(email, password);
    if (e) {
      setError(e.message);
      setBusy(false);
      return;
    }
    try {
      await markUserPaid({ data: { email, plan: localStorage.getItem("priva_plan") || "essencial" } });
    } catch {
      /* best-effort */
    }
    setBusy(false);
    finishAccount();
  };

  const sendMagicLink = async () => {
    setBusy(true);
    setError("");
    const { error: e } = await signInWithEmail(email);
    setBusy(false);
    if (e) setError(e.message);
    else setLinkSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="mx-auto flex min-h-full max-w-sm flex-col px-5 pb-10">
        <div className="mx-auto mt-12 grid h-20 w-20 animate-[scan-pop_0.5s_ease-out] place-items-center rounded-full bg-green-500/15">
          <CircleCheck className="h-12 w-12 text-green-400" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-white">Proteção ativada!</h1>
        <p className="mt-2 mb-8 text-center text-sm text-gray-400">Crie sua conta para acessar sempre</p>

        <div className="rounded-2xl p-5" style={{ backgroundColor: "#12121A", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="mb-1 text-xs text-gray-400">Seu e-mail</p>
          <p className="mb-4 rounded-lg px-3 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#1a1a2e" }}>
            {email || "—"}
          </p>

          <label className="mb-1 block text-sm text-gray-300">Criar senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full rounded-xl px-4 py-3 text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "#0A0A0F", border: "1px solid rgba(99,102,241,0.2)" }}
          />

          <button
            onClick={createAccount}
            disabled={busy}
            className="mt-3 w-full rounded-xl bg-indigo-600 py-4 font-bold text-white transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "Criando..." : "Criar minha conta →"}
          </button>

          <p className="my-3 text-center text-xs text-gray-600">ou</p>

          <button
            onClick={sendMagicLink}
            disabled={busy}
            className="w-full rounded-xl border border-white/10 bg-transparent py-3 text-sm text-gray-300 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            Receber link de acesso por e-mail
          </button>

          {linkSent && <p className="mt-3 text-center text-sm text-green-400">Link enviado para {email} ✓</p>}
          {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
          {!isSupabaseConfigured && (
            <p className="mt-3 text-center text-[11px] text-gray-600">
              (Conta indisponível até configurar o Supabase — use “Pular por agora”.)
            </p>
          )}

          <p onClick={skip} className="mt-4 cursor-pointer text-center text-xs text-gray-600">
            Pular por agora →
          </p>
        </div>
      </div>
    </div>
  );
}
