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
  ArrowLeft,
  Sparkles,
  Star,
} from "lucide-react";
import { Step, Title, Sub, Hl } from "./ui";
import { PhoneMock } from "./PhoneMock";
import { FadeOut } from "./FadeOut";
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
  | "notifications"
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
  "notifications",
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
        <div>
          <Title>
            Sua proteção digital <Hl>começa agora</Hl>
          </Title>
          <Sub>Vamos entender sua identidade digital para te proteger melhor.</Sub>
        </div>

        {/* The four steps carry the noble area. Without them the screen was a
            headline floating over half a phone of white — and they set the
            expectation the rest of the flow then delivers on. */}
        <ol className="mt-7 space-y-2.5">
          {[
            { n: "01", t: "Detecta", s: "Encontra seus dados expostos" },
            { n: "02", t: "Analisa", s: "Mostra o risco de cada um" },
            { n: "03", t: "Remove", s: "Solicita a remoção conforme a LGPD" },
            { n: "04", t: "Monitora", s: "Avisa quando aparecer algo novo" },
          ].map((b) => (
            <li
              key={b.n}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[12px] font-extrabold"
                style={{ backgroundColor: "rgba(79,70,229,0.10)", color: "#4F46E5" }}
              >
                {b.n}
              </span>
              <span className="min-w-0">
                <span className="block text-[14.5px] font-bold leading-tight text-foreground">
                  {b.t}
                </span>
                <span className="block text-[12px] leading-snug text-muted-foreground">{b.s}</span>
              </span>
            </li>
          ))}
        </ol>
      </Step>
    );
  }

  if (id === "preview") {
    return (
      <Step progress={progress} onBack={back} cta="Continuar" onCta={() => go()}>
        <Title>
          Tudo num <Hl>só lugar</Hl>
        </Title>
        <Sub>Monitore seus dados, descubra riscos e aumente seu nível de proteção.</Sub>
        {/* Cropped by a fixed window rather than a negative margin: the frame
            still runs off the bottom, but it stops before the button instead of
            sitting under it. */}
        <div className="mt-5 flex h-[42vh] max-h-[330px] justify-center overflow-hidden">
          <PhoneMock width={244} />
        </div>
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
        <div>
          <Title>
            Prazer em te conhecer, <Hl>{first}</Hl>!
          </Title>
          <Sub>Antes de começar, três coisas sobre como a gente trabalha.</Sub>
        </div>

        {/* The beat screen earns its place by saying something true, instead of
            being a name repeated back over empty space. */}
        <div className="mt-7 space-y-2.5">
          {[
            { Icon: Lock, t: "Seu CPF vira código", s: "Guardamos o hash, nunca o número." },
            { Icon: Eye, t: "Você vê o que encontramos", s: "Sem enrolação e sem termo técnico." },
            {
              Icon: ShieldCheck,
              t: "Conforme a LGPD",
              s: "Você pede, a gente solicita a remoção.",
            },
          ].map((b) => (
            <div
              key={b.t}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
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
      </Step>
    );
  }

  if (id === "intro") {
    return (
      <Step progress={progress} onBack={back} cta="Começar minha verificação" onCta={() => go()}>
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
      <Step progress={progress} onBack={back} cta="Continuar de graça" onCta={() => go()}>
        <Title>
          Sua proteção <Hl>já está pronta</Hl>
        </Title>
        <Sub>Privacidade não é sorte. É monitoramento, alerta e ação.</Sub>

        {/* The device carries the screen and the claims sit on it, floating.
            Listing them underneath pushed the phone up and the button off; here
            the phone is the page and the button stays where a thumb is. The
            bottom is cropped and blurred out rather than scaled down, so the
            frame keeps its size. */}
        <div className="relative mt-6">
          <div className="mx-auto flex h-[44vh] max-h-[350px] justify-center overflow-hidden">
            <PhoneMock src="/mockup-priva-id.png" width={228} />
          </div>

          <FadeOut height={120} />

          <FloatChip
            Icon={Eye}
            label="Monitoramento contínuo"
            className="left-0 top-6"
            delay="0.15s"
          />
          <FloatChip
            Icon={Bell}
            label="Alerta de vazamento"
            className="right-0 top-[38%]"
            delay="0.3s"
          />
          <FloatChip
            Icon={ShieldCheck}
            label="Remoção via LGPD"
            className="bottom-6 left-2"
            delay="0.45s"
          />
        </div>

        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[12.5px] font-semibold text-foreground">
          <Check className="h-3.5 w-3.5" style={{ color: "var(--color-success)" }} /> Nenhuma
          cobrança agora
        </p>
      </Step>
    );
  }

  if (id === "notifications") {
    return (
      <Step
        progress={progress}
        onBack={back}
        cta="Permitir notificações"
        onCta={() => {
          // The native prompt appears once, ever. Asking is the whole point of
          // this screen; the answer does not gate the flow.
          void (async () => {
            try {
              if (typeof Notification !== "undefined" && Notification.permission === "default") {
                await Notification.requestPermission();
              }
            } catch {
              /* unsupported or blocked — carry on either way */
            }
            gaEvent("notifications_prompted");
            go();
          })();
        }}
        footer={
          <button onClick={() => go()} className="text-[13px] text-muted-foreground">
            Agora não
          </button>
        }
      >
        <Title>
          Posso te avisar quando <Hl>algo mudar</Hl>?
        </Title>
        <Sub>
          Vazamento novo aparece toda semana. O aviso é o que transforma monitoramento em proteção.
        </Sub>

        <div className="mt-7 space-y-2.5">
          {[
            { Icon: Bell, t: "Vazamento novo com seus dados", s: "No dia em que aparecer." },
            { Icon: ShieldCheck, t: "Resposta de uma remoção", s: "Quando uma empresa responder." },
            { Icon: Eye, t: "Mudança no seu score", s: "Para bem ou para mal." },
          ].map((b) => (
            <div
              key={b.t}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
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

        {/* Said plainly, because the alternative is a permission granted under a
            promise we then break. */}
        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-muted-foreground">
          Só avisos sobre a sua privacidade. Sem promoção e sem spam — você desliga quando quiser.
        </p>
      </Step>
    );
  }

  return <Paywall onBack={back} onDone={onDone} />;
}

/** A claim that sits on the device rather than under it. */
function FloatChip({
  Icon,
  label,
  className = "",
  delay = "0s",
}: {
  Icon: typeof Bell;
  label: string;
  className?: string;
  delay?: string;
}) {
  return (
    <span
      className={`absolute z-10 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-2 text-[11.5px] font-bold text-foreground shadow-lg backdrop-blur ${className}`}
      style={{ animation: `chip-in 0.5s cubic-bezier(0.34,1.3,0.5,1) ${delay} both` }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "#4F46E5" }} />
      {label}
    </span>
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
    <Step progress={progress} onBack={onBack} cta="Ver meu relatório completo" onCta={onNext}>
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
    <Step progress={progress} onBack={onBack} cta="Continuar" onCta={onNext}>
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

/**
 * Hard paywall. No dismiss, by design: the report the person just saw is the
 * product, and everything past this point costs money to run — the search, the
 * monitoring, the removal letters. The two ways out are the two plans, plus
 * restore for someone who already paid.
 *
 * The trial belongs to the annual only. The monthly says "sem período de teste"
 * and nothing about refunds: on the App Store refunds are Apple's call, and in
 * Brazil article 49 of the CDC gives seven days of regret regardless — a "no
 * refund" line would be a promise we do not get to make.
 */
function Paywall({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [plan, setPlan] = useState<"anual" | "mensal">("anual");
  const annual = 49.9;
  const monthly = 19.9;
  const perMonth = annual / 12;
  const save = Math.round((1 - annual / (monthly * 12)) * 100);

  const start = () => {
    track("InitiateCheckout", { value: plan === "anual" ? annual : monthly, currency: "BRL" });
    gaEvent("begin_checkout", { plan });
    // Access comes from the store receipt, never from here.
    onDone();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Hero photo, faded into the page.
          A hard edge between a photograph and a UI reads as two screens glued
          together; the gradient makes the page start inside the image. */}
      <div className="relative overflow-hidden">
        {/* Slight zoom so the phone in her hands is readable — enough to see
            the app, not so much that the scene turns into a crop. */}
        <img
          src="/paywall-hero.jpg"
          alt=""
          className="h-[34vh] max-h-[270px] w-full scale-[1.18] object-cover object-[64%_30%]"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
          style={{
            // color-mix keeps the fade on the real background token, so it
            // still lands correctly if the theme changes.
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-background) 0%, transparent) 0%, var(--color-background) 88%)",
          }}
        />
        {/* Back sits over the photo, on a disc so it stays legible whatever the
            image does behind it. */}
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="absolute left-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      {/* No negative margin: it pulled the first line up behind the opaque
          part of the photo and the headline read "grátis". */}
      <div className="px-6 pt-1">
        <h1 className="text-[27px] font-extrabold leading-[1.1] tracking-tight text-foreground">
          Comece seus <Hl>3 dias grátis</Hl>
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          Seu relatório completo já está pronto. A Priva monitora seus dados todos os dias.
        </p>
      </div>

      <div className="mt-6 space-y-2.5 px-6">
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

      <div className="px-6 pb-10 pt-6">
        <button
          onClick={start}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold text-white transition active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
        >
          {plan === "anual" ? "Começar meus 3 dias grátis" : "Assinar plano mensal"}
        </button>

        <p className="mt-3 text-center text-[12px] font-semibold text-foreground">
          {plan === "anual"
            ? "Sem cobrança hoje. Cancele quando quiser."
            : "Cancele quando quiser."}
        </p>
        <p className="mt-1 text-center text-[10.5px] leading-relaxed text-muted-foreground/80">
          {plan === "anual"
            ? `Depois do teste, R$ ${brl(annual)} por ano. Renovação automática.`
            : `R$ ${brl(monthly)} por mês. Renovação automática.`}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10.5px] text-muted-foreground">
          <button onClick={onDone} className="underline-offset-2 hover:underline">
            Restaurar compras
          </button>
          <span aria-hidden>·</span>
          <button onClick={onDone} className="underline-offset-2 hover:underline">
            Gerenciar conta
          </button>
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
