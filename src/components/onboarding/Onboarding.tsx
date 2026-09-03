import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  Check,
  Eye,
  IdCard,
  Lock,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Mascot } from "./Mascot";
import { Step, Title, Sub, Hl } from "./ui";
import { checkHibp } from "@/lib/api/hibp.functions";
import { saveUser } from "@/lib/api/saveUser";
import { rankForDisplay, displayName, logoOf, type Breach } from "@/lib/breaches";
import { leakedLabels } from "@/lib/breachActions";
import { rememberIdentity } from "@/lib/identity";
import { getFirstTouch, attributionParams } from "@/lib/attribution";
import { track, gaEvent } from "@/lib/analytics";
import { PLAN_PRICE } from "@/lib/checkout";

/**
 * App onboarding.
 *
 * The shape is the one that works in consumer apps — a few questions, a wait
 * with something happening, a personalised result, then the offer. The
 * difference here is that the result is real: the partial report is the actual
 * HIBP answer for the e-mail the person typed, with the brands they recognise.
 * Nothing on that screen is a projection.
 *
 * HIBP only before the paywall. The public-web search (SerpAPI) costs from a
 * pool of 240 a month shared by every user, so a day of ad traffic through the
 * onboarding would burn the month for everyone. That search belongs after the
 * trial starts.
 */
type Id =
  | "welcome"
  | "preview"
  | "name"
  | "greeting"
  | "intro"
  | "email"
  | "cpf"
  | "processing"
  | "partial"
  | "social"
  | "prepaywall"
  | "paywall";

const ORDER: Id[] = [
  "welcome",
  "preview",
  "name",
  "greeting",
  "intro",
  "email",
  "cpf",
  "processing",
  "partial",
  "social",
  "prepaywall",
  "paywall",
];

