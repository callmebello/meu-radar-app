import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, X } from "lucide-react";
import { signInWithPassword } from "@/lib/auth";
import { getUserPlan } from "@/lib/api/account.functions";
import { LP } from "./theme";

/**
 * Small sign-in dialog for the landing header.
 *
 * On success it hydrates the two flags the app reads on boot — the real plan
 * from Supabase and a "signed in" marker — then lands the user inside the app.
 * Returning users should never be sent back through the free-scan funnel.
 */
export function LoginDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length >= 6;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: signInError } = await signInWithPassword(email.trim(), password);
      if (signInError) {
        setError("E-mail ou senha incorretos.");
        return;
      }
      // Reflect the account's real plan — never assume paid just because
      // someone signed in.
      try {
        const plan = await getUserPlan({ data: { email: email.trim() } });
        localStorage.setItem("priva_is_paid", plan.isPaid ? "true" : "false");
        if (plan.plan) localStorage.setItem("priva_plan", plan.plan);
      } catch {
        /* best-effort */
      }
      try {
        localStorage.setItem("priva_signed_in", "true");
        sessionStorage.setItem("priva_email", email.trim());
      } catch {
        /* ignore */
      }
      onClose();
      navigate({ to: "/" });
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-xl bg-white py-3 pl-11 pr-4 text-[14px] outline-none transition-colors placeholder:text-[#A0A0AE] focus:border-indigo-500";
  const fieldStyle = { border: "1px solid rgba(17,17,26,0.12)", color: LP.text };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-5"
      style={{ backgroundColor: "rgba(5,5,13,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[380px] rounded-3xl bg-white p-7"
        style={{ boxShadow: "0 24px 70px rgba(5,5,13,0.35)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Entrar na Priva"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <img src="/PRIVA_mark.png" alt="" className="mb-3 h-11 w-11 object-contain" />
            <h2 className="text-[20px] font-bold" style={{ color: LP.text }}>
              Entrar
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: LP.muted }}>
              Acesse sua conta Priva.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-black/5"
            style={{ color: LP.muted }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
              style={{ color: LP.muted }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              className={field}
              style={fieldStyle}
              required
            />
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
              style={{ color: LP.muted }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
              className={field}
              style={fieldStyle}
              required
            />
          </div>

          {error && (
            <p className="text-[13px] font-medium" style={{ color: "#D93A3A" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!valid || busy}
            className="lp-cta flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${LP.violet}, ${LP.indigo})` }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-[12.5px]" style={{ color: LP.muted }}>
          Ainda não tem conta?{" "}
          <a
            href="#planos"
            onClick={onClose}
            className="font-semibold"
            style={{ color: LP.indigo }}
          >
            Veja os planos
          </a>
        </p>
      </div>
    </div>
  );
}
