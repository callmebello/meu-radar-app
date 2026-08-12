import {
  Ban,
  Check,
  Eraser,
  FileLock2,
  Lock,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Container, Eyebrow, Reveal, SectionTitle } from "./ui";
import { LP } from "./theme";

/* ── 2. COMO FUNCIONA ─────────────────────────────────────────────── */

const STEPS = [
  {
    n: "01",
    Icon: Search,
    title: "Verifique",
    text: "Informe seus dados e nossa tecnologia busca por possíveis exposições na internet em segundos.",
  },
  {
    n: "02",
    Icon: Eraser,
    title: "Remova",
    text: "Com a sua autorização, acionamos as empresas que expõem seus dados e acompanhamos cada pedido de remoção.",
  },
  {
    n: "03",
    Icon: ShieldCheck,
    title: "Proteja",
    text: "Monitore novas exposições, receba alertas e tome medidas para manter seus dados mais protegidos.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-28" style={{ backgroundColor: "#FFFFFF" }}>
      <Container>
        <Reveal>
          <Eyebrow>Como funciona</Eyebrow>
          <SectionTitle className="mt-3">3 passos para mais privacidade</SectionTitle>
        </Reveal>

        <div className="relative mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connector: horizontal on desktop, vertical on mobile. */}
          <span
            className="pointer-events-none absolute left-[27px] top-4 bottom-4 w-px md:left-0 md:right-0 md:top-[30px] md:h-px md:w-auto md:bottom-auto"
            style={{ backgroundColor: "rgba(99,102,241,0.22)" }}
            aria-hidden="true"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 110}>
              {/* items-start keeps the icon level with the title on mobile;
                  without it the icon stretches and centres against the text. */}
              <div className="relative flex items-start gap-5 md:block">
                <div className="relative flex items-center gap-3 md:mb-6">
                  <span
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid rgba(99,102,241,0.22)",
                    }}
                  >
                    <s.Icon className="h-6 w-6" strokeWidth={1.6} style={{ color: LP.indigo }} />
                  </span>
                  <span
                    className="text-[13px] font-bold tracking-wide"
                    style={{ color: LP.indigo }}
                  >
                    {s.n}
                  </span>
                </div>
                <div className="pb-2">
                  <h3 className="text-[19px] font-bold" style={{ color: LP.text }}>
                    {s.title}
                  </h3>
                  <p
                    className="mt-2 max-w-[19rem] text-[14.5px] leading-relaxed"
                    style={{ color: LP.muted }}
                  >
                    {s.text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ── 3. PRODUTO ───────────────────────────────────────────────────── */

const BULLETS = [
  "Relatórios claros e objetivos",
  "Pedidos de remoção acompanhados",
  "Monitoramento contínuo",
  "Alertas sobre novas exposições",
  "Histórico das verificações",
  "Suporte quando necessário",
];

const FLOATING = [
  { Icon: Mail, title: "E-mail exposto", sub: "2 fontes encontradas", pos: "left-0 top-[12%]" },
  {
    Icon: UserRound,
    title: "CPF exposto",
    sub: "3 fontes encontradas",
    pos: "left-0 bottom-[22%]",
  },
  { Icon: Phone, title: "Telefone exposto", sub: "1 fonte encontrada", pos: "right-0 top-[20%]" },
  {
    Icon: FileLock2,
    title: "Dados pessoais",
    sub: "4 riscos identificados",
    pos: "right-0 bottom-[16%]",
  },
];

/** Radar on the phone screen — same idle language as the in-app hero. */
function PhoneRadar() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" fill="none" aria-hidden="true">
      <g stroke={LP.indigo} strokeWidth="0.6" opacity="0.35">
        <circle cx="60" cy="60" r="20" />
        <circle cx="60" cy="60" r="35" />
        <circle cx="60" cy="60" r="50" />
        <circle cx="60" cy="60" r="59" />
      </g>
      <g className="radar-sweep-idle">
        <path d="M60 60 L60 2 A58 58 0 0 1 101 19 Z" fill={LP.indigo} opacity="0.16" />
      </g>
      <circle cx="60" cy="60" r="3" fill={LP.indigo} />
      <circle cx="88" cy="40" r="2" fill={LP.lilac} className="radar-blip" />
      <circle cx="42" cy="84" r="1.8" fill={LP.lilac} className="radar-blip-late" />
    </svg>
  );
}

function PhoneMockup() {
  return (
    <div
      className="relative mx-auto w-[250px] rounded-[42px] p-[10px] shadow-2xl"
      style={{ backgroundColor: "#15151E", boxShadow: "0 30px 70px rgba(15,15,40,0.28)" }}
    >
      <div
        className="relative overflow-hidden rounded-[33px] px-5 pb-6 pt-9"
        style={{ backgroundColor: "#0B0B14", height: 520 }}
      >
        {/* Dynamic Island */}
        <span
          className="absolute left-1/2 top-3 h-[26px] w-[86px] -translate-x-1/2 rounded-full"
          style={{ backgroundColor: "#000" }}
          aria-hidden="true"
        />
        <div className="mt-6 flex justify-center">
          <img
            src="/PRIVA_logo_dark_theme.png"
            alt="PRIVA"
            className="h-[13px] w-auto object-contain"
          />
        </div>
        <p className="mt-7 text-center text-[17px] font-bold leading-snug text-white">
          Encontramos
          <br />
          <span style={{ color: LP.lilac }}>4 exposições</span>
          <br />
          relacionadas aos seus dados.
        </p>
        <div className="mx-auto mt-6 h-[168px] w-[168px]">
          <PhoneRadar />
        </div>
        <div
          className="mt-6 rounded-xl py-3 text-center text-[13px] font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${LP.violet}, ${LP.indigo})` }}
        >
          Ver relatório completo
        </div>
      </div>
    </div>
  );
}

