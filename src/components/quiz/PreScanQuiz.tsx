import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock,
  HelpCircle,
  IdCard,
  KeyRound,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { formatCPF, isValidCPF, isValidEmail } from "@/lib/funnel";
import { suggestEmailFix } from "@/lib/emailSuggest";
import { EmailTypoHint } from "@/components/EmailTypoHint";
import { track, gaEvent } from "@/lib/analytics";
import {
  Q2_ADDRESS,
  Q2_CPF,
  Q2_EMAIL,
  Q2_PASSWORDS,
  Q2_PHONE,
  Q2_UNSURE,
  saveQuizQ1,
  saveQuizQ2,
  saveQuizQ3,
} from "@/lib/quiz";

const Q1_OPTIONS = ["Sim, com frequência", "Às vezes", "Raramente", "Nunca recebi"];

const Q2_OPTIONS = [
  { Icon: Mail, label: Q2_EMAIL },
  { Icon: IdCard, label: Q2_CPF },
  { Icon: Phone, label: Q2_PHONE },
  { Icon: MapPin, label: Q2_ADDRESS },
  { Icon: KeyRound, label: Q2_PASSWORDS },
  { Icon: HelpCircle, label: Q2_UNSURE },
];

const Q3_OPTIONS = [
  "Nunca verifiquei",
  "Faz mais de 1 ano",
  "Tentei mas não confiei no resultado",
  "Verifico regularmente",
];

const AUTO_ADVANCE_MS = 400;

