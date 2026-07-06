import { useState } from "react";
import { ShieldCheck, ShieldAlert, Eye, EyeOff, Loader2, KeyRound, Lock } from "lucide-react";
import { checkPwnedPassword } from "@/lib/pwned";
import { useApp } from "@/contexts/AppContext";

/**
 * Standalone utility: checks whether a password appears in known breaches via
 * the HIBP Pwned Passwords k-anonymity model. 100% client-side — the password
 * is hashed locally and only the first 5 hex chars of the hash are sent.
 * Premium-only: locked behind a paid plan until the user converts.
 */
export function PasswordChecker() {
  const { isPremium, openPaywall } = useApp();
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState("");

  const check = async () => {
    if (!isPremium) {
      openPaywall();
      return;
    }
    if (!pwd || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await checkPwnedPassword(pwd));
    } catch {
      setError("Não foi possível verificar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-teal)]/15">
          <KeyRound className="h-4 w-4 text-[var(--color-navy)]" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">Verificar se uma senha foi vazada</h2>
        {!isPremium && <Lock className="ml-auto h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Verificação segura: sua senha é processada apenas no seu aparelho e{" "}
        <strong className="text-foreground">nunca é enviada</strong> aos nossos servidores.
      </p>

      <div className="relative mt-3">
        <input
          type={show ? "text" : "password"}
          value={pwd}
          disabled={!isPremium}
          onChange={(e) => {
            setPwd(e.target.value);
            setResult(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && check()}
          placeholder={isPremium ? "Digite uma senha para testar" : "Disponível no plano pago"}
          autoComplete="off"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 text-sm text-foreground outline-none disabled:opacity-60"
        />
        {isPremium && (
          <button
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ocultar" : "Mostrar"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      <button
        onClick={check}
        disabled={isPremium && (!pwd || loading)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
        style={{ backgroundColor: "#4F46E5" }}
      >
        {!isPremium ? (
          <>
            <Lock className="h-4 w-4" /> Desbloquear verificação
          </>
        ) : loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
          </>
        ) : (
          "Verificar"
        )}
      </button>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      {result &&
        (result.count > 0 ? (
          <div
            className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
          >
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm font-medium text-red-400">
              Encontrada {result.count.toLocaleString("pt-BR")} vez(es) em vazamentos — não use esta
              senha.
            </p>
          </div>
        ) : (
          <div
            className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-green-400" />
            <p className="text-sm font-medium text-green-400">
              Não encontrada em vazamentos conhecidos.
            </p>
          </div>
        ))}

      <p className="mt-3 text-[11px] leading-snug text-muted-foreground/70">
        Modelo k-anonymity: apenas os 5 primeiros caracteres do hash SHA-1 são consultados.
      </p>
    </section>
  );
}
