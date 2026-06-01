import { AppHeader } from "../Header";
import { AlertTriangle, TrendingUp, ExternalLink, CheckCircle2 } from "lucide-react";

const debts = [
  { creditor: "Claro S.A.", initial: "C", amount: "R$ 1.847,00", date: "negativado em mar/2024" },
  { creditor: "Banco Inter", initial: "B", amount: "R$ 892,50", date: "negativado em jan/2025" },
];

const queries = [
  { name: "Nubank", date: "15 jan 2025" },
  { name: "Magazine Luiza", date: "3 dez 2024" },
  { name: "Itaú Unibanco", date: "28 nov 2024" },
  { name: "Vivo", date: "10 out 2024" },
];

const evolution = [
  { m: "Jul", v: 120 },
  { m: "Ago", v: 135 },
  { m: "Set", v: 140 },
  { m: "Out", v: 155 },
  { m: "Nov", v: 165 },
  { m: "Dez", v: 180 },
];

export function ScoreTab() {
  const score = 180;
  const pct = (score / 1000) * 100;

  // Chart geometry
  const W = 300;
  const H = 110;
  const min = 100;
  const max = 200;
  const points = evolution.map((p, i) => {
    const x = (i / (evolution.length - 1)) * (W - 20) + 10;
    const y = H - 15 - ((p.v - min) / (max - min)) * (H - 30);
    return { x, y, ...p };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${points[points.length - 1].x},${H - 10} L${points[0].x},${H - 10} Z`;

  return (
    <>
      <AppHeader title="Score de Crédito" subtitle="Situação financeira e negativações" />
      <div className="space-y-5 px-5 py-5">
        {/* Paywall banner */}
        <section className="rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Plano Score+ — R$29/mês</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Monitoramento contínuo de negativações + alertas de pré-negativação + score em tempo real
              </p>
            </div>
            <button className="shrink-0 rounded-lg bg-[var(--color-navy)] px-3 py-2 text-xs font-semibold text-white shadow-sm">
              Ativar Score+
            </button>
          </div>
        </section>

        {/* Credit score card */}
        <section className="rounded-2xl bg-[#0f172a] p-6 text-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.5)]">
          <div className="flex flex-col items-center text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Seu Score</p>
            <span className="mt-2 text-6xl font-extrabold leading-none text-[var(--color-danger)]">{score}</span>
            <span className="mt-2 rounded-full bg-[var(--color-danger)]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-danger)]">
              Risco Alto
            </span>
            <p className="mt-2 text-[11px] text-white/60">Score Boavista/Quod • atualizado hoje</p>
          </div>
          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--color-danger)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] font-medium text-white/60">{score}/1000</p>
            <p className="mt-2 text-[10px] leading-relaxed text-white/50">
              0 — Crítico · 300 — Baixo · 600 — Médio · 850 — Alto · 1000 — Excelente
            </p>
          </div>
        </section>

        {/* Negativações */}
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 px-1 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-[var(--color-danger)]" />
            2 negativações encontradas
          </h2>
          <div className="space-y-2.5">
            {debts.map((d) => (
              <div key={d.creditor} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-danger)]/10 text-sm font-bold text-[var(--color-danger)]">
                    {d.initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{d.creditor}</p>
                      <span className="shrink-0 rounded-full bg-[var(--color-danger)]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-danger)]">
                        Negativado
                      </span>
                    </div>
                    <p className="mt-1 text-lg font-extrabold text-[var(--color-danger)]">{d.amount}</p>
                    <p className="text-[11px] text-muted-foreground">{d.date}</p>
                  </div>
                </div>
                <a
                  href="#"
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-navy)] py-2.5 text-xs font-semibold text-white"
                >
                  Negociar agora <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Consultas */}
        <section>
          <h2 className="px-1 text-sm font-semibold text-foreground">Empresas que consultaram seu CPF</h2>
          <p className="mb-3 px-1 text-[11px] text-muted-foreground">Últimos 6 meses</p>
          <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            {queries.map((q) => (
              <li key={q.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{q.name}</p>
                  <p className="text-[11px] text-muted-foreground">{q.date}</p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Consulta de crédito
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Ações recomendadas */}
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-foreground">O que fazer agora</h2>
          <div className="space-y-2.5">
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Negociar dívidas</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Acesse o Serasa Limpa Nome ou Acordo Certo e negocie com desconto
              </p>
              <a
                href="#"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-teal)] px-3 py-2 text-xs font-bold text-[var(--color-navy)]"
              >
                Acessar Serasa Limpa Nome <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Contestar negativação indevida</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Se a dívida não é sua, registre reclamação no Consumidor.gov.br
              </p>
              <a
                href="#"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-teal)] px-3 py-2 text-xs font-bold text-[var(--color-navy)]"
              >
                Ir para Consumidor.gov <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Monitoramento ativo</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    Você será avisado imediatamente se uma nova dívida for registrada no seu CPF
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/15 px-2 py-1 text-[10px] font-bold text-[var(--color-success)]">
                  <CheckCircle2 className="h-3 w-3" /> Ativo
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Evolution chart */}
        <section className="rounded-2xl bg-[#0f172a] p-5 text-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.5)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Evolução do Score</h2>
            <TrendingUp className="h-4 w-4 text-[var(--color-teal)]" />
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full">
            <defs>
              <linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-teal)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-teal)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#scoreFill)" />
            <path d={path} fill="none" stroke="var(--color-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p) => (
              <circle key={p.m} cx={p.x} cy={p.y} r="3" fill="var(--color-teal)" />
            ))}
            {points.map((p) => (
              <text key={p.m} x={p.x} y={H - 1} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)">
                {p.m}
              </text>
            ))}
          </svg>
          <p className="mt-2 text-[11px] font-medium text-[var(--color-teal)]">
            Seu score subiu +60 pontos nos últimos 6 meses
          </p>
        </section>
      </div>
    </>
  );
}