/** Header block shared by every step: icon, question, supporting line. */
function StepHeader({
  Icon,
  iconClass = "text-indigo-400",
  title,
  subtitle,
}: {
  Icon: typeof Shield;
  iconClass?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <Icon className={`mx-auto mb-4 h-8 w-8 ${iconClass}`} strokeWidth={1.8} />
      <h2 className="mx-auto mb-2 max-w-xs text-center text-xl font-bold leading-snug text-foreground">
        {title}
      </h2>
      <p className="text-center text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/** Four dots + "Etapa N de 4". */
function Progress({ step }: { step: number }) {
  return (
    <div className="pt-1">
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              i === step
                ? "scale-125 bg-indigo-500"
                : i < step
                  ? "bg-indigo-500/40"
                  : "bg-foreground/10"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-gray-500">Etapa {step + 1} de 4</p>
    </div>
  );
}

function OptionCard({
  selected,
  multi,
  Icon,
  label,
  compact,
  onClick,
}: {
  selected: boolean;
  multi?: boolean;
  Icon?: typeof Shield;
  label: string;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-4 rounded-2xl border px-5 text-left transition-all duration-200 active:scale-[0.99] ${
        compact ? "py-3.5" : "py-4"
      } ${selected ? "border-indigo-500 bg-indigo-500/10" : "border-border bg-card"}`}
    >
      {multi ? (
        <span
          // explicit radius: the app's --radius makes `rounded-md` (12px) look
          // like a circle on a 20px box, which would read as a radio button
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-2 transition-colors duration-200 ${
            selected ? "border-indigo-500 bg-indigo-500" : "border-foreground/20"
          }`}
        >
          {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </span>
      ) : (
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 ${
            selected ? "border-indigo-500" : "border-foreground/20"
          }`}
        >
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />}
        </span>
      )}
      {Icon && (
        <Icon
          className={`h-[18px] w-[18px] shrink-0 ${selected ? "text-indigo-400" : "text-muted-foreground"}`}
          strokeWidth={1.8}
        />
      )}
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

/**
 * Pre-scan quiz: 3 commitment questions before the CPF/e-mail capture (step 4).
 * Replaces the direct CPF form as the entry into the scan — by the time the CPF
 * field appears the lead has already named their own fears, and the capture
 * screen is framed with their answers. On submit it hands (cpf, email) to the
 * existing scan, which is untouched.
 */
export function PreScanQuiz({
  defaultEmail = "",
  onComplete,
  onExit,
}: {
  defaultEmail?: string;
  onComplete: (cpf: string, email: string) => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState<string[]>([]);
  const [q3, setQ3] = useState("");

  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [emailFix, setEmailFix] = useState<string | null>(null);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  const firedComplete = useRef(false);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  // Reaching the capture screen is the conversion signal worth optimizing for.
  useEffect(() => {
    if (step !== 3 || firedComplete.current) return;
    firedComplete.current = true;
    track("Lead");
    gaEvent("quiz_completed");
  }, [step]);

  const goTo = (next: number, direction: "fwd" | "back") => {
    firstRender.current = false;
    setDir(direction);
    setStep(next);
  };

  const back = () => {
    if (advanceTimer.current) return;
    if (step === 0) onExit();
    else goTo(step - 1, "back");
  };

  // Single-select steps show the selection for a beat before moving on, so the
  // advance reads as deliberate rather than as the screen being yanked away.
  const selectAndAdvance = (value: string, onPick: (v: string) => void, next: number) => {
    if (advanceTimer.current) return; // ignore taps while an advance is pending
    onPick(value);
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      goTo(next, "fwd");
    }, AUTO_ADVANCE_MS);
  };

  const pickQ1 = (opt: string) =>
    selectAndAdvance(
      opt,
      (v) => {
        setQ1(v);
        saveQuizQ1(v);
        track("ViewContent", { content_name: "quiz_q1" });
        gaEvent("quiz_q1_answered", { answer: v });
      },
      1,
    );

  const toggleQ2 = (label: string) =>
    setQ2((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));

  const submitQ2 = () => {
    if (q2.length === 0) return;
    saveQuizQ2(q2);
    gaEvent("quiz_q2_answered", { count: q2.length, includes_cpf: q2.includes(Q2_CPF) });
    goTo(2, "fwd");
  };

  const pickQ3 = (opt: string) =>
    selectAndAdvance(
      opt,
      (v) => {
        setQ3(v);
        saveQuizQ3(v);
        gaEvent("quiz_q3_answered", { answer: v });
      },
      3,
    );

  const captureValid = isValidCPF(cpf) && isValidEmail(email);
  const submitCapture = () => {
    if (captureValid) onComplete(cpf, email.trim());
  };

  // The capture screen echoes what the user just told us in Q2. Split in three
  // so the operative word can carry the indigo highlight in every variant.
  const captureTitle =
    q2.includes(Q2_EMAIL) || q2.includes(Q2_CPF)
      ? { pre: "Vamos verificar os dados que você ", hi: "indicou", post: "." }
      : q2.includes(Q2_UNSURE)
        ? { pre: "Vamos descobrir o que está ", hi: "exposto", post: " sobre você." }
        : { pre: "Agora vamos verificar sua ", hi: "exposição", post: "." };

  const anim = firstRender.current
    ? "animate-quiz-fade-up"
    : dir === "fwd"
      ? "animate-quiz-slide-left"
      : "animate-quiz-slide-right";

  const inputClass =
    "w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-11 text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-col px-6 pb-8">
        {/* Fixed top: back + progress */}
        <div className="relative pt-4">
          <button
            type="button"
            onClick={back}
            aria-label="Voltar"
            className="absolute left-0 top-3 grid h-9 w-9 place-items-center rounded-full text-gray-500 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Progress step={step} />
        </div>

        {/* Content sits high on the screen (not vertically centred): the question
            and the first options must land in the top half, where the eye goes. */}
        <div key={step} className={`flex flex-1 flex-col pb-6 pt-8 ${anim}`}>
          {step === 0 && (
            <>
              <StepHeader
                Icon={PhoneCall}
                title="Você já recebeu mensagens ou ligações suspeitas pedindo seus dados?"
                subtitle="Golpistas usam dados vazados para abordagens direcionadas."
              />
              <div className="space-y-3">
                {Q1_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={q1 === opt}
                    onClick={() => pickQ1(opt)}
                  />
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <StepHeader
                Icon={Shield}
                title="Quais dados seus você acredita que estão expostos na internet?"
                subtitle="Selecione todos que se aplicam."
              />
              <div className="space-y-2.5">
                {Q2_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.label}
                    multi
                    compact
                    Icon={o.Icon}
                    label={o.label}
                    selected={q2.includes(o.label)}
                    onClick={() => toggleQ2(o.label)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={submitQ2}
                disabled={q2.length === 0}
                className="mt-5 w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <StepHeader
                Icon={Clock}
                title="Há quanto tempo você não verifica se seus dados foram vazados?"
                subtitle="A maioria dos brasileiros nunca verificou."
              />
              <div className="space-y-3">
                {Q3_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={q3 === opt}
                    onClick={() => pickQ3(opt)}
                  />
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Brand mark — this is the moment we ask for a CPF, so the screen
                  should look like it belongs to a company, not to a form. */}
              <img
                src="/icon-192.png"
                alt="Priva"
                className="mx-auto mb-4 h-14 w-14"
                width={56}
                height={56}
              />
              <h2 className="mb-2 text-center text-[22px] font-bold leading-snug text-foreground">
                {captureTitle.pre}
                <span className="text-indigo-600 dark:text-indigo-400">{captureTitle.hi}</span>
                {captureTitle.post}
              </h2>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                Análise gratuita · Resultado em 30 segundos
              </p>

              <label className="mb-1.5 block text-[13px] font-semibold text-foreground">CPF</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                <input
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  className={inputClass}
                />
                <IdCard className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-indigo-400" />
              </div>

              <label className="mb-1.5 mt-4 block text-[13px] font-semibold text-foreground">
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailFix(null);
                  }}
                  onBlur={() => setEmailFix(suggestEmailFix(email))}
                  onKeyDown={(e) => e.key === "Enter" && submitCapture()}
                  placeholder="seu@email.com"
                  className={inputClass}
                />
                <Mail className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-indigo-400" />
              </div>
              {emailFix && (
                <EmailTypoHint
                  suggestion={emailFix}
                  onAccept={() => {
                    setEmail(emailFix);
                    setEmailFix(null);
                  }}
                />
              )}

              <button
                type="button"
                onClick={submitCapture}
                disabled={!captureValid}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Fazer scan gratuito <ArrowRight className="h-5 w-5" />
              </button>

              <p className="mt-3 text-center text-xs leading-snug text-muted-foreground">
                Ao continuar, você concorda com os{" "}
                <a
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 underline"
                >
                  Termos
                </a>{" "}
                e a{" "}
                <a
                  href="https://www.iubenda.com/privacy-policy/23107752"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 underline"
                >
                  Política de Privacidade
                </a>
                .
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { Icon: Lock, label: "Criptografado" },
                  { Icon: Landmark, label: "Empresa BR" },
                  { Icon: BadgeCheck, label: "Conforme LGPD" },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/10 bg-card px-1.5 py-2"
                    style={{ boxShadow: "0 2px 8px rgba(15,15,30,0.05)" }}
                  >
                    <t.Icon className="h-3.5 w-3.5 shrink-0 text-indigo-500" strokeWidth={1.8} />
                    <span className="text-[10px] font-medium text-foreground">{t.label}</span>
                  </div>
                ))}
              </div>

              {/* Concrete promise, not a vague one: the CPF really is hashed
                  server-side (saveUser) and never stored as typed. */}
              <div className="mt-3 flex gap-3 rounded-2xl border border-border bg-card p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">Seus dados estão seguros</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    Conexão criptografada. Seu CPF vira um código irreversível — nunca guardamos o
                    número digitado.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-center text-[11px] text-muted-foreground/70">
                PRIVA © {new Date().getFullYear()} · Todos os direitos reservados.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
