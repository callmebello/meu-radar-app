import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Apple, Check, Lock, Smartphone } from "lucide-react";
import { Container, Eyebrow, Reveal, SectionTitle } from "./ui";
import { LP, SCAN_HREF } from "./theme";

/* ── 5. PLANOS ────────────────────────────────────────────────────── */

/**
 * Monthly prices mirror PLAN_PRICE in src/lib/checkout.ts. The annual column is
 * the "2 meses grátis" rule from the design (10 months charged for 12).
 *
 * Every plan CTA points at the scan funnel rather than calling startCheckout()
 * directly, for two reasons: a cold visitor has no e-mail yet, and Stripe only
 * has monthly prices — sending someone who picked "Anual" straight into a
 * monthly checkout would charge them something they did not choose.
 */
const MONTHS_CHARGED_PER_YEAR = 10;

type Plan = {
  name: string;
  monthly: number;
  blurb: string;
  features: string[];
  cta: string;
  badge?: { label: string; tone: "indigo" | "green" };
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Essencial",
    monthly: 9.9,
    blurb: "Ideal para quem quer descobrir e monitorar suas exposições.",
    features: [
      "Relatório completo",
      "Monitoramento básico",
      "Alertas",
      "Histórico de verificações",
    ],
    cta: "Assinar Essencial",
  },
  {
    name: "Proteção Total",
    monthly: 24.9,
    blurb: "Proteção completa: encontra, pede a remoção e monitora.",
    features: [
      "Tudo do Essencial",
      "Remoção de dados da internet",
      "Alertas em tempo real",
      "Suporte prioritário",
    ],
    cta: "Assinar Proteção Total",
    badge: { label: "Mais escolhido", tone: "indigo" },
    featured: true,
  },
  {
    name: "Família",
    monthly: 50,
    blurb: "Proteção para você e quem é importante para você.",
    features: [
      "Tudo do Proteção Total",
      "Até 5 pessoas",
      "Relatórios individuais",
      "Gestão centralizada da família",
    ],
    cta: "Assinar Família",
    badge: { label: "Novo", tone: "green" },
  },
];

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="planos" className="py-20 sm:py-28" style={{ backgroundColor: "#FFFFFF" }}>
      <Container>
        <Reveal>
          <Eyebrow>Planos</Eyebrow>
          <SectionTitle className="mt-3">Escolha sua proteção</SectionTitle>

          <div className="mt-8 flex justify-center">
            <div
              className="inline-flex items-center gap-1 rounded-full p-1"
              style={{ backgroundColor: "#F1F1F6" }}
            >
              {[
                { label: "Mensal", value: false },
                { label: "Anual", value: true },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setAnnual(opt.value)}
                  aria-pressed={annual === opt.value}
                  className="rounded-full px-5 py-2 text-[13.5px] font-semibold transition-all duration-200"
                  style={
                    annual === opt.value
                      ? { backgroundColor: LP.indigo, color: "#FFFFFF" }
                      : { color: LP.muted }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {annual && (
            <p className="mt-3 text-center text-[13px] font-semibold" style={{ color: LP.green }}>
              2 meses grátis no plano anual
            </p>
          )}
        </Reveal>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => {
            const perMonth = annual ? (p.monthly * MONTHS_CHARGED_PER_YEAR) / 12 : p.monthly;
            const badgeColor = p.badge?.tone === "green" ? LP.green : LP.indigo;
            return (
              <Reveal key={p.name} delay={i * 100}>
                <div
                  className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-7"
                  style={{
                    border: p.featured
                      ? `1.5px solid ${LP.indigo}`
                      : "1px solid rgba(17,17,26,0.09)",
                    boxShadow: p.featured
                      ? "0 18px 48px rgba(99,102,241,0.16)"
                      : "0 6px 22px rgba(15,15,40,0.05)",
                  }}
                >
                  {p.badge && (
                    <span
                      className="absolute inset-x-0 top-0 py-1.5 text-center text-[10.5px] font-bold uppercase tracking-[0.14em] text-white"
                      style={{ backgroundColor: badgeColor }}
                    >
                      {p.badge.label}
                    </span>
                  )}

                  {/* Same top offset on every card so the three titles, prices
                      and feature lists line up across the row. */}
                  <div className="pt-7">
                    <h3 className="text-[21px] font-bold" style={{ color: LP.text }}>
                      {p.name}
                    </h3>
                    <p
                      className="mt-2 min-h-[42px] text-[13.5px] leading-snug"
                      style={{ color: LP.muted }}
                    >
                      {p.blurb}
                    </p>

                    <div className="mt-5 flex items-end gap-1.5">
                      <span className="text-[15px] font-semibold" style={{ color: LP.text }}>
                        R$
                      </span>
                      <span
                        className="text-[38px] font-extrabold leading-none tracking-tight"
                        style={{ color: LP.text }}
                      >
                        {brl(perMonth)}
                      </span>
                      <span className="pb-1 text-[13px]" style={{ color: LP.muted }}>
                        /mês
                      </span>
                    </div>
                    <p className="mt-1.5 h-4 text-[12px]" style={{ color: LP.muted }}>
                      {annual && `R$ ${brl(p.monthly * MONTHS_CHARGED_PER_YEAR)} cobrados por ano`}
                    </p>

                    <ul className="mt-6 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0"
                            strokeWidth={2.5}
                            style={{ color: p.badge?.tone === "green" ? LP.green : LP.indigo }}
                          />
                          <span className="text-[13.5px]" style={{ color: LP.text }}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to={SCAN_HREF}
                    className="lp-cta mt-7 block rounded-xl py-3.5 text-center text-[14px] font-bold transition-all"
                    style={
                      p.featured
                        ? {
                            background: `linear-gradient(135deg, ${LP.violet}, ${LP.indigo})`,
                            color: "#FFFFFF",
                          }
                        : {
                            border: `1.5px solid ${p.badge?.tone === "green" ? LP.green : LP.indigo}`,
                            color: p.badge?.tone === "green" ? LP.green : LP.indigo,
                          }
                    }
                  >
                    {p.cta}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>

        <p
          className="mt-8 flex items-center justify-center gap-2 text-[13px]"
          style={{ color: LP.muted }}
        >
          <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />
          Cancele quando quiser. Sem fidelidade.
        </p>
      </Container>
    </section>
  );
}

/* ── 7. APP MOBILE ────────────────────────────────────────────────── */

export function MobileApp() {
  return (
    <section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
      <Container>
        <Reveal>
          <div
            className="flex flex-col items-center gap-8 rounded-[28px] px-7 py-9 text-center sm:px-12 lg:flex-row lg:justify-between lg:text-left"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAFE 100%)",
              border: "1px solid rgba(99,102,241,0.12)",
              boxShadow: "0 18px 50px rgba(80,70,200,0.10)",
            }}
          >
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-7">
              <img
                src="/PRIVA_mark.png"
                alt=""
                className="h-[86px] w-[86px] shrink-0 object-contain"
              />
              <div>
                <h2 className="text-[26px] font-bold tracking-tight" style={{ color: LP.text }}>
                  <span style={{ color: LP.violet }}>Priva</span> App
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: LP.muted }}>
                  Leve sua privacidade para qualquer lugar.
                  <br className="hidden sm:block" />{" "}
                  <span className="font-semibold" style={{ color: LP.violet }}>
                    Em breve
                  </span>{" "}
                  no seu iPhone e no seu Android.
                </p>
              </div>
            </div>

            {/* Deliberately not the official store badges — the apps aren't
                published, and those badges say "Download". Same weight and
                shape, wording that matches reality. */}
            <div className="flex shrink-0 flex-wrap justify-center gap-3">
              {[
                { Icon: Apple, os: "App Store" },
                { Icon: Smartphone, os: "Google Play" },
              ].map((s) => (
                <div
                  key={s.os}
                  className="flex items-center gap-3 rounded-2xl px-5 py-3"
                  style={{ backgroundColor: LP.text }}
                >
                  <s.Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
                  <div className="text-left">
                    <p className="text-[11px] leading-none text-white/60">Em breve na</p>
                    <p className="mt-1 text-[15px] font-bold leading-none text-white">{s.os}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
