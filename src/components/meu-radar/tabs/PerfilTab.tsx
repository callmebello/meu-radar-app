import { useState } from "react";
import { AppHeader } from "../Header";
import { Check, ChevronRight, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const monitored = [
  { label: "CPF", value: "•••.456.789-••" },
  { label: "E-mail", value: "jo***@gmail.com" },
  { label: "Telefone", value: "(11) 9****-4521" },
  { label: "Endereço", value: "São Paulo, SP" },
];

export function PerfilTab() {
  const [s, setS] = useState({ push: true, email: true, scan: true, bio: true });
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <>
      <AppHeader title="Perfil" showBell />
      <div className="space-y-5 px-5 py-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-navy)] text-xl font-bold text-white">JS</span>
          <div>
            <p className="text-lg font-bold text-foreground">João Silva</p>
            <span className="mt-1 inline-block rounded-full bg-[var(--color-teal)]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-navy)]">Plano Família</span>
          </div>
        </div>

        {/* Monitored */}
        <section className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="px-4 py-3 border-b border-border/60">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dados monitorados</h2>
          </div>
          <ul>
            {monitored.map((m, i) => (
              <li key={m.label} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-border/60" : ""}`}>
                <div>
                  <p className="text-[11px] text-muted-foreground">{m.label}</p>
                  <p className="text-sm font-medium text-foreground">{m.value}</p>
                </div>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)]/15">
                  <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Plan */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <span className="rounded-full bg-[var(--color-teal)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Plano Família</span>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Renova em</p>
              <p className="font-semibold text-foreground">15/03/2025</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Membros</p>
              <p className="font-semibold text-foreground">4 / 6</p>
            </div>
          </div>
          <button className="mt-4 w-full rounded-xl bg-[var(--color-navy)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition">
            Gerenciar plano
          </button>
        </section>

        {/* Theme toggle */}
        <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary">
                {isDark ? <Moon className="h-5 w-5 text-[var(--color-teal)]" /> : <Sun className="h-5 w-5 text-[var(--color-warning)]" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Aparência</p>
                <p className="text-[11px] text-muted-foreground">{isDark ? "Tema escuro ativado" : "Tema claro ativado"}</p>
              </div>
            </div>
            <div className="flex rounded-full bg-muted p-1">
              <button
                onClick={() => isDark && toggle()}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${!isDark ? "bg-background text-foreground shadow" : "text-muted-foreground"}`}
              >
                <Sun className="h-3 w-3" /> Claro
              </button>
              <button
                onClick={() => !isDark && toggle()}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${isDark ? "bg-background text-foreground shadow" : "text-muted-foreground"}`}
              >
                <Moon className="h-3 w-3" /> Escuro
              </button>
            </div>
          </div>
        </section>

        {/* Settings */}
        <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">

          {[
            { k: "push" as const, label: "Notificações push" },
            { k: "email" as const, label: "Alertas por e-mail" },
            { k: "scan" as const, label: "Varredura automática" },
            { k: "bio" as const, label: "Autenticação biométrica" },
          ].map((t, i) => (
            <div key={t.k} className={`flex items-center justify-between px-4 py-3.5 ${i > 0 ? "border-t border-border/60" : ""}`}>
              <p className="text-sm text-foreground">{t.label}</p>
              <button
                onClick={() => setS({ ...s, [t.k]: !s[t.k] })}
                className={`relative h-6 w-11 rounded-full transition ${s[t.k] ? "bg-[var(--color-teal)]" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${s[t.k] ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
          {[
            { label: "Política de privacidade" },
            { label: "Termos de uso" },
          ].map((t) => (
            <button key={t.label} className="flex w-full items-center justify-between border-t border-border/60 px-4 py-3.5 text-left hover:bg-secondary/50 transition">
              <p className="text-sm text-foreground">{t.label}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          <button className="flex w-full items-center justify-between border-t border-border/60 px-4 py-3.5 text-left hover:bg-secondary/50 transition">
            <p className="text-sm font-medium text-[var(--color-danger)]">Sair</p>
            <LogOut className="h-4 w-4 text-[var(--color-danger)]" />
          </button>
        </section>
      </div>
    </>
  );
}
