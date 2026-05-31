import { AppHeader } from "../Header";
import { ScoreGauge } from "../ScoreGauge";
import { AlertTriangle, CheckCircle2, ShieldAlert, Fingerprint, Mail, Phone, MapPin } from "lucide-react";

const identityItems = [
  { icon: Fingerprint, label: "CPF", status: "Encontrado em 2 bases", level: "danger" },
  { icon: Mail, label: "E-mail", status: "5 vazamentos detectados", level: "danger" },
  { icon: Phone, label: "Telefone", status: "1 ocorrência", level: "warning" },
  { icon: MapPin, label: "Endereço", status: "Não encontrado", level: "success" },
];

const levelColor = (l: string) =>
  l === "danger" ? "var(--color-danger)" : l === "warning" ? "var(--color-warning)" : "var(--color-success)";

const alerts = [
  { icon: AlertTriangle, title: "Novo vazamento detectado", meta: "Fórum HackBR · 2h atrás", level: "danger" },
  { icon: ShieldAlert, title: "Credencial comprometida", meta: "Senha do e-mail · ontem", level: "warning" },
  { icon: CheckCircle2, title: "Varredura concluída", meta: "Dark web · 3 dias atrás", level: "success" },
];

export function RadarTab() {
  return (
    <>
      <AppHeader title="Meu Radar" showBell showLogo />
      <div className="space-y-5 px-5 py-5">
        {/* Score card */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_2px_20px_-8px_rgba(30,45,90,0.15)]">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identity Score</p>
            <div className="mt-3"><ScoreGauge score={67} label="Risco Médio" /></div>
            <p className="mt-4 text-xs text-muted-foreground">Última verificação: hoje às 14:32</p>
          </div>
        </section>

        {/* Identity radar grid */}
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-foreground">Radar de identidade</h2>
          <div className="grid grid-cols-2 gap-3">
            {identityItems.map((it) => {
              const Icon = it.icon;
              const color = levelColor(it.level);
              return (
                <div key={it.label} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary">
                      <Icon className="h-4 w-4 text-foreground" />
                    </span>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{it.label}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{it.status}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Alerts */}
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-foreground">Alertas recentes</h2>
          <ul className="space-y-2">
            {alerts.map((a, i) => {
              const Icon = a.icon;
              const color = levelColor(a.level);
              return (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm">
                  <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{a.meta}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
