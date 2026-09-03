import { useMemo, useState, type ComponentType } from "react";
import { IncidentMark } from "./IncidentMark";
import {
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  Smartphone,
  MapPinOff,
  KeyRound,
  Check,
  ExternalLink,
  Phone,
  ShieldCheck,
  MapPin,
  PhoneOff,
  Laptop,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

/**
 * Incident Mode — triage, then a concrete checklist.
 *
 * Designed for the worst moment someone will use this app: phone stolen,
 * money gone, account taken. Everything here is sized and spaced for a person
 * whose hands are shaking — big targets, one idea per row, the number of the
 * step where the eye lands first, and a way out to the real emergency line at
 * the bottom of every list.
 *
 * A step only carries a button when there is somewhere real to go. Adding
 * "Ver como fazer" to a step with no destination would be the cruellest
 * possible place for a dead end.
 *
 * Progress lives in localStorage per type (`priva_incident_<tipo>`).
 * Practical orientation, not legal advice — the footer says so.
 */
type Tipo = "golpe" | "roubo" | "perda" | "senha_vazada";

type Step = {
  title: string;
  desc: string;
  Icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  tone: string;
  /** External destination, when one genuinely exists. */
  link?: { label: string; href: string };
  /** Somewhere inside the app. */
  go?: { label: string; tab: "protecao" | "atividade"; pill?: string };
};

const TYPES: {
  id: Tipo;
  label: string;
  sub: string;
  Icon: typeof AlertTriangle;
  tone: string;
}[] = [
  {
    id: "golpe",
    label: "Golpe ou Pix indevido",
    sub: "Fui enganado ou fiz um Pix para um golpista",
    Icon: AlertTriangle,
    tone: "#EF4444",
  },
  {
    id: "roubo",
    label: "Roubo ou furto do celular",
    sub: "Levaram meu aparelho",
    Icon: Smartphone,
    tone: "#F59E0B",
  },
  {
    id: "perda",
    label: "Perdi o celular",
    sub: "Não sei onde está o aparelho",
    Icon: MapPinOff,
    tone: "#4F46E5",
  },
  {
    id: "senha_vazada",
    label: "Vazou minha senha",
    sub: "Uma senha minha foi exposta",
    Icon: KeyRound,
    tone: "#10B981",
  },
];

const BO = {
  label: "Registrar B.O.",
  href: "https://www.gov.br/pt-br/servicos/registrar-ocorrencia-policial",
};
const FIND_IOS = { label: "Abrir busca", href: "https://www.icloud.com/find" };
const FIND_ANDROID = { label: "Abrir busca", href: "https://www.google.com/android/find" };

const CHECKLISTS: Record<Tipo, Step[]> = {
  golpe: [
    {
      title: "Acione seu banco agora",
      desc: "Peça o MED, o Mecanismo Especial de Devolução do Pix. Quanto antes, maior a chance.",
      Icon: Phone,
      tone: "#EF4444",
    },
    {
      title: "Anote tudo do golpe",
      desc: "Valor, data, chave ou QR usado e o nome de quem recebeu.",
      Icon: AlertTriangle,
      tone: "#F59E0B",
    },
    {
      title: "Registre o boletim de ocorrência",
      desc: "Pela delegacia eletrônica do seu estado, com os dados que você anotou.",
      Icon: ShieldCheck,
      tone: "#4F46E5",
      link: BO,
    },
    {
      title: "Denuncie a chave Pix",
      desc: "Pelo app do seu banco, que encaminha ao Banco Central.",
      Icon: KeyRound,
      tone: "#4F46E5",
    },
    {
      title: "Troque as senhas do banco",
      desc: "Comece pelo banco e pelos apps de pagamento.",
      Icon: KeyRound,
      tone: "#10B981",
      go: { label: "Ver contas", tab: "protecao", pill: "credenciais" },
    },
    {
      title: "Ative a verificação em duas etapas",
      desc: "Nos apps financeiros, antes de qualquer outra coisa.",
      Icon: ShieldCheck,
      tone: "#10B981",
    },
    {
      title: "Desconfie de quem oferecer devolver",
      desc: "Contato prometendo recuperar o valor costuma ser o mesmo golpista.",
      Icon: AlertTriangle,
      tone: "#EF4444",
    },
  ],
  roubo: [
    {
      title: "Bloqueie sua linha",
      desc: "Ligue para a operadora e bloqueie o chip para evitar fraude no seu número.",
      Icon: PhoneOff,
      tone: "#EF4444",
    },
    {
      title: "Bloqueie o aparelho pelo IMEI",
      desc: "A operadora bloqueia o aparelho na rede, não só a linha.",
      Icon: Smartphone,
      tone: "#F59E0B",
    },
    {
      title: "Apague os dados à distância",
      desc: "Marque como perdido e apague pelo Buscar (iPhone) ou Encontrar (Android).",
      Icon: MapPin,
      tone: "#4F46E5",
      link: FIND_IOS,
    },
    {
      title: "Avise o banco e bloqueie os cartões",
      desc: "Pela central de atendimento, de outro telefone.",
      Icon: Phone,
      tone: "#EF4444",
    },
    {
      title: "Troque suas senhas principais",
      desc: "De outro aparelho: e-mail primeiro, depois banco e redes.",
      Icon: KeyRound,
      tone: "#10B981",
      go: { label: "Ver contas", tab: "protecao", pill: "credenciais" },
    },
    {
      title: "Encerre as sessões abertas",
      desc: "WhatsApp, e-mail e redes sociais que seguem conectados no aparelho.",
      Icon: Laptop,
      tone: "#4F46E5",
    },
    {
      title: "Registre o boletim de ocorrência",
      desc: "Informe o IMEI do aparelho no registro.",
      Icon: ShieldCheck,
      tone: "#4F46E5",
      link: BO,
    },
  ],
  perda: [
    {
      title: "Tente localizar seu celular",
      desc: "Use o Buscar no iPhone ou o Encontrar meu dispositivo no Android.",
      Icon: MapPin,
      tone: "#4F46E5",
      link: FIND_ANDROID,
    },
    {
      title: "Marque o aparelho como perdido",
      desc: "Bloqueie o acesso e mostre uma mensagem para quem encontrá-lo.",
      Icon: Smartphone,
      tone: "#F59E0B",
      link: FIND_IOS,
    },
    {
      title: "Proteja sua linha",
      desc: "Peça o bloqueio temporário do chip ou eSIM para evitar fraudes.",
      Icon: PhoneOff,
      tone: "#10B981",
    },
    {
      title: "Troque suas senhas principais",
      desc: "Comece pelo e-mail e depois bancos e redes sociais.",
      Icon: KeyRound,
      tone: "#4F46E5",
      go: { label: "Ver contas", tab: "protecao", pill: "credenciais" },
    },
    {
      title: "Revise sessões conectadas",
      desc: "Encerre acessos que você não reconhece em suas contas.",
      Icon: Laptop,
      tone: "#4F46E5",
    },
    {
      title: "Foi roubado? Siga o protocolo",
      desc: "Se confirmar que foi levado, siga os passos específicos de roubo.",
      Icon: AlertTriangle,
      tone: "#EF4444",
    },
  ],
  senha_vazada: [
    {
      title: "Troque a senha da conta afetada",
      desc: "Agora, antes de qualquer outro passo.",
      Icon: KeyRound,
      tone: "#EF4444",
    },
    {
      title: "Troque onde você repetia a senha",
      desc: "É assim que um vazamento vira vários.",
      Icon: KeyRound,
      tone: "#F59E0B",
      go: { label: "Ver contas", tab: "protecao", pill: "credenciais" },
    },
    {
      title: "Ative a verificação em duas etapas",
      desc: "Nas contas importantes: e-mail, banco e redes.",
      Icon: ShieldCheck,
      tone: "#10B981",
    },
    {
      title: "Use senhas únicas",
      desc: "Um gerenciador de senhas resolve isso sem você decorar nada.",
      Icon: KeyRound,
      tone: "#4F46E5",
      go: { label: "Gerar senha", tab: "protecao", pill: "credenciais" },
    },
    {
      title: "Revise dispositivos conectados",
      desc: "Desconecte o que você não reconhece.",
      Icon: Laptop,
      tone: "#4F46E5",
    },
    {
      title: "Fique atento a phishing",
      desc: "Mensagens que usam seus dados vazados para parecer verdadeiras.",
      Icon: AlertTriangle,
      tone: "#EF4444",
    },
  ],
};

const keyOf = (t: Tipo) => `priva_incident_${t}`;

function loadDone(t: Tipo): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(keyOf(t)) || "[]");
    return Array.isArray(v) ? (v as number[]) : [];
  } catch {
    return [];
  }
}

