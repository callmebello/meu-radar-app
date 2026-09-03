/**
 * How removal actually works — difficulty, order, and what is included.
 *
 * The tab before this treated every company as the same job. It is not. Some
 * have a privacy page where an LGPD request lands in a queue and comes back
 * honoured in a week. Some have no channel at all and only move after a formal
 * letter and two rounds of chasing. And some are data brokers whose entire
 * business is not deleting things — they move under an ANPD complaint or under
 * a lawyer's letter, or they do not move.
 *
 * Saying that out loud, BEFORE the sale, is what makes the product defensible:
 *
 *   · it explains why the subscription is annual (a hard source can take
 *     months, and you have the whole year),
 *   · it explains why there is no guarantee (the outcome belongs to a third
 *     party, and we say which ones are unlikely),
 *   · and it gives the upsell an honest job: paying more buys ESCALATION —
 *     the ANPD complaint, the registered letter, the chasing — not a promise.
 *
 * A refund happens when someone feels misled. Nobody who read this screen can
 * be surprised later.
 */
import { isStealerLog, type Breach } from "./breaches";

export type Difficulty = "facil" | "media" | "dificil" | "impossivel";

export type DifficultyMeta = {
  label: string;
  short: string;
  /** What we tell the person before they ask for it. */
  expectation: string;
  /** Typical time to an answer, in the words of the LGPD clock. */
  eta: string;
  color: string;
  bg: string;
  /** Included in the subscription, or sold per source. */
  included: boolean;
};

