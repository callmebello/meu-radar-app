import { useMemo, useState } from "react";
import { AppHeader } from "../Header";
import { AnimatedScoreGauge } from "../AnimatedScoreGauge";
import { PaywallLock } from "../PaywallLock";
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
import { startCheckout } from "@/lib/checkout";
import { generateRelatorioPdf } from "@/lib/api/generateRelatorio.functions";
import { track } from "@/lib/analytics";
import { computeScore } from "@/lib/riskScore";
import { scoreInputsFrom } from "@/lib/scoreInputs";
import { UpsellBanner, shouldShowUpsell } from "../UpsellBanner";
import { ProtecaoTrackingCard } from "../ProtecaoTrackingCard";
import { NextActionsCard } from "../NextActionsCard";
import { PrivaIdCard } from "../PrivaIdCard";
import { ShareResultSheet } from "../ShareResultSheet";
import { IdentityCardSheet, type CardType } from "../IdentityCardSheet";

const levelColor = (l: string) =>
  l === "danger"
    ? "var(--color-danger)"
    : l === "warning"
      ? "var(--color-warning)"
      : "var(--color-success)";

type DashCard =
  | {
      kind: "card";
      icon: typeof Mail;
      label: string;
      type: CardType;
      status: string;
      level: string;
      sub?: string;
    }
  | { kind: "upsell"; icon: typeof Mail; label: string; title: string; subtitle: string };

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
  const lastScan =
    typeof window !== "undefined" ? localStorage.getItem("priva_last_scan_at") : null;
  const [bannerVisible, setBannerVisible] = useState(true);
  const [showId, setShowId] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [cardSheet, setCardSheet] = useState<CardType | null>(null);
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
  const cards: DashCard[] = [
    {
      kind: "card",
      icon: Fingerprint,
      label: "CPF",
      type: "cpf",
      status: cpfEx?.found
        ? `Encontrado em ${cpfEx.count} resultado(s) público(s)`
        : "Nenhuma exposição pública direta",
      level: cpfEx?.found ? "danger" : "success",
      sub: cpfEx?.found ? undefined : "Continuamos monitorando",
    },
    {
      kind: "card",
      icon: Mail,
      label: "E-mail",
      type: "email",
      status:
        breachCount > 0 ? `${breachCount} vazamento(s) detectado(s)` : "Nenhum vazamento detectado",
      level: breachCount > 0 ? "danger" : "success",
    },
    {
      kind: "card",
      icon: Phone,
      label: "Telefone",
      type: "telefone",
      status: phoneEx?.found
        ? `Encontrado em ${phoneEx.count} resultado(s) público(s)`
        : "Não encontrado em buscas públicas",
      level: phoneEx?.found ? "warning" : "success",
    },
    {
      kind: "upsell",
      icon: MapPin,
      label: "Endereço",
      title: "Verificação de endereço",
      subtitle: "Disponível no plano Proteção Total",
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

        {/* Score ⇄ Priva ID. Both live in the same grid cell, so the frame
            takes the height of the taller one and the two slide across it
            without the page jumping. */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="grid">
            <section
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_2px_20px_-8px_rgba(30,45,90,0.15)] transition-all duration-500 ease-out"
              style={{
                gridArea: "1 / 1",
                transform: showId ? "translateX(-102%)" : "translateX(0)",
                opacity: showId ? 0 : 1,
                pointerEvents: showId ? "none" : undefined,
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
                  /* Never measured. A number here would be a guess, and this is the
                 one place the whole app is judged on being honest. */
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
                    {/* The loop made visible: what they did is worth points, and the
                    card says how many. Without this the score never moves and
                    there is no reason to resolve anything. */}
                    {result && result.credit > 0 && (
                      <p
                        className="mt-3 text-[12.5px] font-semibold"
                        style={{ color: "var(--color-success)" }}
                      >
                        +{result.credit} pelas ações que você concluiu
                      </p>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                      {lastScan
                        ? `Última verificação: ${new Date(lastScan).toLocaleDateString("pt-BR")}`
                        : "Verificação concluída"}
                    </p>
                  </>
                )}
              </div>

              {score !== null && (
                <button
                  onClick={() => setShowId(true)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 text-[12.5px] font-semibold"
                  style={{ color: "#4F46E5" }}
                >
                  Ver meu Priva ID <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </section>

            <div
              className="flex flex-col transition-all duration-500 ease-out"
              style={{
                gridArea: "1 / 1",
                transform: showId ? "translateX(0)" : "translateX(102%)",
                opacity: showId ? 1 : 0,
                pointerEvents: showId ? undefined : "none",
              }}
              aria-hidden={!showId}
            >
              {/* flex-1 so the card fills the frame the score card defines —
                  the two faces are the same size, as a card should be. */}
              <div className="flex-1">
                <PrivaIdCard onShare={() => setShareOpen(true)} />
              </div>
              <button
                onClick={() => setShowId(false)}
                className="mt-3 flex w-full shrink-0 items-center justify-center gap-1.5 text-[12.5px] font-semibold"
                style={{ color: "#4F46E5" }}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Voltar ao score
              </button>
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

        {shouldShowUpsell(isPremium) && <UpsellBanner />}

        {/* Identity radar grid */}
        <section>
          <h2 className="mb-3 px-1 text-center text-sm font-semibold text-foreground">
            Radar de identidade
          </h2>
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
              : cards.map((it) => {
                  const Icon = it.icon;

                  // Endereço — genuine upsell (no free CPF↔address source), not fake data.
                  if (it.kind === "upsell") {
                    return (
                      <div
                        key={it.label}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          void startCheckout("protecao_total");
                        }}
                        className="cursor-pointer rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all duration-200 active:scale-[0.98]"
                      >
                        <div className="flex items-start justify-between">
                          <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary">
                            <Icon className="h-4 w-4 text-foreground" />
                          </span>
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">{it.label}</p>
                        <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                          {it.title}
                        </p>
                        <p className="text-[11px] leading-tight text-[var(--color-navy)]">
                          {it.subtitle}
                        </p>
                      </div>
                    );
                  }

                  const color = levelColor(it.level);
                  return (
                    <div
                      key={it.label}
                      role="button"
                      tabIndex={0}
                      onClick={() => setCardSheet(it.type)}
                      className="cursor-pointer rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all duration-200 active:scale-[0.98]"
                    >
                      <div className="flex items-start justify-between">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary">
                          <Icon className="h-4 w-4 text-foreground" />
                        </span>
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-foreground">{it.label}</p>
                      {isPremium ? (
                        <>
                          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                            {it.status}
                          </p>
                          {it.sub && (
                            <p className="text-[11px] leading-tight text-muted-foreground/70">
                              {it.sub}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="mt-1">
                          <PaywallLock />
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </section>
      </div>

      {cardSheet && <IdentityCardSheet type={cardSheet} onClose={() => setCardSheet(null)} />}

      {/* Shares the headline only — no name, no e-mail, no company names. */}
      {shareOpen && score !== null && (
        <ShareResultSheet
          breachCount={breachCount}
          score={score}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