export function Product() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28"
      style={{
        background: `linear-gradient(180deg, ${LP.bgLight} 0%, #F4F3FF 55%, ${LP.bgLight} 100%)`,
      }}
    >
      <Container>
        {/* The right column is wider than the left so the floating cards clear
            the phone instead of sitting on top of it. */}
        <div className="grid items-center gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <Reveal>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: LP.indigo }}
            >
              Sua privacidade em um só lugar
            </p>
            <h2
              className="mt-3 text-[30px] font-bold leading-[1.12] tracking-tight sm:text-[40px]"
              style={{ color: LP.text }}
            >
              Detecta. Remove.
              <br />
              Monitora.
            </h2>
            <p
              className="mt-5 max-w-[30rem] text-[15px] leading-relaxed"
              style={{ color: LP.muted }}
            >
              A Priva procura por possíveis exposições dos seus dados em vazamentos conhecidos e
              fontes públicas, ajuda você a pedir a remoção do que for encontrado e segue de olho
              para avisar quando algo novo aparecer.
            </p>
            <ul className="mt-7 space-y-3.5">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: "rgba(99,102,241,0.12)" }}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} style={{ color: LP.indigo }} />
                  </span>
                  <span className="text-[14.5px]" style={{ color: LP.text }}>
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            {/* Wide enough that the absolutely-placed cards clear the phone:
                (660 - 250) / 2 = 205 per side against 176px cards. */}
            <div className="relative mx-auto max-w-[660px]">
              <PhoneMockup />

              {/* Floating cards: absolute around the phone from lg up, a plain
                  grid below it on smaller screens. */}
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-0 lg:block">
                {FLOATING.map((f, i) => (
                  <div
                    key={f.title}
                    className={`lp-float flex items-center gap-3 rounded-2xl bg-white px-4 py-3 lg:absolute lg:w-[176px] lg:gap-2.5 lg:px-3 ${f.pos}`}
                    style={{
                      border: "1px solid rgba(17,17,26,0.07)",
                      boxShadow: "0 8px 24px rgba(15,15,40,0.08)",
                      animationDelay: `${i * 0.9}s`,
                    }}
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl lg:h-8 lg:w-8"
                      style={{ backgroundColor: "rgba(99,102,241,0.1)" }}
                    >
                      <f.Icon className="h-4 w-4" strokeWidth={1.7} style={{ color: LP.indigo }} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold" style={{ color: LP.text }}>
                        {f.title}
                      </p>
                      <p className="text-[11px]" style={{ color: LP.muted }}>
                        {f.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ── 4. SEGURANÇA E CONFIANÇA ─────────────────────────────────────── */

const PILLARS = [
  {
    Icon: Lock,
    title: "Criptografia de ponta a ponta",
    text: "Seus dados são protegidos em trânsito e em repouso.",
  },
  {
    Icon: FileLock2,
    title: "Compromisso com a LGPD",
    text: "Seguimos a legislação brasileira de proteção de dados em todos os processos.",
  },
  {
    Icon: Ban,
    title: "Nosso negócio é a assinatura, não seus dados",
    text: "Diferente de data brokers, não lucramos vendendo suas informações.",
  },
];

export function Security() {
  return (
    <section id="seguranca" className="py-20 sm:py-28" style={{ backgroundColor: "#FFFFFF" }}>
      <Container>
        <Reveal>
          <Eyebrow>Segurança em primeiro lugar</Eyebrow>
          <SectionTitle className="mt-3">Por que confiar seus dados à Priva?</SectionTitle>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-3xl px-8 py-12 text-center"
              style={{
                background: `linear-gradient(155deg, #12122A 0%, ${LP.dark} 70%)`,
                border: "1px solid rgba(139,124,255,0.18)",
              }}
            >
              <span
                className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full"
                style={{ backgroundColor: LP.violet, opacity: 0.16, filter: "blur(48px)" }}
                aria-hidden="true"
              />
              {/* The brand mark carries this better than a generic padlock, and
                  with no frame around it so it reads as identity, not as UI. */}
              <img src="/PRIVA_mark.png" alt="" className="mx-auto h-20 w-20 object-contain" />
              <h3 className="mt-7 text-[24px] font-bold text-white">
                Seus dados nunca são vendidos
              </h3>
              <p className="mx-auto mt-3 max-w-[22rem] text-[14.5px] leading-relaxed text-white/65">
                A Priva não comercializa, compartilha ou usa seus dados para publicidade.
              </p>
            </div>
          </Reveal>

          <div className="space-y-7">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 100}>
                <div className="flex gap-4">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: "rgba(99,102,241,0.1)" }}
                  >
                    <p.Icon className="h-5 w-5" strokeWidth={1.7} style={{ color: LP.indigo }} />
                  </span>
                  <div>
                    <h3 className="text-[16px] font-bold leading-snug" style={{ color: LP.text }}>
                      {p.title}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: LP.muted }}>
                      {p.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
