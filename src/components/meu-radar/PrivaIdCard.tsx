import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CircleDashed, Eye, EyeOff, Fingerprint, Share2, Sparkles } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { getUser } from "@/lib/auth";
import { getCpf, getEmail } from "@/lib/identity";
import { getProfile } from "@/lib/profile";
import { computeScore, riskLevel } from "@/lib/riskScore";
import { scoreInputsFrom } from "@/lib/scoreInputs";

/**
 * Priva ID — the person's status, as a card.
 *
 * It is NOT a document and carries no authority we have not earned, so each
 * credential states whether it was VERIFIED (we saw proof) or INFORMED (they
 * typed it). The reference design marked all three as verified; only e-mail
 * can honestly claim it today:
 *
 *   E-mail   — verified once the account address is confirmed by Supabase.
 *   Telefone — informed: there is no OTP, so we hold no proof.
 *   CPF      — informed: the check digits validate the FORMAT, never ownership.
 *
 * The identity id is derived from the account id, never from the CPF: a code
 * shown on a card that can be shown to someone else must not carry the
 * document inside it.
 */
const nameFrom = (full: string, email: string): string => {
  const src = full.trim() || email.split("@")[0] || "";
  if (!src) return "Você";
  const parts = src
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/);
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : first;
};

const initials = (n: string) =>
  n
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

/** Check digits only — proves the number is well-formed, not whose it is. */
function cpfDigitsValid(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

function Seal({ label, verified }: { label: string; verified: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-background/70 px-3 py-2.5">
      {verified ? (
        <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: "#4F46E5" }} />
      ) : (
        <CircleDashed className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-semibold text-foreground">{label}</span>
        <span className="block text-[11px] text-muted-foreground">
          {verified ? "Verificado" : "Informado"}
        </span>
      </span>
    </div>
  );
}

export function PrivaIdCard({ onShare }: { onShare?: () => void }) {
  const { scanResult, exposure, isPremium } = useApp();
  const [emailVerified, setEmailVerified] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    void getUser()
      .then((u) => {
        if (!u) return;
        setAuthEmail(u.email ?? "");
        setEmailVerified(!!(u as { email_confirmed_at?: string }).email_confirmed_at);
      })
      .catch(() => {});
  }, []);

  const email = authEmail || getEmail();
  const cpf = getCpf();
  const profile = (() => {
    try {
      return getProfile();
    } catch {
      return {} as ReturnType<typeof getProfile>;
    }
  })();
  const phone = (profile.extraPhone as string) || "";
  const name = nameFrom((profile.cpfName as string) || "", email);

  // Stable, non-reversible, and never the CPF.
  const identityId = useMemo(() => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("priva_user_id") || "" : "";
    const seed = (uid || email || "priva").replace(/[^a-z0-9]/gi, "").toUpperCase();
    return (seed.slice(-8) || "00000000").padStart(8, "0");
  }, [email]);

  const inputs = scoreInputsFrom(scanResult, exposure);
  const score = inputs ? computeScore(inputs).score : null;
  const risk = score !== null ? riskLevel(score) : null;
  const lastScan =
    typeof window !== "undefined" ? localStorage.getItem("priva_last_scan_at") : null;
  const updated = lastScan
    ? new Date(lastScan).toDateString() === new Date().toDateString()
      ? "Atualizado hoje"
      : `Atualizado em ${new Date(lastScan).toLocaleDateString("pt-BR")}`
    : "Sem verificação ainda";

  return (
    <div
      className="relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-[0_2px_20px_-8px_rgba(30,45,90,0.15)]"
      style={{
        backgroundImage:
          "radial-gradient(120% 90% at 88% 18%, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0) 55%), radial-gradient(90% 70% at 12% 92%, rgba(79,70,229,0.07) 0%, rgba(79,70,229,0) 60%)",
      }}
    >
      {/* Watermark — the app's own icon set, so it reads as ours, not as stock. */}
      <Fingerprint
        aria-hidden
        className="pointer-events-none absolute -right-6 top-6 h-44 w-44 text-[var(--color-navy)] opacity-[0.045]"
        strokeWidth={0.7}
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[15px] font-extrabold tracking-tight">
          <span style={{ color: "#4F46E5" }}>PRIVA</span>{" "}
          <span className="text-muted-foreground">ID</span>
        </p>
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-bold tracking-wide"
          style={
            isPremium
              ? { borderColor: "rgba(79,70,229,0.35)", color: "#4F46E5" }
              : { borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }
          }
        >
          {isPremium && <Sparkles className="h-3 w-3" />}
          {isPremium ? "PRO · ATIVO" : "GRATUITO"}
        </span>
      </div>

      <div className="relative mt-4 flex items-center gap-4">
        <span
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-[19px] font-bold"
          style={{
            backgroundColor: "rgba(79,70,229,0.10)",
            color: "#4F46E5",
            boxShadow: "0 0 0 3px rgba(79,70,229,0.14)",
          }}
        >
          {initials(name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[22px] font-extrabold leading-tight text-foreground">
            {name}
          </p>
          <button
            onClick={() => setRevealed((v) => !v)}
            className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground"
            aria-label={revealed ? "Ocultar identificador" : "Mostrar identificador"}
          >
            PRV {revealed ? identityId : `•••• ${identityId.slice(-4)}`}
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground/70">
            Identity ID
          </p>
        </div>

        {score !== null && risk && (
          <div className="shrink-0 border-l border-border pl-4 text-right">
            <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Score</p>
            <p className="text-[30px] font-extrabold leading-none" style={{ color: "#4F46E5" }}>
              {score}
            </p>
            <span
              className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9.5px] font-bold"
              style={{ backgroundColor: risk.bg, color: risk.color }}
            >
              {risk.label}
            </span>
          </div>
        )}
      </div>

      <div className="relative mt-4 flex gap-2">
        <Seal label="E-mail" verified={emailVerified} />
        <Seal label="Telefone" verified={false} />
        <Seal label="CPF" verified={false} />
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <BadgeCheck className="h-3.5 w-3.5" /> {updated}
        </span>
        {onShare && (
          <button
            onClick={onShare}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: "#4F46E5" }}
          >
            Compartilhar <Share2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {cpf && !cpfDigitsValid(cpf) && (
        <p className="relative mt-2 text-[11px] text-[#DC2626]">
          O CPF informado tem dígitos inválidos.
        </p>
      )}

      {/* Said on the card, not buried in terms. */}
      <p className="relative mt-2 text-[10.5px] leading-relaxed text-muted-foreground/80">
        Resumo do seu status na Priva — não é documento de identidade. "Informado" significa que
        você nos passou o dado e não temos como comprová-lo.
      </p>
    </div>
  );
}
