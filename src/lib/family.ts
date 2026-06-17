// Family members the user manages from a single app. Persisted locally so adds
// survive reloads. Seeded with demo members on first run.
export type Risk = "Alto" | "Médio" | "Baixo";

export type Member = {
  id: string;
  name: string;
  rel: string;
  score: number;
  risk: Risk;
  when: string;
  attention?: boolean;
};

const KEY = "priva_family";

const DEFAULTS: Member[] = [
  { id: "you", name: "Você", rel: "Você", score: 67, risk: "Médio", when: "hoje" },
];

export function riskFromScore(score: number): Risk {
  if (score >= 70) return "Baixo";
  if (score >= 45) return "Médio";
  return "Alto";
}

export function getMembers(): Member[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Member[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULTS;
}

export function saveMembers(members: Member[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(members));
  } catch {
    /* ignore */
  }
}

export function makeMember(name: string, rel: string): Member {
  const score = 55 + Math.floor(Math.random() * 40); // 55–94
  return {
    id: `m_${Date.now()}_${Math.floor(Math.random() * 1e4)}`,
    name: name.trim(),
    rel: rel.trim() || "Familiar",
    score,
    risk: riskFromScore(score),
    when: "agora",
  };
}
