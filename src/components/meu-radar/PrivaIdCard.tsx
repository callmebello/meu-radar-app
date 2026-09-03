import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  CircleDashed,
  Eye,
  EyeOff,
  Fingerprint,
  Share2,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { getUser } from "@/lib/auth";
import { getCpf, getEmail } from "@/lib/identity";
import { getProfile } from "@/lib/profile";
import { readAvatar } from "./AvatarPicker";
import { useIsDark } from "@/hooks/use-is-dark";
import { PrivaIdShareSheet } from "./PrivaIdShareSheet";
import { computeScore } from "@/lib/riskScore";
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

/**
 * No box: three bordered cards ate a third of the card's height for six words.
 * The state is carried by colour — green when we hold proof, amber when the
 * person merely told us — which is also the only honest distinction here.
 */
/**
 * Three states, because there are three:
 *   verified — we hold proof (only e-mail can claim this today) → brand purple
 *   filled   — the person gave it to us                          → green check
 *   empty    — nothing here yet                                  → blank ring
 *
 * A green check on an empty field would be the one lie this card cannot afford.
 */
function Seal({ label, filled, verified }: { label: string; filled: boolean; verified: boolean }) {
  const color = verified ? "#4F46E5" : filled ? "#0FA968" : "var(--color-muted-foreground)";
  const Icon = verified ? BadgeCheck : filled ? CheckCircle2 : CircleDashed;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-semibold leading-tight text-foreground">
          {label}
        </span>
        <span
          className="block truncate text-[10.5px] leading-tight"
          style={{ color: filled || verified ? color : "var(--color-muted-foreground)" }}
        >
          {verified ? "Verificado" : filled ? "Informado" : "Vazio"}
        </span>
      </span>
    </div>
  );
}