/** Shown at the foot of every list: the app is not the emergency service. */
function EmergencyFooter() {
  return (
    <div className="mx-5 mb-8 mt-6 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-navy)]/10">
          <ShieldCheck className="h-5 w-5 text-[var(--color-navy)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-foreground">Em risco imediato?</p>
          <p className="text-[11.5px] leading-snug text-muted-foreground">
            Em caso de roubo, fraude financeira ou risco pessoal, procure também os canais oficiais.
          </p>
        </div>
        <a
          href="tel:190"
          className="flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
        >
          <Phone className="h-3.5 w-3.5" /> 190
        </a>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Orientação prática da Priva — não substitui aconselhamento jurídico.
      </p>
    </div>
  );
}

function Triage({ onPick, onBack }: { onPick: (t: Tipo) => void; onBack: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-5 pt-4">
        <button onClick={onBack} aria-label="Voltar" className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <IncidentMark className="h-8 w-8" />
      </div>
      <h1 className="px-5 pt-3 text-[26px] font-extrabold leading-tight text-foreground">
        O que aconteceu?
      </h1>
      <p className="px-5 pt-1.5 text-[14px] leading-relaxed text-muted-foreground">
        Escolha o que descreve sua situação e siga o passo a passo.
      </p>

      <div className="space-y-3 px-5 pb-2 pt-5">
        {TYPES.map((t) => {
          const done = loadDone(t.id).length;
          const total = CHECKLISTS[t.id].length;
          return (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              className="flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border border-border bg-card py-4 pr-4 text-left shadow-sm transition active:scale-[0.99]"
            >
              {/* Colour bar: the fastest way to tell four options apart when
                  you are not really reading. */}
              <span
                className="h-14 w-1.5 shrink-0 rounded-r-full"
                style={{ backgroundColor: t.tone }}
              />
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
                style={{ backgroundColor: `${t.tone}1f` }}
              >
                <t.Icon className="h-5 w-5" style={{ color: t.tone }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15.5px] font-bold leading-tight text-foreground">
                  {t.label}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-muted-foreground">
                  {t.sub}
                </span>
                {done > 0 && (
                  <span
                    className="mt-1 block text-[11.5px] font-semibold"
                    style={{ color: t.tone }}
                  >
                    {done} de {total} passos concluídos
                  </span>
                )}
              </span>
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                style={{ border: `1.5px solid ${t.tone}` }}
              >
                <ChevronRight className="h-4 w-4" style={{ color: t.tone }} />
              </span>
            </button>
          );
        })}
      </div>

      <EmergencyFooter />
    </>
  );
}

