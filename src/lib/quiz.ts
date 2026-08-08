// Pre-scan quiz answers — persisted so the report can be personalized with what
// the user told us *before* the scan ran. All reads/writes are guarded: this
// runs during SSR and in browsers with storage disabled.

export type QuizAnswers = {
  q1: string;
  q2: string[];
  q3: string;
};

export const QUIZ_KEY_Q1 = "priva_quiz_q1";
export const QUIZ_KEY_Q2 = "priva_quiz_q2";
export const QUIZ_KEY_Q3 = "priva_quiz_q3";

export function saveQuizQ1(answer: string) {
  try {
    localStorage.setItem(QUIZ_KEY_Q1, answer);
  } catch {
    /* ignore */
  }
}

export function saveQuizQ2(answers: string[]) {
  try {
    localStorage.setItem(QUIZ_KEY_Q2, JSON.stringify(answers));
  } catch {
    /* ignore */
  }
}

export function saveQuizQ3(answer: string) {
  try {
    localStorage.setItem(QUIZ_KEY_Q3, answer);
  } catch {
    /* ignore */
  }
}

export function readQuizAnswers(): QuizAnswers {
  if (typeof window === "undefined") return { q1: "", q2: [], q3: "" };
  try {
    const raw = localStorage.getItem(QUIZ_KEY_Q2);
    const q2 = raw ? (JSON.parse(raw) as unknown) : [];
    return {
      q1: localStorage.getItem(QUIZ_KEY_Q1) ?? "",
      q2: Array.isArray(q2) ? q2.filter((v): v is string => typeof v === "string") : [],
      q3: localStorage.getItem(QUIZ_KEY_Q3) ?? "",
    };
  } catch {
    return { q1: "", q2: [], q3: "" };
  }
}

// Q2 option labels (the source of truth — the quiz renders these).
export const Q2_EMAIL = "Meu e-mail";
export const Q2_CPF = "Meu CPF";
export const Q2_PHONE = "Meu telefone";
export const Q2_ADDRESS = "Meu endereço";
export const Q2_PASSWORDS = "Minhas senhas";
export const Q2_UNSURE = "Não sei ao certo";

// Maps a Q2 answer to the data-type label used by the /relatorio exposure map,
// so the bars the user flagged can be highlighted. "Não sei ao certo" and
// "Meu endereço" have no bar of their own and map to nothing.
const Q2_TO_REPORT_LABEL: Record<string, string> = {
  [Q2_EMAIL]: "E-mail",
  [Q2_CPF]: "CPF",
  [Q2_PHONE]: "Telefone",
  [Q2_PASSWORDS]: "Senha",
};

/** Exposure-map labels the user said they were worried about (may be empty). */
export function highlightedReportLabels(q2: string[]): string[] {
  return q2.map((a) => Q2_TO_REPORT_LABEL[a]).filter((l): l is string => Boolean(l));
}
