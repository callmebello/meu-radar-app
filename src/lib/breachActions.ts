import { isStealerLog, type Breach } from "./breaches";
import { difficultyOf } from "./removal";
import type { ActionType } from "./actions";

/**
 * What to actually do about each leak.
 *
 * HIBP tells us exactly WHAT leaked in each breach (`DataClasses`), and the app
 * was throwing that away — every breach got the same three generic tips
 * ("troque senhas reutilizadas", "ative 2FA", "monitore transações"), whether
 * the leak was a password or a postal address. Advice that ignores the facts
 * reads as filler, and filler is what people stop reading.
 *
 * Two kinds of item, deliberately separated:
 *
 *   TASK   — something the person does, that changes their risk, that we can
 *            record in the ledger and credit to the score.
 *   ADVICE — something to watch out for. No checkbox: ticking "I will be
 *            careful" would inflate the score for doing nothing.
 */
export type BreachTask = { type: ActionType; label: string };
export type BreachGuidance = { tasks: BreachTask[]; advice: string[] };

/** HIBP data classes, in the words a Brazilian would use. */
const CLASS_PT: { re: RegExp; label: string }[] = [
  { re: /password/i, label: "Senha" },
  { re: /email/i, label: "E-mail" },
  { re: /phone/i, label: "Telefone" },
  { re: /^names?$/i, label: "Nome" },
  { re: /physical address/i, label: "Endereço" },
  { re: /date of birth|dates of birth/i, label: "Data de nascimento" },
  { re: /username/i, label: "Nome de usuário" },
  { re: /credit card/i, label: "Cartão de crédito" },
  { re: /government issued id|national id/i, label: "Documento (CPF/RG)" },
  { re: /security question/i, label: "Perguntas de segurança" },
  { re: /ip address/i, label: "Endereço IP" },
  { re: /geographic location/i, label: "Localização" },
  { re: /social media profile/i, label: "Perfis em redes sociais" },
  { re: /purchase/i, label: "Histórico de compras" },
  { re: /job title/i, label: "Cargo" },
  { re: /gender/i, label: "Gênero" },
];

/** Only the classes we can name — an untranslated English string helps nobody. */
export function leakedLabels(b: Breach): string[] {
  const classes = b.DataClasses ?? [];
  const out: string[] = [];
  for (const c of classes) {
    const hit = CLASS_PT.find((m) => m.re.test(c));
    if (hit && !out.includes(hit.label)) out.push(hit.label);
  }
  return out;
}

const hasClass = (b: Breach, re: RegExp) => (b.DataClasses ?? []).some((c) => re.test(c));

/**
 * Is there a service here someone could have an account with?
 *
 * A stealer log is a malware dump and a domain-less entry is an aggregated
 * file — you cannot close an account at either. Data brokers (which do have
 * domains) are handled separately: you never opened an account there, they
 * collected you, so closing is not the move — removal is.
 */
const canHoldAnAccount = (b: Breach): boolean =>
  !isStealerLog(b) && Boolean((b.Domain ?? "").trim()) && difficultyOf(b) !== "dificil";

export function guidanceFor(b: Breach, name: string): BreachGuidance {
  const tasks: BreachTask[] = [];
  const advice: string[] = [];

  if (hasClass(b, /password/i)) {
    tasks.push({
      type: "password_changed",
      label: `Troquei minha senha ${name ? `no ${name}` : ""}`.trim(),
    });
    tasks.push({ type: "twofa_enabled", label: "Ativei a verificação em duas etapas" });
    advice.push(
      "Se você usa essa mesma senha em outro site, troque lá também — é assim que um vazamento vira vários.",
    );
  }

  // The option nobody offers, and the one that fits most of these leaks: half
  // of what HIBP returns is an account from years ago that the person will
  // never open again. Changing the password on a service you abandoned is
  // housekeeping; closing it removes the thing that leaks next time — which is
  // why it credits more (see ACTION_CREDIT) and why it is worth naming as its
  // own choice rather than hiding inside the advice.
  //
  // Only where an account can exist. A combolist and a data broker both show up
  // in this list, and neither is a service anyone signed up for — "apaguei
  // minha conta no Naz.API" is a task nobody can complete, and an impossible
  // checkbox is worse than no checkbox.
  if (canHoldAnAccount(b)) {
    tasks.push({
      type: "account_closed",
      label: `Não uso mais ${name || "esse serviço"} — apaguei minha conta`,
    });
  }

  if (hasClass(b, /security question/i)) {
    advice.push(
      "Respostas de segurança também vazaram. Troque onde você usa as mesmas (nome do primeiro pet, escola).",
    );
  }

  if (hasClass(b, /credit card/i)) {
    advice.push("Avise seu banco e acompanhe a fatura — dados de cartão estavam nesse vazamento.");
  }

  if (hasClass(b, /government issued id|national id/i)) {
    advice.push(
      "Documentos estavam nesse vazamento. Fique atento a contas ou crediários abertos no seu nome.",
    );
  }

  if (hasClass(b, /phone/i)) {
    advice.push(
      "Seu telefone circulou. Desconfie de mensagem de número novo dizendo ser alguém que você conhece.",
    );
  }

  if (hasClass(b, /email/i) && tasks.length === 0) {
    advice.push(
      `Seu e-mail circulou. Desconfie de mensagens que citam ${name || "esse serviço"} pedindo login.`,
    );
  }

  return { tasks, advice };
}
