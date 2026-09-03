import { useMemo, useState } from "react";
import { AppHeader } from "../Header";
import { AnimatedScoreGauge } from "../AnimatedScoreGauge";
import { PaywallLock } from "../PaywallLock";
import { startCheckout } from "@/lib/checkout";
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Fingerprint,
  Mail,
  Phone,
  MapPin,
  X,
  Lock,
  Trash2,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { generateRelatorioPdf } from "@/lib/api/generateRelatorio.functions";
import { track } from "@/lib/analytics";
import { computeScore } from "@/lib/riskScore";
import { scoreInputsFrom } from "@/lib/scoreInputs";
import { ProtecaoTrackingCard } from "../ProtecaoTrackingCard";
import { NextActionsCard } from "../NextActionsCard";
import { PrivaIdCard } from "../PrivaIdCard";
import { IdentityTile } from "../IdentityTile";
import { getProfile, saveProfile } from "@/lib/profile";
import { getCpf, getEmail, rememberIdentity } from "@/lib/identity";

const levelColor = (l: string) =>
  l === "danger"
    ? "var(--color-danger)"
    : l === "warning"
      ? "var(--color-warning)"
      : "var(--color-success)";

type DashCard = {
  icon: typeof Mail;
  label: string;
  status: string;
  level: string;
  value?: string;
  rawValue?: string;
  emptyText?: string;
  placeholder?: string;
  onSave?: (v: string) => void;
  locked?: boolean;
  lockedText?: string;
};

