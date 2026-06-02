import { AppHeader } from "../Header";
import { AnimatedScoreGauge } from "../AnimatedScoreGauge";
import { AlertTriangle, TrendingUp, ExternalLink, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const debts = [
  { creditor: "Claro S.A.", initial: "C", amount: "R$ 1.847,00", date: "negativado em mar/2024" },
  { creditor: "Banco Inter", initial: "B", amount: "R$ 892,50", date: "negativado em jan/2025" },
];

const queries = [
  { name: "Nubank", date: "15/01/2025" },
  { name: "Magazine Luiza", date: "03/12/2024" },
  { name: "Itaú Unibanco", date: "28/11/2024" },
  { name: "Vivo", date: "10/10/2024" },
];

const evolution = [
  { month: "Jul", score: 120 },
  { month: "Ago", score: 135 },
  { month: "Set", score: 140 },
  { month: "Out", score: 155 },
  { month: "Nov", score: 165 },
  { month: "Dez", score: 180 },
];

export function ScoreTab() {
  const { isPremium, setIsPremium } = useApp();
  const [bannerOpen, setBannerOpen] = useState(true);
  const score = 180;
  const pct = (score / 1000) * 100;

  const activate = () => {
    setIsPremium(true);
    setBannerOpen(false);
  };

  return (
    <>
      <AppHeader title="Score de Crédito" subtitle="Situação financeira e negativações" />
      <div className="space-y-5 px-5 py-5">
        {/* Paywall banner */}
        {!isPremium && bannerOpen && (
          <section className="relative rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4 animate-fade-in">
            <button
              onClick={() => setBannerOpen(false)}
              className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full hover:bg-black/5 transition"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
            <div className="flex items-start justify-between gap-3 pr-5">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Plano Score+ — R$29/mês</p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Monitoramento contínuo + alertas de pré-negativação + score em tempo real
                </p>
              </div>
              <button
                onClick={activate}
                className="shrink-0 rounded-lg bg-[var(--color-navy)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90"
              >
                Ativar Score+
              </button>
            </div>
          </section>
        )}

        {/* Credit score card */}
        <section className="rounded-2xl bg-[#0f172a] p-6 text-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.5)]">
          <div className="flex flex-col items-center text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Seu Score</p>
            <div className="mt-2 w-full">
              <AnimatedScoreGauge score={score} max={1000} showMax />
            </div>
            <p className="mt-2 text-[11px] text-white/60">Score Boavista/Quod · atualizado hoje</p>
          </div>
          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--color-danger)] transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] font-medium text-white/60">{score}/1000</p>
            <p className="mt-2 text-[10px] leading-relaxed text-white/50">
              0 Crítico · 300 Baixo · 600 Médio · 850 Alto · 1000 Excelente
            </p>
          </div>
        </section>

        {/* Negativações */}
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 px-1 text-sm font-bold text-[var(--color-warning)]">
            <AlertTriangle className="h-4 w-4" />
            2 negativações encontradas
          </h2>
          <div className="space-y-2.5">
            {debts.map((d) => (
              <div key={d.creditor} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-navy)] text-sm font-bold text-white">
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
                <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-navy)] py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:opacity-90">
                  Negociar agora <ExternalLink className="h-3 w-3" />
                </button>
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
                Acesse o Serasa Limpa Nome e negocie com desconto
              </p>
              <a
                href="https://www.serasa.com.br/limpa-nome-online/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-teal)] px-3 py-2 text-xs font-bold text-[var(--color-navy)] transition hover:opacity-90"
              >
                Serasa Limpa Nome <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Contestar negativação indevida</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Se a dívida não é sua, registre reclamação no Consumidor.gov.br
              </p>
              <a
                href="https://www.consumidor.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-teal)] px-3 py-2 text-xs font-bold text-[var(--color-navy)] transition hover:opacity-90"
              >
                Consumidor.gov <ExternalLink className="h-3 w-3" />
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
          <p className="mt-1 text-[11px] font-medium text-[var(--color-success)]">
            Seu score subiu +60 pontos nos últimos 6 meses
          </p>
          <div className="mt-3 h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolution} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                />
                <YAxis hide domain={[100, 200]} />
                <Tooltip
                  contentStyle={{
                    background: "#1e2d5a",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "white",
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#2dd4bf" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </>
  );
}
