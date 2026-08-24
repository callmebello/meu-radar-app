import { analyzeLink, type LinkResult } from "./link";
import { analyzePix, type PixResult } from "./pix";

/**
 * Message check — the "paste anything" entry point.
 *
 * Detects what was pasted (a Pix code, a URL, or plain text), routes it to the
 * right analyzer and, for free text, scores classic Brazilian scam patterns.
 * Text heuristics can't prove intent, so the wording stays on "padrões
 * típicos de golpe" rather than a verdict about the sender.
 */
export type Kind = "pix" | "link" | "texto" | "vazio";

export type MessageSignal = { level: "ok" | "warn" | "danger"; label: string; detail: string };

export type MessageResult = {
  kind: Kind;
  level: "seguro" | "atencao" | "alto";
  signals: MessageSignal[];
  pix?: PixResult;
  links?: LinkResult[];
};

/** Patterns that show up again and again in scam messages here. */
const PATTERNS: { re: RegExp; label: string; detail: string; weight: 1 | 2 }[] = [
  {
    re: /\b(urgente|imediato|agora mesmo|últimas? horas?|expira hoje|prazo final)\b/i,
    label: "Pressão de urgência",
    detail: "Golpes forçam decisão rápida para você não conferir.",
    weight: 1,
  },
  {
    re: /\b(conta|cadastro|cpf|chave pix)\b.{0,30}\b(bloquead|suspens|irregular|cancelad)/i,
    label: "Ameaça de bloqueio",
    detail: "Aviso de conta bloqueada é isca clássica.",
    weight: 2,
  },
  {
    re: /\b(pr[êe]mio|sorteio|voc[êe] ganhou|contemplad|b[ôo]nus|cashback de)\b/i,
    label: "Promessa de prêmio",
    detail: "Ganho inesperado é um dos golpes mais comuns.",
    weight: 2,
  },
  {
    re: /\b(clique|acesse|entre)\b.{0,20}\b(link|aqui|abaixo)\b/i,
    label: "Chamada para clicar",
    detail: "Pedido de clique combinado com urgência merece desconfiança.",
    weight: 1,
  },
  {
    re: /\b(c[óo]digo|token|senha)\b.{0,30}\b(envie|informe|confirme|repasse|me passa)\b/i,
    label: "Pede código ou senha",
    detail: "Nenhuma empresa séria pede código de verificação por mensagem.",
    weight: 2,
  },
  {
    re: /\b(mudei de n[úu]mero|novo n[úu]mero|perdi meu celular)\b/i,
    label: "Golpe do número novo",
    detail: "Mensagem de conhecido com número diferente pedindo dinheiro.",
    weight: 2,
  },
  {
    re: /\b(pix|transfer[êe]ncia|dep[óo]sito)\b.{0,40}\b(urg|agora|rápido|favor)\b/i,
    label: "Pedido de Pix com pressa",
    detail: "Confirme por outro canal antes de enviar qualquer valor.",
    weight: 2,
  },
  {
    re: /\b(taxa|tarifa|libera[çc][ãa]o|frete)\b.{0,30}\b(pagar|pagamento|antecipad)/i,
    label: "Taxa para liberar algo",
    detail: "Cobrança antecipada para receber prêmio ou encomenda é golpe.",
    weight: 2,
  },
];

const URL_RE =
  /((?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9-]+\.(?:com|com\.br|br|net|org|xyz|top|click|info|site|online|app|link)(?:\/[^\s<>"']*)?)/gi;

export function detectKind(text: string): Kind {
  const t = text.trim();
  if (!t) return "vazio";
  if (t.toUpperCase().includes("BR.GOV.BCB.PIX")) return "pix";
  if (URL_RE.test(t)) {
    URL_RE.lastIndex = 0;
    return "link";
  }
  URL_RE.lastIndex = 0;
  return "texto";
}

export function analyzeMessage(text: string): MessageResult {
  const t = text.trim();
  if (!t) {
    return { kind: "vazio", level: "seguro", signals: [] };
  }

  // A full Pix payload pasted in — hand it to the Pix analyzer.
  if (t.toUpperCase().includes("BR.GOV.BCB.PIX")) {
    const pix = analyzePix(t);
    return { kind: "pix", level: pix.level, signals: pix.signals, pix };
  }

  const signals: MessageSignal[] = [];
  let score = 0;

  for (const p of PATTERNS) {
    if (p.re.test(t)) {
      score += p.weight;
      signals.push({ level: p.weight === 2 ? "danger" : "warn", label: p.label, detail: p.detail });
    }
  }

  // Any links inside the message get the full URL analysis.
  const found = Array.from(new Set(t.match(URL_RE) ?? [])).slice(0, 3);
  const links = found.map(analyzeLink);
  for (const l of links) {
    if (l.level === "alto") score += 2;
    else if (l.level === "atencao") score += 1;
  }

  if (signals.length === 0 && links.length === 0) {
    signals.push({
      level: "ok",
      label: "Nenhum padrão de golpe encontrado",
      detail: "O texto não tem os sinais mais comuns — siga desconfiando do contexto.",
    });
  }

  return {
    kind: links.length ? "link" : "texto",
    level: score >= 3 ? "alto" : score >= 1 ? "atencao" : "seguro",
    signals,
    links: links.length ? links : undefined,
  };
}
