import { useMemo, useState } from "react";
import { IncidentMark } from "./IncidentMark";
import {
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  Smartphone,
  MapPinOff,
  KeyRound,
  Check,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

/**
 * Incident Mode — triage + concrete recovery checklists.
 *
 * Phase 1: no DB yet. Progress is kept per incident type in localStorage
 * (`priva_incident_<tipo>`), which is enough to make the feature real and
 * useful today. The persisted incident record (nº, valor, tempo — the
 * "Incident Center") and the `incidents` table come in the next phase.
 *
 * Steps are practical, Brazil-specific orientations, not legal advice — the
 * footer says so.
 */
type Tipo = "golpe" | "roubo" | "perda" | "senha_vazada";

const TYPES: { id: Tipo; label: string; sub: string; Icon: typeof AlertTriangle; tone: string }[] =
  [
    {
      id: "golpe",
      label: "Golpe ou Pix indevido",
      sub: "Fui enganado ou fiz um Pix para um golpista",
      Icon: AlertTriangle,
      tone: "#DC2626",
    },
    {
      id: "roubo",
      label: "Roubo ou furto do celular",
      sub: "Levaram meu aparelho",
      Icon: Smartphone,
      tone: "#D97706",
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
      tone: "#0FA968",
    },
  ];

const CHECKLISTS: Record<Tipo, string[]> = {
  golpe: [
    "Acione seu banco pelo app ou telefone e peça o MED (Mecanismo Especial de Devolução do Pix).",
    "Anote valor, data, chave/QR e o nome de quem recebeu.",
    "Registre um Boletim de Ocorrência na Delegacia Eletrônica do seu estado.",
    "Denuncie a chave Pix do golpista ao Banco Central (pelo app do banco).",
    "Troque as senhas do banco e dos apps de pagamento.",
    "Ative a verificação em duas etapas nos apps financeiros.",
    "Desconfie de quem oferecer 'devolver o valor' — costuma ser o mesmo golpe.",
  ],
  roubo: [
    "Ligue para a operadora e bloqueie a linha (Vivo, Claro, TIM ou Oi).",
    "Bloqueie o aparelho pelo IMEI junto à operadora / Anatel.",
    "Use 'Encontrar meu dispositivo' (Android) ou 'Buscar' (iPhone): marque como perdido e apague os dados remotamente.",
    "Avise o banco e bloqueie seus cartões pela central de atendimento.",
    "De outro aparelho, troque as senhas de e-mail, banco e redes sociais.",
    "Encerre as sessões abertas do WhatsApp, e-mail e redes.",
    "Registre um Boletim de Ocorrência informando o IMEI do aparelho.",
  ],
  perda: [
    "Use 'Encontrar meu dispositivo' / 'Buscar' para localizar e fazer o aparelho tocar.",
    "Não achou? Marque como perdido e deixe um recado com um contato na tela.",
    "Bloqueie a linha temporariamente com a operadora.",
    "Por precaução, troque as senhas de e-mail e banco.",
    "Revise os dispositivos conectados às suas contas e remova os que não reconhece.",
    "Se confirmar que foi levado, siga os passos de roubo ou furto.",
  ],
  senha_vazada: [
    "Troque agora a senha da conta afetada.",
    "Troque a senha em todo lugar onde você usava a mesma.",
    "Ative a verificação em duas etapas (2FA) nas contas importantes.",
    "Passe a usar senhas únicas — um gerenciador de senhas ajuda.",
    "Revise dispositivos e sessões conectados e desconecte os desconhecidos.",
    "Fique atento a e-mails e mensagens de phishing que usem seus dados.",
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

function Triage({ onPick, onBack }: { onPick: (t: Tipo) => void; onBack: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-5 pt-4">
        <button onClick={onBack} aria-label="Voltar" className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <IncidentMark className="h-8 w-8" />
        <h1 className="text-lg font-bold text-foreground">O que aconteceu?</h1>
      </div>
      <p className="px-5 pt-1 text-sm text-muted-foreground">
        Escolha o que descreve sua situação e siga o passo a passo.
      </p>

      <div className="space-y-3 px-5 pb-8 pt-5">
        {TYPES.map((t) => {
          const done = loadDone(t.id).length;
          const total = CHECKLISTS[t.id].length;
          return (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left transition active:scale-[0.99]"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                style={{ backgroundColor: `${t.tone}1f` }}
              >
                <t.Icon className="h-5 w-5" strokeWidth={1.9} style={{ color: t.tone }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-foreground">{t.label}</span>
                <span className="block text-[12.5px] text-muted-foreground">{t.sub}</span>
                {done > 0 && (
                  <span
                    className="mt-0.5 block text-[11px] font-semibold"
                    style={{ color: t.tone }}
                  >
                    {done} de {total} passos concluídos
                  </span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </>
  );
}

function Checklist({ tipo, onBack }: { tipo: Tipo; onBack: () => void }) {
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

  return (
    <>
      <div className="flex items-center gap-3 px-5 pt-4">
        <button onClick={onBack} aria-label="Voltar" className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-foreground">{meta.label}</h1>
      </div>

      {/* Progress */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-semibold text-foreground">
            {done.length} de {steps.length} concluídos
          </span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: meta.tone }}
          />
        </div>
      </div>

      <ul className="space-y-2.5 px-5 pb-10 pt-5">
        {steps.map((s, i) => {
          const checked = done.includes(i);
          return (
            <li key={i}>
              <button
                onClick={() => toggle(i)}
                className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition active:scale-[0.99]"
              >
                <span
                  className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors"
                  style={{
                    borderColor: checked ? meta.tone : "var(--color-border)",
                    backgroundColor: checked ? meta.tone : "transparent",
                  }}
                >
                  {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </span>
                <span
                  className={`text-[14px] leading-snug ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}
                >
                  {s}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="px-6 pb-10 text-center text-[11px] leading-relaxed text-muted-foreground/70">
        Orientações gerais para agir rápido. Não substituem atendimento oficial do seu banco, da
        polícia ou da operadora.
      </p>
    </>
  );
}

export function IncidentMode() {
  const { goToTab } = useApp();
  const [tipo, setTipo] = useState<Tipo | null>(null);

  return (
    <div className="min-h-[70vh]">
      {tipo ? (
        <Checklist tipo={tipo} onBack={() => setTipo(null)} />
      ) : (
        <Triage onPick={setTipo} onBack={() => goToTab("protecao")} />
      )}
    </div>
  );
}