export function RadarTab() {
  const { isPremium, goToTab, hasChecked, scanning, scanResult, exposure, openScan } = useApp();
  // Identity Score — the same computation the report uses, from the same
  // evidence. It used to come from getScore(cpf), which derived a number from
  // the DIGITS OF THE CPF and fell back to a hardcoded 67 when there was no
  // scan: an invented score, shown to someone who had not been measured yet.
  // Null now means "not measured", and the card says so instead of guessing.
  const breachCount = scanResult?.breachCount ?? 0;
  const inputs = useMemo(() => scoreInputsFrom(scanResult, exposure), [scanResult, exposure]);
  const result = useMemo(() => (inputs ? computeScore(inputs) : null), [inputs]);
  const score = result?.score ?? null;
  const [bannerVisible, setBannerVisible] = useState(true);
  const [showId, setShowId] = useState(false);
  const [, forceRender] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);

  // The report CTA below the score appears only for active subscribers who have
  // a persisted scan on file (a report can only be generated from real scan data).
  const hasReport =
    typeof window !== "undefined" &&
    !!localStorage.getItem("priva_user_id") &&
    !!localStorage.getItem("priva_scan_result");

  // Generate (or refresh) the full Relatório de Exposição Digital and open it.
  // Shows a loading state while the PDF is still being generated server-side.
  const downloadRelatorio = async () => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("priva_user_id") : null;
    if (!uid) {
      toast.error("Faça um scan primeiro para gerar o relatório.");
      return;
    }
    setPdfBusy(true);
    try {
      const res = await generateRelatorioPdf({ data: { userId: uid } });
      if (res.ok && res.url) window.open(res.url, "_blank");
      else toast.error("Não foi possível gerar o relatório agora.");
    } catch {
      toast.error("Não foi possível gerar o relatório agora.");
    }
    setPdfBusy(false);
  };

  // Proteção Total shows the removal-status card on the dashboard (no downloads).
  // The report download lives in the Perfil tab, not here.
  const plan = typeof window !== "undefined" ? localStorage.getItem("priva_plan") || "" : "";
  const isProtecao = plan === "protecao_total";
  const lgpdRequestedAt =
    typeof window !== "undefined" ? localStorage.getItem("priva_lgpd_requested_at") : null;

  // Real free-source results (dashboard only) — degrade to safe "not found".
  const cpfEx = exposure?.cpf;
  const phoneEx = exposure?.phone;
  // Real occurrence count: e-mail breaches (HIBP) + public exposure (web + GitHub).
  const occurrences =
    breachCount + (cpfEx?.count ?? 0) + (phoneEx?.count ?? 0) + (exposure?.github?.count ?? 0);
  // One sentence for every clean card. Three different ways of saying "nothing
  // found" made the grid read as three different findings, and "Continuamos
  // monitorando" repeated the promise of the whole product on every tile,
  // costing two lines each.
  const CLEAN = "Nenhuma exposição encontrada";
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  const profile = getProfile();
  const cpfDigits = getCpf().replace(/\D/g, "");
  const phoneDigits = (profile.extraPhone ?? "").replace(/\D/g, "");
  const email = getEmail();
  const address = [profile.addrStreet, profile.addrCity].filter(Boolean).join(", ");

  const cards: DashCard[] = [
    {
      icon: Fingerprint,
      label: "CPF",
      status: cpfEx?.found
        ? `Encontrado em ${plural(cpfEx.count, "resultado público", "resultados públicos")}`
        : CLEAN,
      level: cpfEx?.found ? "danger" : "success",
      value:
        cpfDigits.length === 11 ? `•••.•••.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9)}` : "",
      emptyText: "Nenhum CPF verificado ainda. Toque em Scan Grátis para começar.",
    },
    {
      icon: Mail,
      label: "E-mail",
      status:
        breachCount > 0
          ? plural(breachCount, "vazamento detectado", "vazamentos detectados")
          : CLEAN,
      level: breachCount > 0 ? "danger" : "success",
      // Masked so it fits the tile on one line; editing starts from the real
      // address, not from the dots.
      value: email ? `${email.slice(0, 2)}${"•".repeat(4)}@${email.split("@")[1] ?? ""}` : "",
      rawValue: email,
      emptyText: "Nenhum e-mail cadastrado. Toque para adicionar.",
      placeholder: "voce@email.com",
      onSave: (v) => {
        rememberIdentity("", v);
        forceRender((n) => n + 1);
      },
    },
    {
      icon: Phone,
      label: "Telefone",
      status: phoneEx?.found
        ? `Encontrado em ${plural(phoneEx.count, "resultado público", "resultados públicos")}`
        : CLEAN,
      level: phoneEx?.found ? "warning" : "success",
      value: phoneDigits ? `(${phoneDigits.slice(0, 2)}) •••••-${phoneDigits.slice(-4)}` : "",
      emptyText: "Nenhum telefone cadastrado. Toque para adicionar.",
      placeholder: "(11) 90000-0000",
      onSave: (v) => {
        saveProfile({ extraPhone: v });
        forceRender((n) => n + 1);
      },
    },
    {
      icon: MapPin,
      label: "Endereço",
      status: address || CLEAN,
      level: "success",
      value: isPremium ? address : "",
      emptyText: "Nenhum endereço cadastrado. Toque para adicionar.",
      placeholder: "Rua e número",
      onSave: (v) => {
        saveProfile({ addrStreet: v });
        forceRender((n) => n + 1);
      },
      // No free source links a CPF to an address, so this stays honest about
      // being a paid capability instead of showing a reassuring green.
      locked: !isPremium,
      // Two lines so the tile matches the height of the one beside it.
      lockedText: "Plano\nProteção Total",
    },
  ];

  return (
    <>
      <AppHeader title="" showBell />
      <div className="space-y-5 px-5 py-5">
        {/* Proteção Total — persistent case tracker (above the score) */}
        {isPremium && isProtecao && <ProtecaoTrackingCard />}

        {hasChecked && bannerVisible && (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-teal)]/30 bg-[var(--color-teal)]/8 px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--color-teal)]" />
            <p className="flex-1 text-[11px] font-medium text-foreground">
              CPF verificado · {occurrences}{" "}
              {occurrences === 1 ? "ocorrência encontrada" : "ocorrências encontradas"}
            </p>
            <button
              onClick={() => goToTab("protecao")}
              className="text-[11px] font-bold text-[var(--color-teal)]"
            >
              Ver detalhes →
            </button>
            <button onClick={() => setBannerVisible(false)} className="text-muted-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Score ⇄ Priva ID — a real 3D flip on the X axis.
            The front stays in normal flow and defines the box; the back is
            absolutely positioned over it, so the two faces are the same size by
            construction rather than by a magic number that drifts the moment a
            font or a label changes. */}
        <div style={{ perspective: "1400px" }}>
          <div
            className="relative transition-transform duration-700 ease-[cubic-bezier(0.4,0.15,0.2,1)]"
            style={{
              transformStyle: "preserve-3d",
              // Horizontal flip, matching the arrows: forward spins to the
              // right (›), back spins to the left (‹).
              // translateZ keeps the matrix 3D — a plain rotateY(0deg) computes
              // to a 2D matrix, which flattens the context and paints the back
              // face straight over the front.
              transform: showId
                ? "rotateY(180deg) translateZ(0.01px)"
                : "rotateY(0deg) translateZ(0.01px)",
            }}
          >
            {/* FRONT — score */}
            <section
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_2px_20px_-8px_rgba(30,45,90,0.15)]"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                // backface-visibility alone proved unreliable here, so the two
                // faces also swap at the halfway point of the rotation. The
                // delay is half the 700ms flip: you always see the face that is
                // turned towards you, on every engine.
                opacity: showId ? 0 : 1,
                transition: "opacity 0s linear 350ms",
              }}
              aria-hidden={showId}
            >
              <div
                className={`flex flex-col items-center text-center ${scanning ? "animate-pulse" : ""}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Identity Score
                </p>
                {scanning ? (
                  <>
                    <p className="mt-6 text-5xl font-extrabold text-muted-foreground">—</p>
                    <p className="mt-6 text-xs text-muted-foreground">verificando...</p>
                  </>
                ) : score === null ? (
                  /* Never measured. A number here would be a guess, and this is
                     the one place the whole app is judged on being honest. */
                  <>
                    <p className="mt-6 text-5xl font-extrabold text-muted-foreground">—</p>
                    <p className="mt-4 max-w-[15rem] text-[13px] leading-relaxed text-muted-foreground">
                      Seu score aparece depois da primeira verificação.
                    </p>
                    <button
                      onClick={openScan}
                      className="mt-4 rounded-full px-5 py-2.5 text-[13.5px] font-bold text-white transition active:scale-[0.99]"
                      style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
                    >
                      Fazer scan grátis
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mt-3 w-full">
                      <AnimatedScoreGauge score={score} max={100} />
                    </div>
                    {result && result.credit > 0 && (
                      <p
                        className="mt-3 text-[12.5px] font-semibold"
                        style={{ color: "var(--color-success)" }}
                      >
                        +{result.credit} pelas ações que você concluiu
                      </p>
                    )}
                    <button
                      onClick={() => setShowId(true)}
                      className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] font-semibold"
                      style={{ color: "#4F46E5" }}
                    >
                      Meu Priva ID <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* BACK — Priva ID, same box */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                opacity: showId ? 1 : 0,
                transition: "opacity 0s linear 350ms",
                pointerEvents: showId ? undefined : "none",
              }}
              aria-hidden={!showId}
            >
              <PrivaIdCard onBack={() => setShowId(false)} />
            </div>
          </div>
        </div>

        {/* The loop, made walkable: score first, then the shortest path to a
            better one. Renders nothing when there is nothing to do. */}
        <NextActionsCard />

        {/* Post-subscription CTA — download the full report. Only for active
            subscribers with a scan on file; shows a loading state while the PDF
            is still being generated. */}
        {isPremium && hasReport && (
          <button
            onClick={downloadRelatorio}
            disabled={pdfBusy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.99] disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg,#4F46E5,#6366F1)",
              boxShadow: "0 8px 28px rgba(79,70,229,0.4)",
            }}
          >
            {pdfBusy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Gerando relatório...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" /> Baixar Relatório Completo
              </>
            )}
          </button>
        )}

        {/* Identity radar grid — the heading is gone: the tiles say what they
            are, and the label cost a row on the one screen that must fit. */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            {scanning
              ? cards.map((it) => (
                  <div key={it.label} className="rounded-2xl border border-border/60 bg-card p-4">
                    <div className="flex items-start justify-between">
                      <span className="h-9 w-9 animate-pulse rounded-lg bg-gray-700" />
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
                    </div>
                    <div className="mt-3 h-4 w-20 animate-pulse rounded bg-gray-700" />
                    <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-800" />
                  </div>
                ))
              : cards.map((it) => (
                  <IdentityTile
                    key={it.label}
                    icon={it.icon}
                    label={it.label}
                    status={it.status}
                    dot={levelColor(it.level)}
                    value={it.value}
                    rawValue={it.rawValue}
                    emptyText={it.emptyText}
                    placeholder={it.placeholder}
                    onSave={it.onSave}
                    locked={it.locked}
                    lockedText={it.lockedText}
                    onLockedTap={() => {
                      void startCheckout("protecao_total");
                    }}
                  />
                ))}
          </div>
        </section>
      </div>
    </>
  );
}