export function PrivaIdCard({
  onShare,
  onBack,
  /** True while this face is the one turned towards the viewer. */
  active = true,
}: {
  onShare?: () => void;
  onBack?: () => void;
  active?: boolean;
}) {
  const { scanResult, exposure, isPremium } = useApp();
  const [emailVerified, setEmailVerified] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  // The film passes once per flip and then stops. Looping made it a shimmer,
  // which reads as "loading"; a single pass on arrival reads as a card catching
  // the light as it turns.
  const [sheenRun, setSheenRun] = useState(0);
  useEffect(() => {
    if (active) setSheenRun((n) => n + 1);
  }, [active]);
  const isDark = useIsDark();
  const avatar = readAvatar();

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
    if (uid)
      return uid
        .replace(/[^a-z0-9]/gi, "")
        .toUpperCase()
        .slice(-8)
        .padStart(8, "0");
    // No account yet: hash the address instead of slicing it, or the code ends
    // up spelling the tail of the domain ("LCOM") on everyone's card.
    let h = 2166136261;
    for (const ch of email || "priva") {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(-8);
  }, [email]);

  const inputs = scoreInputsFrom(scanResult, exposure);
  const score = inputs ? computeScore(inputs).score : null;
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-[0_2px_20px_-8px_rgba(30,45,90,0.15)]"
      style={{
        backgroundImage:
          "radial-gradient(120% 90% at 88% 16%, rgba(99,102,241,0.11) 0%, rgba(99,102,241,0) 55%), radial-gradient(90% 70% at 10% 94%, rgba(79,70,229,0.07) 0%, rgba(79,70,229,0) 60%)",
      }}
    >
      {/* Reflective film. A card catches light when it moves; this is that,
          slowed right down and kept faint — noticed on the second look, never
          competing with the name. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        <span
          key={sheenRun}
          className="absolute inset-y-[-60%] w-[52%]"
          style={{
            background:
              "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(199,210,254,0.55) 38%, rgba(255,255,255,0.85) 50%, rgba(196,181,253,0.5) 62%, rgba(255,255,255,0) 100%)",
            filter: "blur(6px)",
            animation: "id-sheen 1.5s cubic-bezier(0.4,0,0.2,1) 0.55s both",
          }}
        />
      </span>

      {/* Watermark — the app's own icon set, so it reads as ours, not as stock.
          It used to carry its own violet streak, but that streak was a
          rectangle laid over a round mark: on a light card its edges showed as
          a square. The film above crosses the whole card and does the job
          properly, so the mark is just the mark now. */}
      <Fingerprint
        aria-hidden
        className="pointer-events-none absolute -right-8 top-4 h-48 w-48 opacity-[0.07]"
        style={{ color: "#4F46E5" }}
        strokeWidth={0.7}
      />

      <div className="relative flex items-center justify-between gap-3">
        {/* The same wordmark the header carries, so the card is unmistakably
            the same product — sized down to sit under the name, not compete
            with it. */}
        <span className="flex items-baseline gap-1.5">
          <img
            src={isDark ? "/PRIVA_logo_dark_theme.png" : "/PRIVA_logo_light_theme.png"}
            alt="Priva"
            className="h-[17px] w-auto object-contain"
          />
          {/* Just under the wordmark's cap height: matching it exactly made
              "ID" the louder half of the lockup. */}
          <span
            className="text-[19.5px] font-bold leading-none tracking-[0.10em]"
            style={{ color: "#4F46E5" }}
          >
            ID
          </span>
        </span>
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

      {/* The identity block gets the room the card has to spare. */}
      <div className="relative flex flex-1 items-center gap-3 py-1">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-[58px] w-[58px] shrink-0 rounded-full object-cover"
            style={{ boxShadow: "0 0 0 3px rgba(79,70,229,0.14)" }}
          />
        ) : (
          <span
            className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full text-[18px] font-bold"
            style={{
              backgroundColor: "rgba(79,70,229,0.10)",
              color: "#4F46E5",
              boxShadow: "0 0 0 3px rgba(79,70,229,0.14)",
            }}
          >
            {initials(name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[20px] font-extrabold leading-tight text-foreground">
            {name}
          </p>
          <button
            onClick={() => setRevealed((v) => !v)}
            className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground"
            aria-label={revealed ? "Ocultar identificador" : "Mostrar identificador"}
          >
            PRV {revealed ? identityId : `•••• ${identityId.slice(-4)}`}
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
            Identity ID
          </p>
        </div>

        {score !== null && (
          <div className="shrink-0 pl-2 pr-3 text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Score</p>
            <p className="text-[32px] font-extrabold leading-none" style={{ color: "#4F46E5" }}>
              {score}
            </p>
          </div>
        )}
      </div>

      <div className="relative flex gap-2">
        <Seal label="E-mail" filled={!!email} verified={emailVerified} />
        <Seal label="Telefone" filled={!!phone} verified={false} />
        <Seal label="CPF" filled={!!cpf} verified={false} />
      </div>

      {cpf && !cpfDigitsValid(cpf) && (
        <p className="relative mt-2 text-[11px] text-[#DC2626]">
          O CPF informado tem dígitos inválidos.
        </p>
      )}

      {/* The flip control sits where its twin sits on the score face — same
          place, same size — so tapping back feels like undoing the tap that
          brought you here rather than hunting for a second button. Share is
          pinned to the right of the same row so it costs no extra line. */}
      <div className="relative mt-3 flex items-center justify-center">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: "#4F46E5" }}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Voltar ao score
          </button>
        )}
        {
          <button
            onClick={() => setShareOpen(true)}
            aria-label="Compartilhar"
            className="absolute right-0 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: "#4F46E5" }}
          >
            <Share2 className="h-4 w-4" />
          </button>
        }
      </div>

      {shareOpen && (
        <PrivaIdShareSheet
          data={{
            name,
            identityId,
            score,
            premium: isPremium,
            avatar: avatar || undefined,
            seals: [
              { label: "E-mail", state: emailVerified ? "verified" : email ? "filled" : "empty" },
              { label: "Telefone", state: phone ? "filled" : "empty" },
              { label: "CPF", state: cpf ? "filled" : "empty" },
            ],
          }}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
