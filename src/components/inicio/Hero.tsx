import { useEffect, useState } from "react";
import { ChevronRight, Lock, Menu, ShieldCheck, X, Zap } from "lucide-react";
import { Container, PrivaWordmark, ScanCta } from "./ui";
import { LoginDialog } from "./LoginDialog";
import { useContactDialog } from "./contact-context";
import { LP } from "./theme";

/**
 * Cinematic hero photo (person on a phone at night, urban bokeh, eyes censored).
 *
 * Drop the file at `public/hero-inicio.jpg` and it appears — no code change
 * needed. Until it exists the request 404s and we fall back to the CSS night
 * scene below, so the hero is never broken. The photo already carries its own
 * censor bar; `.lp-censor` in styles.css is there if a future image needs one
 * added.
 */
const HERO_PHOTO = "/hero-inicio.jpg";

const NAV = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Por que Priva?", href: "#seguranca" },
  { label: "Planos", href: "#planos" },
  { label: "Empresas", href: "#empresas" },
];

const TRUST = [
  { Icon: Lock, label: "Seguro e confidencial" },
  { Icon: Zap, label: "Leva menos de 1 minuto" },
  { Icon: ShieldCheck, label: "Seus dados protegidos" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const contact = useContactDialog();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(5,5,13,0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.08)" : "transparent"}`,
      }}
    >
      <Container className="flex h-[72px] items-center justify-between">
        <a href="#topo" aria-label="Priva — início">
          <PrivaWordmark light />
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="text-[14px] text-white/70 transition-colors hover:text-white"
            >
              {n.label}
            </a>
          ))}
          <button
            type="button"
            onClick={contact.open}
            className="text-[14px] text-white/70 transition-colors hover:text-white"
          >
            Contato
          </button>
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="text-[14px] text-white/70 transition-colors hover:text-white"
          >
            Entrar
          </button>
          <ScanCta size="sm">Verificar meus dados</ScanCta>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-xl text-white lg:hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {/* Full-height panel rather than a short dropdown: at 390px a dropdown
          ends mid-hero and the CTA behind it bleeds through. */}
      {open && (
        <div
          className="h-[calc(100dvh-72px)] overflow-y-auto lg:hidden"
          style={{
            backgroundColor: LP.dark,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Container className="flex flex-col gap-1 py-4">
            {NAV.map((n) => (
              <a
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] text-white/80 transition-colors hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                contact.open();
              }}
              className="rounded-xl px-3 py-3 text-left text-[15px] text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              Contato
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setLoginOpen(true);
              }}
              className="rounded-xl px-3 py-3 text-left text-[15px] text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              Entrar
            </button>
            <ScanCta className="mt-2 w-full">Verificar meus dados grátis</ScanCta>
          </Container>
        </div>
      )}

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}

/** Night-city bokeh, drawn in CSS. Stands in for the hero photograph. */
function BokehScene() {
  const lights = [
    { x: 20, y: 18, r: 180, c: "#633CFF", o: 0.72 },
    { x: 58, y: 8, r: 130, c: "#6366F1", o: 0.6 },
    { x: 80, y: 30, r: 200, c: "#8B7CFF", o: 0.42 },
    { x: 38, y: 52, r: 160, c: "#4C2FD6", o: 0.66 },
    { x: 70, y: 62, r: 110, c: "#F0A75A", o: 0.3 },
    { x: 26, y: 78, r: 170, c: "#633CFF", o: 0.44 },
    { x: 88, y: 76, r: 100, c: "#6366F1", o: 0.46 },
    { x: 6, y: 50, r: 90, c: "#8B7CFF", o: 0.32 },
    { x: 50, y: 88, r: 120, c: "#3B2A8C", o: 0.4 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {lights.map((l, i) => (
        <span
          key={i}
          className="lp-bokeh absolute rounded-full"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            height: l.r,
            width: l.r,
            backgroundColor: l.c,
            opacity: l.o,
            filter: `blur(${Math.round(l.r / 3)}px)`,
            animationDelay: `${i * 1.3}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="topo"
      className="relative isolate overflow-hidden"
      style={{ backgroundColor: LP.dark }}
    >
      <Nav />

      {/* The photograph fills the whole hero. Its own left side is nearly black
          and the subject sits to the right, so the scrim below only has to
          finish that falloff behind the copy — the right half stays untouched
          and sharp. */}
      <div className="absolute inset-0">
        {/* Bokeh is the fallback: it shows through only while the photo file is
            missing, and the photo covers it completely once present. */}
        <BokehScene />
        {/* Desktop only. On a phone the copy has to sit on top of the photo,
            which needs so much scrim that both the picture and the text end up
            worse off — mobile gets the dark bokeh scene instead.
            Painted as a background rather than an <img>: a missing file simply
            draws nothing, with no broken-image box and no onError to get wrong. */}
        <div
          className="absolute inset-0 hidden bg-no-repeat lg:block"
          style={{
            backgroundImage: `url("${HERO_PHOTO}")`,
            // `cover` always fills the section, whatever the screen width.
            // Sizing by height instead left bare edges on wide monitors.
            backgroundSize: "cover",
            backgroundPosition: "right center",
          }}
          aria-hidden="true"
        />
        {/* Desktop: hold the scrim solid across the copy column (which ends near
            49%), then fall off fast so the subject and the phone stay clear. */}
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background: `linear-gradient(90deg, ${LP.dark} 0%, rgba(5,5,13,0.95) 32%, rgba(5,5,13,0.85) 44%, rgba(5,5,13,0.35) 54%, rgba(5,5,13,0.05) 62%, rgba(5,5,13,0) 68%)`,
          }}
        />
        {/* Mobile: no photo, so the bokeh only needs taking down a notch to keep
            the headline crisp. */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,5,13,0.82) 0%, rgba(5,5,13,0.68) 55%, rgba(5,5,13,0.55) 100%)",
          }}
        />
      </div>

      <Container className="relative z-10 flex min-h-[92vh] flex-col justify-center pb-16 pt-[110px] lg:min-h-[88vh]">
        <div className="max-w-[620px]">
          <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[60px] lg:text-[68px]">
            Seus dados.
            <br />
            Sob seu <span style={{ color: LP.violet }}>controle.</span>
          </h1>

          <p className="mt-5 max-w-[30rem] text-[16px] leading-relaxed text-white/70 sm:text-[18px]">
            Descubra onde seus dados estão expostos e proteja sua privacidade online com a Priva.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6">
            <ScanCta size="lg" className="w-full sm:w-auto" />
            <a
              href="#como-funciona"
              className="group inline-flex items-center justify-center gap-1 text-[15px] font-semibold text-white transition-opacity hover:opacity-80"
            >
              Conhecer a Priva
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3">
            {TRUST.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[13px] text-white/65">
                <Icon className="h-4 w-4" strokeWidth={1.6} style={{ color: LP.lilac }} />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Glass compliance card — overlays the imagery on large screens. */}
        <div
          className="mt-12 max-w-[330px] rounded-2xl p-5 lg:absolute lg:bottom-[18%] lg:right-8 lg:mt-0"
          style={{
            backgroundColor: "rgba(18,18,32,0.55)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(139,124,255,0.28)",
          }}
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 h-7 w-7 shrink-0"
              strokeWidth={1.5}
              style={{ color: LP.lilac }}
            />
            <p className="text-[14px] leading-snug text-white/85">
              Conformidade com a <span style={{ color: LP.lilac }}>LGPD</span> e padrões globais de
              segurança.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
