import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Apple, Check, Lock, ShieldCheck, Smartphone } from "lucide-react";
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
    monthly: 39.9,
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

/* ── 6. PROVA SOCIAL ──────────────────────────────────────────────── */

/**
 * Deliberately empty until the backend can supply real figures. Fill these and
 * the block renders itself — nothing here is invented in the meantime.
 *   AVATARS: URLs of real, consented customer photos
 *   RATING:  verified score + how many reviews it came from
 */
const AVATARS: string[] = [];
const RATING: { score: number; count: number } | null = null;

export function SocialProof() {
  return (
    <section className="py-16 sm:py-20" style={{ backgroundColor: LP.bgLight }}>
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <h2
              className="text-[24px] font-bold leading-[1.2] tracking-tight sm:text-[30px]"
              style={{ color: LP.text }}
            >
              Milhares de pessoas já estão cuidando
              <br className="hidden sm:block" /> da sua privacidade com a Priva
            </h2>

            {(AVATARS.length > 0 || RATING) && (
              <div className="mt-6 flex flex-wrap items-center gap-5">
                {AVATARS.length > 0 && (
                  <div className="flex -space-x-2.5">
                    {AVATARS.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                  </div>
                )}
                {RATING && (
                  <p className="text-[13px]" style={{ color: LP.muted }}>
                    <span className="font-bold" style={{ color: LP.text }}>
                      {RATING.score.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} de 5
                    </span>{" "}
                    em {RATING.count} avaliações verificadas
                  </p>
                )}
              </div>
            )}
          </Reveal>

          <Reveal delay={100}>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { Icon: Lock, title: "Dados protegidos", sub: "com segurança" },
                { Icon: ShieldCheck, title: "Privacidade", sub: "e LGPD" },
              ].map((c) => (
                <div
                  key={c.title}
                  className="flex items-center gap-3 rounded-2xl bg-white px-5 py-5"
                  style={{
                    border: "1px solid rgba(17,17,26,0.08)",
                    boxShadow: "0 6px 20px rgba(15,15,40,0.05)",
                  }}
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: "rgba(99,102,241,0.1)" }}
                  >
                    <c.Icon className="h-5 w-5" strokeWidth={1.7} style={{ color: LP.indigo }} />
                  </span>
                  <p className="text-[14px] font-semibold leading-snug" style={{ color: LP.text }}>
                    {c.title}
                    <br />
                    <span style={{ color: LP.muted }}>{c.sub}</span>
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ── 7. APP MOBILE ────────────────────────────────────────────────── */

export function MobileApp() {
  return (
    <section className="py-14" style={{ backgroundColor: "#FFFFFF" }}>
      <Container>
        <Reveal>
          <div
            className="flex flex-col items-center gap-6 rounded-3xl px-7 py-8 text-center sm:flex-row sm:justify-between sm:text-left"
            style={{ backgroundColor: LP.bgLight, border: "1px solid rgba(17,17,26,0.07)" }}
          >
            <div>
              <h2 className="text-[20px] font-bold" style={{ color: LP.text }}>
                Priva no seu celular
              </h2>
              <p className="mt-1 text-[14px]" style={{ color: LP.muted }}>
                Leve sua privacidade para qualquer lugar.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { Icon: Apple, os: "iOS" },
                { Icon: Smartphone, os: "Android" },
              ].map((s) => (
                <div
                  key={s.os}
                  className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3"
                  style={{ border: "1px solid rgba(17,17,26,0.09)" }}
                >
                  <s.Icon className="h-6 w-6" strokeWidth={1.6} style={{ color: LP.text }} />
                  <div className="text-left">
                    <p className="text-[14px] font-bold leading-none" style={{ color: LP.text }}>
                      {s.os}
                    </p>
                    <p className="mt-1 text-[11.5px]" style={{ color: LP.muted }}>
                      Em breve
                    </p>
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
