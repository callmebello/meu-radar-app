import { useEffect, useState } from "react";
import { Check, Mail, X } from "lucide-react";
import { signInWithEmail, signInWithPassword, signUpWithPassword } from "@/lib/auth";
import { getEmail, rememberIdentity } from "@/lib/identity";
import { track, gaEvent } from "@/lib/analytics";
import { CHECKS_PER_DAY } from "@/lib/security/quota";

/**
 * The free-account step, asked only after the tools have already proved
 * themselves — never before the first result.
 *
 * What it promises is deliberately limited to what a free account actually
 * delivers today: a bigger daily allowance and access from another device.
 * It does NOT offer to save the check or send alerts. Saving would mean
 * uploading the link, Pix code or message the person pasted, which this tab
 * explicitly promises never to send anywhere; alerts are what the Essencial
 * plan is for.
 */
export function FreeAccountSheet({
  onClose,
  onCreated,
  onSeePlans,
}: {
  onClose: () => void;
  onCreated: () => void;
  onSeePlans: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    setEmail(getEmail());
    track("FreeAccountPrompt");
    gaEvent("free_account_prompt");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const done = () => {
    try {
      localStorage.setItem("priva_has_account", "true");
    } catch {
      /* ignore */
    }
    rememberIdentity("", email);
    track("FreeAccountCreated");
    gaEvent("free_account_created");
    onCreated();
  };

  const create = async () => {
    if (!/.+@.+\..+/.test(email)) {
      setError("Digite um e-mail válido.");
      return;
    }
    if (password.length < 8) {
      setError("A senha precisa ter ao menos 8 caracteres.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: e } = await signUpWithPassword(email, password);
    // Someone who already signed up (post-payment, or on another device) gets
    // signed in instead of a dead-end "e-mail já cadastrado".
    if (e && /already|registered|exists/i.test(e.message)) {
      const { error: e2 } = await signInWithPassword(email, password);
      setBusy(false);
      if (e2) {
        setError("Este e-mail já tem conta. Senha incorreta?");
        return;
      }
      done();
      return;
    }
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    done();
  };

  const magicLink = async () => {
    if (!/.+@.+\..+/.test(email)) {
      setError("Digite um e-mail válido.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: e } = await signInWithEmail(email);
    setBusy(false);
    if (e) setError(e.message);
    else setLinkSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-6 pb-8 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Criar conta grátis"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-bold text-foreground">Continue verificando</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Você usou suas {CHECKS_PER_DAY.anon} verificações de hoje. Criar conta é grátis e leva
              alguns segundos.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="space-y-2 rounded-2xl border border-border bg-background p-4">
          {[
            `${CHECKS_PER_DAY.conta} verificações por dia, em vez de ${CHECKS_PER_DAY.anon}`,
            "Acesso ao seu relatório de qualquer aparelho",
            "Sem cartão de crédito",
          ].map((f) => (
            <li key={f} className="flex gap-2 text-[13px] text-foreground">
              <Check
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-navy)]"
                strokeWidth={3}
              />
              {f}
            </li>
          ))}
        </ul>

        {linkSent ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-background p-4 text-[13px] text-foreground">
            <Mail className="h-4 w-4 shrink-0 text-[var(--color-navy)]" />
            Enviamos um link de acesso para {email}.
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500"
            />
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha (mín. 8 caracteres)"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500"
            />

            {error && <p className="text-[12.5px] text-[#DC2626]">{error}</p>}

            <button
              onClick={create}
              disabled={busy}
              className="w-full rounded-2xl py-3.5 text-[15px] font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
            >
              {busy ? "Criando..." : "Criar conta grátis"}
            </button>

            <button
              onClick={magicLink}
              disabled={busy}
              className="w-full rounded-2xl border border-border py-3 text-[13.5px] font-semibold text-foreground transition active:scale-[0.99] disabled:opacity-60"
            >
              Receber link por e-mail
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-[12px] text-muted-foreground">
          Precisa de verificação ilimitada e monitoramento?{" "}
          <button onClick={onSeePlans} className="font-semibold text-[var(--color-navy)]">
            Ver planos
          </button>
        </p>
      </div>
    </div>
  );
}