export const DIFFICULTY: Record<Difficulty, DifficultyMeta> = {
  facil: {
    label: "Remoção direta",
    short: "Direta",
    expectation:
      "A empresa tem um canal de privacidade que funciona. Enviamos o pedido e normalmente ela responde dentro do prazo legal.",
    eta: "15 dias úteis",
    color: "#0FA968",
    bg: "rgba(15,169,104,0.12)",
    included: true,
  },
  media: {
    label: "Remoção com insistência",
    short: "Insistência",
    expectation:
      "Não há canal pronto. Redigimos a carta formal ao encarregado de dados, protocolamos e cobramos de novo se ninguém responder.",
    eta: "30 a 60 dias",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    included: true,
  },
  dificil: {
    label: "Remoção difícil",
    short: "Difícil",
    expectation:
      "Esse tipo de site vive de revender dados e costuma ignorar o primeiro pedido. Só se move com reclamação formal na ANPD e notificação registrada.",
    eta: "60 a 180 dias, sem garantia",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.12)",
    included: false,
  },
  impossivel: {
    label: "Não tem como remover",
    short: "Sem remoção",
    expectation:
      "Isso não é uma empresa: é um arquivo de e-mails e senhas juntados de vários vazamentos, que circula copiado em muitos lugares. Não existe encarregado de dados para notificar — o que resolve aqui é trocar a senha e ligar a verificação em duas etapas.",
    eta: "—",
    color: "#64748B",
    bg: "rgba(100,116,139,0.12)",
    included: false,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["facil", "media", "dificil", "impossivel"];

/**
 * Brokers and people-search sites: the hard tier.
 *
 * Matched on the domain's registrable part so a subdomain cannot slip past.
 */
const HARD_DOMAINS = [
  "consultacpf",
  "consultarcpf",
  "tudosobretodos",
  "assertiva",
  "bigdatacorp",
  "econodata",
  "gruporeceita",
  "qsa.",
  "casadosdados",
  "escavador",
  "jusbrasil",
  "consultasocio",
  "cnpj.biz",
  "telelistas",
  "pipl",
  "spokeo",
  "whitepages",
  "beenverified",
  "peoplefinder",
  "intelius",
  "radaris",
];

/**
 * Companies with a working privacy channel: the easy tier.
 *
 * Big platforms bound by GDPR/CCPA have real deletion forms, and the large
 * Brazilian services have LGPD pages that answer. This list is the difference
 * between a first wave that resolves and a first wave that gets ignored.
 */
const EASY_DOMAINS = [
  "google",
  "linkedin",
  "adobe",
  "dropbox",
  "canva",
  "spotify",
  "twitter",
  "x.com",
  "facebook",
  "instagram",
  "meta.com",
  "microsoft",
  "yahoo",
  "apple",
  "netflix",
  "uber",
  "ifood",
  "mercadolivre",
  "mercadolibre",
  "americanas",
  "magazineluiza",
  "magalu",
  "netshoes",
  "submarino",
  "shopee",
  "nubank",
  "picpay",
  "serasa",
  "bemobi",
  "duolingo",
  "wattpad",
  "myfitnesspal",
  "trello",
  "atlassian",
  "zynga",
  "chegg",
  "deezer",
  "badoo",
  "tumblr",
  "disqus",
  "gravatar",
  "kickstarter",
  "500px",
  "bitly",
  "evite",
  "houzz",
  "imgur",
  "lastfm",
  "last.fm",
  "livejournal",
  "mathway",
  "mgm",
  "nitro",
  "onliner",
  "pixlr",
  "poshmark",
  "quora",
  "shein",
  "straffic",
  "ticketfly",
  "unico",
  "vk.com",
  "zomato",
];

const host = (b: Breach) => (b.Domain ?? "").toLowerCase();

/**
 * The ledger key for a breach.
 *
 * Every screen that records or reads an action about a leak has to agree on
 * this string, or Vazamentos ticks a box that Remoção cannot see. It lives
 * here because both screens already import this module.
 */
export const breachKey = (b: Breach): string => b.Domain || b.Name || (b.Title ?? "");

/**
 * Where a given leak sits.
 *
 * The order matters: a stealer log is checked first because it has no company
 * behind it at all, and telling someone we will "request removal" from a
 * malware dump would be the one promise in this product that cannot be kept.
 */
export function difficultyOf(b: Breach): Difficulty {
  if (isStealerLog(b)) return "impossivel";
  const h = host(b);
  // No domain means no company. HIBP returns plenty of these — "Naz.API",
  // "Combolists Posted to Telegram", credential-stuffing dumps — and they are
  // aggregated files, not organisations. Offering to send an LGPD letter about
  // one would be addressing it to nobody, so they get the same honest answer
  // as a stealer log: change the password, there is nothing to request.
  if (!h) return "impossivel";
  if (HARD_DOMAINS.some((d) => h.includes(d))) return "dificil";
  if (EASY_DOMAINS.some((d) => h.includes(d))) return "facil";
  // Unknown company with a real domain: there is someone to write to, but no
  // channel we know works. That is the middle tier by definition.
  return "media";
}

/* ── Waves ───────────────────────────────────────────────────────────────
   Requests go out in waves of three, easiest first, and the next wave opens
   when the current one is answered or its legal clock runs out.

   Not an arbitrary batch size — it is the only shape that survives contact
   with reality on all three sides:

     Operations. The letters are written and sent by hand. Firing eight at
     once for every new subscriber means eight 15-day deadlines landing on the
     same day, and a deadline you miss is a refund.

     Product. One button that sends everything produces one status for
     everything, and nothing to come back for. Waves give the app news in week
     two and week five, which is the only reason to reopen it.

     Trust. The first wave is the easy tier on purpose. Someone who watches
     three requests get honoured believes the fourth is worth paying to
     escalate. Someone whose first screen shows five refusals cancels.        */
export const WAVE_SIZE = 3;

export type WaveItem<T> = { item: T; difficulty: Difficulty; wave: number };

/**
 * Orders sources into waves. Anything unremovable is excluded from the waves
 * entirely — it is shown separately, with the action that actually helps.
 */
export function planWaves<T>(items: T[], of: (t: T) => Difficulty): WaveItem<T>[] {
  const rank = (d: Difficulty) => DIFFICULTY_ORDER.indexOf(d);
  const removable = items
    .map((item) => ({ item, difficulty: of(item) }))
    .filter((x) => x.difficulty !== "impossivel")
    .sort((a, b) => rank(a.difficulty) - rank(b.difficulty));
  return removable.map((x, i) => ({ ...x, wave: Math.floor(i / WAVE_SIZE) + 1 }));
}

/** The step-by-step every request goes through, in the person's words. */
export type RemovalStep = { title: string; detail: string };

export function stepsFor(difficulty: Difficulty, company: string): RemovalStep[] {
  const name = company || "a empresa";
  const base: RemovalStep[] = [
    {
      title: "Você confirma seus dados",
      detail:
        "Nome completo, CPF e e-mail. A empresa precisa disso para achar o cadastro — sem os dados corretos ela recusa por não conseguir identificar você.",
    },
    {
      title: "Redigimos a carta LGPD",
      detail: `Pedido formal de eliminação com base no art. 18, VI da LGPD, endereçado ao encarregado de dados de ${name}. Você recebe uma cópia.`,
    },
    {
      title: "Enviamos e protocolamos",
      detail: "Vai com você em cópia, para você ver a data de envio e ter a prova do pedido.",
    },
  ];

  if (difficulty === "facil") {
    return [
      ...base,
      {
        title: "A empresa responde em até 15 dias úteis",
        detail: "É o prazo que a lei dá. Você é avisado assim que houver resposta.",
      },
      {
        title: "Confirmação da exclusão",
        detail: "Guardamos a resposta. Ela é a prova de que o dado foi apagado.",
      },
    ];
  }

  if (difficulty === "media") {
    return [
      ...base,
      {
        title: "Cobramos se ninguém responder",
        detail:
          "Passados os 15 dias úteis, reenviamos citando o silêncio — que por si só já é descumprimento.",
      },
      {
        title: "Registramos a recusa ou o silêncio",
        detail:
          "Se ainda assim não houver resposta, o histórico fica documentado e serve de base para uma reclamação na ANPD.",
      },
    ];
  }

  // dificil
  return [
    ...base,
    {
      title: "Cobramos duas vezes",
      detail: "Esse tipo de site costuma ignorar o primeiro pedido. Insistimos com prazo.",
    },
    {
      title: "Reclamação formal na ANPD",
      detail:
        "Abrimos o processo na Autoridade Nacional de Proteção de Dados com todo o histórico anexado. É o que costuma destravar.",
    },
    {
      title: "Notificação registrada",
      detail:
        "Último passo antes da via judicial, que já não é nosso serviço — mas você sai daqui com o dossiê pronto para um advogado.",
    },
  ];
}

/** What we promise, in one line, per tier. Used above every request button. */
export function promiseLine(difficulty: Difficulty): string {
  switch (difficulty) {
    case "facil":
      return "Alta chance de sair. Incluído no seu plano.";
    case "media":
      return "Depende da empresa responder. Incluído no seu plano.";
    case "dificil":
      return "Sem garantia de resultado — o que garantimos é a insistência formal.";
    default:
      return "Não há empresa para notificar aqui.";
  }
}