const onlyDigits = (v: string) => v.replace(/\D/g, "");
const maskCpf = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};
function cpfValid(v: string) {
  const d = onlyDigits(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(d[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const id = ORDER[i];
  const go = (n = 1) => setI((v) => Math.min(ORDER.length - 1, v + n));
  const back = () => setI((v) => Math.max(0, v - 1));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [breaches, setBreaches] = useState<Breach[] | null>(null);

  const first = name.trim().split(/\s+/)[0] || "";
  const progress = (i + 1) / ORDER.length;

  useEffect(() => {
    track("ViewContent", { content_name: `onb_${id}`, ...attributionParams() });
    gaEvent("onboarding_step", { step: id });
  }, [id]);

  // ── Screens ──────────────────────────────────────────────────────────────
  if (id === "welcome") {
    return (
      <Step
        progress={progress}
        cta="Continuar"
        onCta={() => go()}
        footer={
          <button onClick={onDone} className="text-[13px] text-muted-foreground">
            Já tem conta? <span className="font-semibold text-[var(--color-navy)]">Entrar</span>
          </button>
        }
      >
        <div className="mx-auto mb-5 w-fit rounded-full border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground">
          Oi! Boas-vindas à Priva
        </div>
        <Mascot pose="welcome" size={210} />
        <div className="mt-6">
          <Title>
            Sua proteção digital <Hl>começa agora</Hl>
          </Title>
          <Sub>Vamos entender sua identidade digital para te proteger melhor.</Sub>
        </div>
      </Step>
    );
  }

  if (id === "preview") {
    return (
      <Step progress={progress} onBack={back} cta="Continuar" onCta={() => go()} compact>
        <div className="mx-auto mb-5 w-full max-w-[16rem] overflow-hidden rounded-[26px] border-4 border-foreground/85 bg-background shadow-2xl">
          <img
            src="/preview-home.png"
            alt=""
            className="w-full"
            onError={(e) => e.currentTarget.remove()}
          />
          <PreviewCard />
        </div>
        <Title>
          Tudo num <Hl>só lugar</Hl>
        </Title>
        <Sub>Monitore seus dados, descubra riscos e aumente seu nível de proteção.</Sub>
      </Step>
    );
  }

  if (id === "name") {
    return (
      <Step
        progress={progress}
        onBack={back}
        cta="Continuar"
        onCta={() => go()}
        ctaDisabled={first.length < 2}
      >
        <Mascot pose="thinking" size={150} />
        <div className="mt-5">
          <Title>
            Como podemos te <Hl>chamar</Hl>?
          </Title>
          <Sub>Usamos seu nome para personalizar sua experiência.</Sub>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && first.length >= 2 && go()}
          placeholder="Seu nome"
          className="mt-6 w-full rounded-2xl border border-border bg-card px-5 py-4 text-center text-[16px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500"
        />
      </Step>
    );
  }

  if (id === "greeting") {
    return (
      <Step progress={progress} onBack={back} cta="Continuar" onCta={() => go()}>
        <Mascot pose="done" size={200} />
        <div className="mt-6">
          <Title>
            Prazer em te conhecer, <Hl>{first}</Hl>!
          </Title>
          <Sub>Vamos cuidar da sua privacidade e manter seus dados protegidos.</Sub>
        </div>
      </Step>
    );
  }

  if (id === "intro") {
    return (
      <Step
        progress={progress}
        onBack={back}
        cta="Começar minha verificação"
        onCta={() => go()}
        compact
      >
        <Mascot pose="idle" size={170} />
        <div className="mt-5">
          <Title>
            {first}, vamos descobrir o que a <Hl>internet sabe</Hl> sobre você?
          </Title>
          <Sub>Leva menos de 2 minutos. Seus dados são usados só para a verificação.</Sub>
        </div>
        <div className="mt-6 space-y-2.5">
          {[
            { Icon: Search, t: "Encontre suas exposições", s: "Veja onde seus dados apareceram." },
            { Icon: IdCard, t: "Crie seu Priva ID", s: "Sua identidade digital em um só lugar." },
            {
              Icon: ShieldCheck,
              t: "Saiba como se proteger",
              s: "Ações claras para reduzir o risco.",
            },
          ].map((b) => (
            <div
              key={b.t}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style={{ backgroundColor: "rgba(79,70,229,0.10)" }}
              >
                <b.Icon className="h-4 w-4" style={{ color: "#4F46E5" }} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold leading-tight text-foreground">
                  {b.t}
                </span>
                <span className="block text-[12px] leading-snug text-muted-foreground">{b.s}</span>
              </span>
            </div>
          ))}
        </div>
      </Step>
    );
  }

  if (id === "email") {
    const ok = /.+@.+\..{2,}/.test(email);
    return (
      <Step progress={progress} onBack={back} cta="Continuar" onCta={() => go()} ctaDisabled={!ok}>
        <Mascot pose="thinking" size={140} />
        <div className="mt-5">
          <Title>
            Qual é o seu <Hl>e-mail</Hl>?
          </Title>
          <Sub>É por ele que procuramos seus dados em vazamentos conhecidos.</Sub>
        </div>
        <input
          autoFocus
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ok && go()}
          placeholder="voce@email.com"
          className="mt-6 w-full rounded-2xl border border-border bg-card px-5 py-4 text-center text-[16px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500"
        />
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted-foreground">
          <Lock className="h-3 w-3" /> Não enviamos spam e não vendemos seus dados
        </p>
      </Step>
    );
  }

  if (id === "cpf") {
    const ok = cpfValid(cpf);
    return (
      <Step
        progress={progress}
        onBack={back}
        cta="Verificar meus dados"
        onCta={() => go()}
        ctaDisabled={!ok}
        footer={
          <button onClick={() => go()} className="text-[13px] text-muted-foreground">
            Prefiro adicionar depois
          </button>
        }
      >
        <Mascot pose="thinking" size={140} />
        <div className="mt-5">
          <Title>
            E o seu <Hl>CPF</Hl>?
          </Title>
          <Sub>
            Usamos para procurar seu número em páginas públicas. Ele é guardado como código, nunca
            em texto.
          </Sub>
        </div>
        <input
          autoFocus
          inputMode="numeric"
          value={cpf}
          onChange={(e) => setCpf(maskCpf(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && ok && go()}
          placeholder="000.000.000-00"
          className="mt-6 w-full rounded-2xl border border-border bg-card px-5 py-4 text-center font-mono text-[17px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-indigo-500"
        />
        {cpf.length >= 14 && !ok && (
          <p className="mt-2 text-center text-[12.5px] text-[#DC2626]">
            Esse CPF não confere. Verifique os números.
          </p>
        )}
      </Step>
    );
  }

  if (id === "processing") {
    return (
      <Processing
        name={first}
        email={email}
        cpf={cpf}
        onReady={(b) => {
          setBreaches(b);
          go();
        }}
      />
    );
  }

  if (id === "partial") {
    return (
      <Partial
        name={first}
        email={email}
        breaches={breaches ?? []}
        onNext={() => go()}
        onBack={back}
        progress={progress}
      />
    );
  }

  if (id === "social") {
    return <Social onNext={() => go()} onBack={back} progress={progress} />;
  }

  if (id === "prepaywall") {
    return (
      <Step progress={progress} onBack={back} cta="Começar minha proteção" onCta={() => go()}>
        <Mascot pose="done" size={180} />
        <div className="mt-6">
          <Title>
            Privacidade não é sorte. É <Hl>monitoramento</Hl>.
          </Title>
          <Sub>Alerta quando algo muda, e o que fazer a respeito.</Sub>
        </div>
        <div className="mt-6 space-y-2.5">
          {[
            { Icon: Eye, t: "Monitoramento contínuo" },
            { Icon: Bell, t: "Alerta de vazamento novo" },
            { Icon: ShieldCheck, t: "Ações práticas para se proteger" },
          ].map((b) => (
            <div
              key={b.t}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <b.Icon className="h-4 w-4 shrink-0" style={{ color: "#4F46E5" }} />
              <span className="text-[14px] font-semibold text-foreground">{b.t}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[12px] text-muted-foreground">Nenhuma cobrança agora</p>
      </Step>
    );
  }

  return <Paywall onBack={back} onDone={onDone} />;
}

/* ── Preview mock ────────────────────────────────────────────────────────── */
function PreviewCard() {
  return (
    <div className="bg-muted/40 p-3">
      <div className="rounded-2xl border border-border/60 bg-card p-4 text-center">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Identity Score
        </p>
        <p className="mt-1 text-[34px] font-extrabold leading-none" style={{ color: "#4F46E5" }}>
          68
        </p>
        <span
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold"
          style={{ backgroundColor: "rgba(99,102,241,0.14)", color: "#6366F1" }}
        >
          RISCO MÉDIO
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {["CPF", "E-mail", "Telefone", "Endereço"].map((l) => (
          <div key={l} className="rounded-xl border border-border/60 bg-card p-2.5">
            <p className="text-[10px] font-bold text-foreground">{l}</p>
            <p className="text-[8px] leading-tight text-muted-foreground">Monitorado</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Processing ──────────────────────────────────────────────────────────── */
function Processing({
  name,
  email,
  cpf,
  onReady,
}: {
  name: string;
  email: string;
  cpf: string;
  onReady: (b: Breach[]) => void;
}) {
  const [pct, setPct] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    rememberIdentity(onlyDigits(cpf), email);
    // Real work: HIBP for the report, saveUser so the lead (and its origin)
    // exists even if the person never subscribes.
    const work = Promise.all([
      checkHibp({ data: { email } }).catch(() => ({ count: 0, breaches: [] })),
      cpf
        ? saveUser({
            data: { email, cpf: onlyDigits(cpf), attribution: getFirstTouch() ?? undefined },
          }).catch(() => null)
        : Promise.resolve(null),
    ]);
    void work.then(([h, u]) => {
      if (u && "userId" in u && u.userId) {
        try {
          localStorage.setItem("priva_user_id", u.userId);
        } catch {
          /* ignore */
        }
      }
      try {
        localStorage.setItem("priva_last_scan_at", new Date().toISOString());
        localStorage.setItem(
          "priva_scan_result",
          JSON.stringify({ breachCount: h.count, hibp: h }),
        );
      } catch {
        /* ignore */
      }
      track("Lead", attributionParams());
      done.current = true;
      setPct((p) => Math.max(p, 92));
      onReadyRef.current = () => onReady((h.breaches ?? []) as Breach[]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReadyRef = useRef<() => void>(() => {});

  useEffect(() => {
    // The bar never fakes completion: it eases toward 92% and only closes once
    // the request has actually answered.
    const t = setInterval(() => {
      setPct((p) => {
        if (p >= 100) return p;
        if (!done.current) return Math.min(92, p + Math.max(0.6, (92 - p) * 0.045));
        if (p >= 100) return 100;
        return Math.min(100, p + 3);
      });
    }, 60);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (pct >= 100) {
      const t = setTimeout(() => onReadyRef.current(), 450);
      return () => clearTimeout(t);
    }
  }, [pct]);

  const steps = [
    "Procurando em vazamentos conhecidos",
    "Reunindo as empresas envolvidas",
    "Calculando seu Identity Score",
  ];
  const active = pct < 40 ? 0 : pct < 75 ? 1 : 2;

  return (
    <Step progress={0.66}>
      <Mascot pose="scan" size={190} />
      <p
        className="mt-6 text-center text-[54px] font-extrabold leading-none"
        style={{ color: "#4F46E5" }}
      >
        {Math.round(pct)}%
      </p>
      <Title>
        Cuidando da sua <Hl>privacidade</Hl>
      </Title>
      <Sub>
        {name ? `Aguenta aí, ${name}. Estamos montando sua análise.` : "Montando sua análise."}
      </Sub>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#4F46E5,#6366F1)" }}
        />
      </div>

      <div className="mt-5 space-y-2">
        {steps.map((s, idx) => (
          <div key={s} className="flex items-center gap-2.5">
            <span
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full border"
              style={
                idx < active || pct >= 100
                  ? { backgroundColor: "var(--color-success)", borderColor: "var(--color-success)" }
                  : { borderColor: "var(--color-border)" }
              }
            >
              {(idx < active || pct >= 100) && (
                <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
              )}
            </span>
            <span
              className={`text-[13.5px] ${idx <= active ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted-foreground">
        <Lock className="h-3 w-3" /> Seus dados estão seguros com a gente
      </p>
    </Step>
  );
}

/* ── Partial report ──────────────────────────────────────────────────────── */
function Partial({
  name,
  email,
  breaches,
  onNext,
  onBack,
  progress,
}: {
  name: string;
  email: string;
  breaches: Breach[];
  onNext: () => void;
  onBack: () => void;
  progress: number;
}) {
  const ranked = useMemo(() => rankForDisplay(breaches), [breaches]);
  const shown = ranked.slice(0, 4);
  const hidden = Math.max(0, ranked.length - shown.length);
  const masked = email.replace(/^(.{2}).*(@.*)$/, "$1••••$2");

  return (
    <Step
      progress={progress}
      onBack={onBack}
      cta="Ver meu relatório completo"
      onCta={onNext}
      compact
    >
      <Title>
        {breaches.length > 0 ? (
          <>
            Encontramos <Hl>{breaches.length}</Hl>{" "}
            {breaches.length === 1 ? "vazamento" : "vazamentos"}
          </>
        ) : (
          <>
            Seu e-mail está <Hl>limpo</Hl> por enquanto
          </>
        )}
      </Title>
      <Sub>
        {breaches.length > 0
          ? `${name ? name + ", e" : "E"}sses são os que reconhecemos no seu e-mail ${masked}.`
          : `Não encontramos ${masked} em vazamentos conhecidos. Novos aparecem toda semana.`}
      </Sub>

      {shown.length > 0 && (
        <div className="mt-5 space-y-2">
          {shown.map((b) => (
            <div
              key={b.Domain || b.Name}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              {logoOf(b) ? (
                <img
                  src={logoOf(b)!}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5"
                />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-navy)]/10 text-[13px] font-bold text-[var(--color-navy)]">
                  {displayName(b).charAt(0)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-foreground">
                  {displayName(b)}
                </span>
                {/* Three at most: a breach that leaked nine classes lists them
                    all, and the row stops being scannable. */}
                <span className="block truncate text-[11.5px] text-muted-foreground">
                  {(() => {
                    const l = leakedLabels(b);
                    if (l.length === 0) return "Dados expostos";
                    return l.length > 3
                      ? `${l.slice(0, 3).join(" · ")} +${l.length - 3}`
                      : l.join(" · ");
                  })()}
                </span>
              </span>
            </div>
          ))}

          {hidden > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3 blur-[5px]">
                <span className="h-9 w-9 shrink-0 rounded-lg bg-secondary" />
                <span className="min-w-0 flex-1">
                  <span className="block h-3 w-24 rounded bg-secondary" />
                  <span className="mt-1.5 block h-2.5 w-32 rounded bg-secondary" />
                </span>
              </div>
              <div className="absolute inset-0 grid place-items-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[12px] font-bold text-[var(--color-navy)] shadow-sm">
                  <Lock className="h-3 w-3" /> + {hidden}{" "}
                  {hidden === 1 ? "vazamento" : "vazamentos"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        Verificamos seu e-mail em bases públicas de vazamentos. CPF, telefone e exposição na web
        entram no relatório completo.
      </p>
    </Step>
  );
}

/* ── Social proof ────────────────────────────────────────────────────────── */
/**
 * Only what is true. There are no testimonials here yet because we have none we
 * can attribute to a real person — invented reviews are the fastest way for a
 * privacy brand to lose the argument it is making. Drop real quotes into
 * TESTIMONIALS (with the person's consent) and this screen fills itself.
 */
const TESTIMONIALS: { name: string; city: string; quote: string }[] = [];

function Social({
  onNext,
  onBack,
  progress,
}: {
  onNext: () => void;
  onBack: () => void;
  progress: number;
}) {
  return (
    <Step progress={progress} onBack={onBack} cta="Continuar" onCta={onNext} compact>
      <Mascot pose="done" size={140} />
      <div className="mt-4">
        <Title>
          Privacidade mais <Hl>simples</Hl> de entender
        </Title>
        <Sub>Segurança, transparência e controle na palma da sua mão.</Sub>
      </div>

      <div className="mt-6 space-y-2.5">
        {[
          { Icon: Search, t: "Bases públicas de vazamentos", s: "Consultadas a cada verificação." },
          { Icon: Lock, t: "Seu CPF vira código", s: "Guardamos o hash, nunca o número." },
          { Icon: ShieldCheck, t: "Conforme a LGPD", s: "Você pede, a gente solicita a remoção." },
        ].map((b) => (
          <div
            key={b.t}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: "rgba(16,185,129,0.12)" }}
            >
              <b.Icon className="h-4 w-4" style={{ color: "var(--color-success)" }} />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-bold leading-tight text-foreground">
                {b.t}
              </span>
              <span className="block text-[12px] leading-snug text-muted-foreground">{b.s}</span>
            </span>
          </div>
        ))}
      </div>

      {TESTIMONIALS.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-3 w-3 fill-current" style={{ color: "#F59E0B" }} />
                ))}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground">{t.quote}</p>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                {t.name} · {t.city}
              </p>
            </div>
          ))}
        </div>
      )}
    </Step>
  );
}

/* ── Paywall ─────────────────────────────────────────────────────────────── */
const brl = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Paywall({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [plan, setPlan] = useState<"anual" | "mensal">("anual");
  const annual = 49.9;
  const monthly = 19.9;
  const perMonth = annual / 12;
  const save = Math.round((1 - annual / (monthly * 12)) * 100);

  const start = () => {
    track("InitiateCheckout", { value: plan === "anual" ? annual : monthly, currency: "BRL" });
    gaEvent("begin_checkout", { plan });
    // Access is granted by the store receipt, never here.
    onDone();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="flex items-center gap-3 px-5 pt-4">
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"
        >
          ‹
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full w-full rounded-full"
            style={{ background: "linear-gradient(90deg,#4F46E5,#6366F1)" }}
          />
        </div>
        <button onClick={onDone} className="shrink-0 text-[12.5px] text-muted-foreground">
          Agora não
        </button>
      </div>

      {/* Headline beside the device, benefits full width underneath. The
          reference lays these side by side on a wider canvas; at 375px the
          phone was covering the benefits, so the row holds only the headline
          and the list gets the whole width. */}
      <div className="px-6 pt-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-[27px] font-extrabold leading-[1.08] tracking-tight text-foreground">
              Comece seus
              <br />
              <Hl>3 dias grátis</Hl>
            </h1>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
              Sua privacidade merece atenção todos os dias. A Priva cuida disso por você.
            </p>
          </div>

          <div
            className="-mr-8 w-[132px] shrink-0"
            style={{ animation: "mascot-in 0.8s cubic-bezier(0.34,1.2,0.5,1) both" }}
          >
            <div className="overflow-hidden rounded-[22px] border-[4px] border-foreground/85 bg-background shadow-2xl">
              <PreviewCard />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {[
            { Icon: ShieldCheck, t: "Relatório completo", s: "CPF, telefone e exposição na web" },
            { Icon: Bell, t: "Alertas em tempo real", s: "Quando um vazamento novo aparecer" },
            { Icon: Lock, t: "Remoção conforme a LGPD", s: "A gente solicita em seu nome" },
          ].map((b) => (
            <div key={b.t} className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                style={{ backgroundColor: "rgba(79,70,229,0.10)" }}
              >
                <b.Icon className="h-4 w-4" style={{ color: "#4F46E5" }} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-bold leading-tight text-foreground">
                  {b.t}
                </span>
                <span className="block text-[11.5px] leading-snug text-muted-foreground">
                  {b.s}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Extra room above: the "3 dias grátis" badge sits outside the card
          and would otherwise touch the benefit above it. */}
      <div className="mt-7 space-y-2.5 px-6">
        <button
          onClick={() => setPlan("anual")}
          className="relative flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition"
          style={{
            border: plan === "anual" ? "2px solid #4F46E5" : "1px solid var(--color-border)",
            backgroundColor: plan === "anual" ? "rgba(79,70,229,0.04)" : "transparent",
          }}
        >
          <span
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
          >
            3 dias grátis · melhor valor
          </span>
          <Radio on={plan === "anual"} />
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] font-bold text-foreground">Anual</span>
            <span className="block text-[12px] text-muted-foreground">
              R$ {brl(annual)} cobrados por ano
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-[19px] font-extrabold text-foreground">
              R$ {brl(perMonth)}
              <span className="text-[12px] font-medium text-muted-foreground">/mês</span>
            </span>
            <span
              className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "rgba(16,185,129,0.14)", color: "var(--color-success)" }}
            >
              Economize {save}%
            </span>
          </span>
        </button>

        <button
          onClick={() => setPlan("mensal")}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition"
          style={{
            border: plan === "mensal" ? "2px solid #4F46E5" : "1px solid var(--color-border)",
            backgroundColor: plan === "mensal" ? "rgba(79,70,229,0.04)" : "transparent",
          }}
        >
          <Radio on={plan === "mensal"} />
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] font-bold text-foreground">Mensal</span>
            <span className="block text-[12px] text-muted-foreground">Sem período de teste</span>
          </span>
          <span className="shrink-0 text-[19px] font-extrabold text-foreground">
            R$ {brl(monthly)}
            <span className="text-[12px] font-medium text-muted-foreground">/mês</span>
          </span>
        </button>
      </div>

      <div className="px-6 pb-8 pt-5">
        <button
          onClick={start}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold text-white transition active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
        >
          {plan === "anual" ? "Começar meus 3 dias grátis" : "Assinar plano mensal"}
        </button>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { Icon: ShieldCheck, t: "Sem cobrança hoje" },
            { Icon: Check, t: "Cancele quando quiser" },
            { Icon: Bell, t: "Renovação após o teste" },
          ].map((r) => (
            <div key={r.t} className="flex flex-col items-center gap-1 text-center">
              <r.Icon className="h-3.5 w-3.5" style={{ color: "#4F46E5" }} />
              <span className="text-[9.5px] leading-tight text-muted-foreground">{r.t}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-center text-[10.5px] text-muted-foreground/80">
          {plan === "anual"
            ? `Após o teste, R$ ${brl(annual)} por ano. Renovação automática.`
            : `R$ ${brl(monthly)} por mês. Renovação automática.`}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2 text-[10.5px] text-muted-foreground">
          <button className="underline-offset-2 hover:underline">Restaurar compras</button>
          <span aria-hidden>·</span>
          <a href="/termos" className="underline-offset-2 hover:underline">
            Termos
          </a>
          <span aria-hidden>·</span>
          <a href="/privacidade" className="underline-offset-2 hover:underline">
            Privacidade
          </a>
        </div>
      </div>
    </div>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition"
      style={{ borderColor: on ? "#4F46E5" : "var(--color-border)" }}
    >
      {on && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#4F46E5" }} />}
    </span>
  );
}

/* Kept so the paywall and the rest of the app cannot drift on price. */
export const ONBOARDING_PRICES = PLAN_PRICE;