function Checklist({ tipo, onBack }: { tipo: Tipo; onBack: () => void }) {
  const { goToTab, setProtecaoPill } = useApp();
  const meta = TYPES.find((t) => t.id === tipo)!;
  const steps = CHECKLISTS[tipo];
  const [done, setDone] = useState<number[]>(() => loadDone(tipo));

  const toggle = (i: number) => {
    setDone((prev) => {
      const next = prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i];
      try {
        localStorage.setItem(keyOf(tipo), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const pct = useMemo(() => Math.round((done.length / steps.length) * 100), [done, steps.length]);
  // The first unfinished step is the one that gets the ring — someone in a
  // panic should not have to work out where they stopped.
  const active = steps.findIndex((_, i) => !done.includes(i));

  return (
    <>
      <div className="flex items-center gap-3 px-5 pt-4">
        <button onClick={onBack} aria-label="Voltar" className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      <h1 className="px-5 pt-2 text-[26px] font-extrabold leading-tight text-foreground">
        {meta.label}
      </h1>
      <p className="px-5 pt-1.5 text-[14px] leading-relaxed text-muted-foreground">
        Siga os passos abaixo para proteger seus dados e reduzir riscos.
      </p>

      <div className="mx-5 mt-4 rounded-2xl border border-border bg-card px-4 py-3.5">
        <div className="flex items-center justify-between text-[13.5px]">
          <span className="font-bold" style={{ color: meta.tone }}>
            {done.length}/{steps.length} protegidos
          </span>
          <span className="font-semibold text-muted-foreground">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: meta.tone }}
          />
        </div>
      </div>

      <ol className="space-y-2.5 px-5 pt-4">
        {steps.map((s, i) => {
          const isDone = done.includes(i);
          const isActive = i === active;
          return (
            <li key={s.title} className="relative flex min-w-0 gap-3">
              {/* Rail */}
              <span className="flex w-5 shrink-0 flex-col items-center pt-6">
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full border-2"
                  style={
                    isDone
                      ? { backgroundColor: meta.tone, borderColor: meta.tone }
                      : { borderColor: isActive ? meta.tone : "var(--color-border)" }
                  }
                />
                {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
              </span>

              <div
                role="button"
                tabIndex={0}
                onClick={() => toggle(i)}
                onKeyDown={(e) => e.key === "Enter" && toggle(i)}
                className="min-w-0 flex-1 cursor-pointer rounded-2xl border bg-card p-4 transition active:scale-[0.99]"
                style={{
                  borderColor: isActive ? meta.tone : "var(--color-border)",
                  borderWidth: isActive ? 1.5 : 1,
                  opacity: isDone ? 0.65 : 1,
                }}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: `${s.tone}1f` }}
                  >
                    {isDone ? (
                      <Check className="h-5 w-5" style={{ color: s.tone }} strokeWidth={3} />
                    ) : (
                      <s.Icon className="h-5 w-5" style={{ color: s.tone }} />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                        style={{ backgroundColor: s.tone }}
                      >
                        {i + 1}
                      </span>
                      {/* min-w-0 on the truncating span itself: `truncate`
                          sets white-space:nowrap, so as a flex item its
                          min-content is the whole string — which is what was
                          stretching the page past the phone. */}
                      <span
                        className={`min-w-0 flex-1 truncate text-[15px] font-bold leading-tight text-foreground ${isDone ? "line-through" : ""}`}
                      >
                        {s.title}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
                      {s.desc}
                    </p>

                    {/* Bottom-right, so the action never pushes the card taller
                        than title + two lines. */}
                    {(s.link || s.go) && (
                      <div className="mt-2 flex justify-end">
                        {s.link ? (
                          <a
                            href={s.link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-bold"
                            style={{ backgroundColor: `${s.tone}1f`, color: s.tone }}
                          >
                            {s.link.label} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (s.go?.pill) setProtecaoPill(s.go.pill);
                              goToTab(s.go!.tab);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-bold"
                            style={{ backgroundColor: `${s.tone}1f`, color: s.tone }}
                          >
                            {s.go!.label} <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <EmergencyFooter />
    </>
  );
}

export function IncidentMode() {
  const { goToTab } = useApp();
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const back = () => goToTab("protecao");
  return tipo ? (
    <Checklist tipo={tipo} onBack={() => setTipo(null)} />
  ) : (
    <Triage onPick={setTipo} onBack={back} />
  );
}
