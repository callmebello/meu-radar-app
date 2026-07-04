import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppHeader } from "../Header";
import { Check, ChevronRight, LogOut, Moon, Sun, Lock, FileText, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import { useApp } from "@/contexts/AppContext";
import { getUser, signInWithEmail, signOut } from "@/lib/auth";
import { getProfile, saveProfile } from "@/lib/profile";
import { startCheckout } from "@/lib/checkout";
import { generateRelatorioPdf } from "@/lib/api/generateRelatorio.functions";
import { getUserPlan } from "@/lib/api/account.functions";
import { track } from "@/lib/analytics";

const PLAN_LABEL: Record<string, string> = {
  essencial: "Essencial",
  protecao_total: "Proteção Total",
  free: "Grátis",
};

export function PerfilTab() {
  const [s, setS] = useState({ push: true, email: true, scan: false });
  const { theme, toggle } = useTheme();
  const { isPremium, goToTab, requestFamilyAdd, openScan } = useApp();
  const isDark = theme === "dark";

  // A report can be generated only when a scan was persisted (user_id) and we
  // have scan data on file. Otherwise the Perfil section shows an empty state.
  const hasReport =
    typeof window !== "undefined" &&
    !!localStorage.getItem("priva_user_id") &&
    !!localStorage.getItem("priva_scan_result");

  // Monitored identity — CPF/e-mail are read-only (from the scan); phone/city editable.
  const cpfRaw = typeof window !== "undefined" ? (sessionStorage.getItem("priva_cpf") || "").replace(/\D/g, "") : "";
  const emailRaw = typeof window !== "undefined" ? sessionStorage.getItem("priva_email") || "" : "";
  const maskCpf = cpfRaw.length === 11 ? `•••.${cpfRaw.slice(3, 6)}.${cpfRaw.slice(6, 9)}-••` : "—";
  const maskEmail = emailRaw ? `${emailRaw.slice(0, 2)}***@${emailRaw.split("@")[1] ?? ""}` : "—";
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(() => getProfile().extraPhone || "");
  const [city, setCity] = useState(() => getProfile().addrCity || "");

  // Auth state
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [loginEmail, setLoginEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const goAddMember = () => {
    goToTab("familia");
    requestFamilyAdd();
  };
  // Basic (Essencial) plan can't freely edit monitored data (would enable a free
  // scan of another person) → redirect to "adicionar membro" instead.
  const onEditMonitored = () => {
    if (plan === "essencial") {
      goAddMember();
      return;
    }
    if (editing) {
      saveProfile({ extraPhone: phone.trim(), addrCity: city.trim() });
      toast.success("Dados atualizados");
    }
    setEditing((v) => !v);
  };

  // Generate (or refresh) the full Relatório de Exposição Digital and open it.
  const downloadRelatorio = async () => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("priva_user_id") : null;
    if (!uid) {
      toast.error("Faça um scan primeiro para gerar o relatório.");
      return;
    }
    setPdfBusy(true);
    try {
      const res = await generateRelatorioPdf({ data: { userId: uid } });
      if (res.ok && res.url) window.open(res.url, "_blank");
      else toast.error("Não foi possível gerar o relatório agora.");
    } catch {
      toast.error("Não foi possível gerar o relatório agora.");
    }
    setPdfBusy(false);
  };

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (user?.email) setAuthedEmail(user.email);
    })();
    try {
      setPlan(localStorage.getItem("priva_plan") || "free");
    } catch {
      /* ignore */
    }
  }, []);

  // Login: if the account exists, send a magic link to enter; otherwise redirect
  // to checkout (no account yet → must subscribe first).
  const login = async () => {
    const email = loginEmail.trim();
    if (!email || loginBusy) return;
    setLoginBusy(true);
    try {
      const res = await getUserPlan({ data: { email } });
      if (res.found) {
        const { error } = await signInWithEmail(email);
        if (error) toast.error("Não foi possível enviar o link de acesso.");
        else setLinkSent(true);
      } else {
        toast.info("Não encontramos uma conta com esse e-mail. Vamos te levar para a assinatura.");
        void startCheckout("essencial");
      }
    } catch {
      toast.error("Tente novamente em instantes.");
    }
    setLoginBusy(false);
  };

  const logout = async () => {
    await signOut();
    setAuthedEmail(null);
  };

  return (
    <>
      <AppHeader title="Perfil" showBell />
      <div className="space-y-5 px-5 py-5">
        {/* Account / auth */}
        {authedEmail ? (
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{authedEmail}</p>
              <span className="mt-1 inline-block rounded-full bg-[var(--color-teal)]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-navy)]">
                {PLAN_LABEL[plan] ?? "Grátis"}
              </span>
            </div>
            <button onClick={logout} className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-danger)]">
              Sair <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Já tem conta?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Entre com seu e-mail para acessar sua proteção.</p>
            {linkSent ? (
              <p className="mt-3 text-sm text-[var(--color-success)]">Link enviado para {loginEmail} ✓</p>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none"
                />
                <button
                  onClick={login}
                  disabled={loginBusy}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--color-navy)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loginBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* Meus documentos — Essencial only (Proteção Total has a removal flow, no downloads) */}
        {isPremium && plan !== "protecao_total" && (
          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meus documentos</h2>
            </div>
            {hasReport ? (
              <button
                onClick={downloadRelatorio}
                disabled={pdfBusy}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-secondary/40 disabled:opacity-60"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-navy)]/10">
                  {pdfBusy ? <Loader2 className="h-5 w-5 animate-spin text-[var(--color-navy)]" /> : <FileText className="h-5 w-5 text-[var(--color-navy)]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">📄 Meu relatório completo</span>
                  <span className="block text-[11px] text-muted-foreground">{pdfBusy ? "Gerando..." : "Baixar em PDF"}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ) : (
              <div className="px-4 py-5 text-center">
                <p className="text-sm text-muted-foreground">Nenhum relatório gerado ainda.</p>
                <button
                  onClick={openScan}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-navy)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Fazer scan
                </button>
              </div>
            )}
          </section>
        )}

        {/* Monitored — CPF/e-mail read-only, phone/address editable */}
        <section className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dados monitorados</h2>
            <button onClick={onEditMonitored} className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-navy)]">
              {editing ? "Concluir" : (<><Pencil className="h-3 w-3" /> Editar</>)}
            </button>
          </div>
          <ul>
            <li className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[11px] text-muted-foreground">CPF</p>
                <p className="text-sm font-medium text-foreground">{maskCpf}</p>
              </div>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)]/15">
                <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
              </span>
            </li>
            <li className="flex items-center justify-between border-t border-border/60 px-4 py-3">
              <div>
                <p className="text-[11px] text-muted-foreground">E-mail</p>
                <p className="text-sm font-medium text-foreground">{maskEmail}</p>
              </div>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)]/15">
                <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">Telefone</p>
                {editing ? (
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="(11) 90000-0000"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{phone || "Não informado"}</p>
                )}
              </div>
              {!editing && (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-success)]/15">
                  <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
                </span>
              )}
            </li>
            <li className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">Endereço</p>
                {editing ? (
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade, UF"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{city || "Não informado"}</p>
                )}
              </div>
              {!editing && (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-success)]/15">
                  <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
                </span>
              )}
            </li>
          </ul>
          <button
            onClick={goAddMember}
            className="flex w-full items-center gap-2 border-t border-border/60 px-4 py-3 text-left text-sm font-semibold text-[var(--color-navy)] transition hover:bg-secondary/40"
          >
            <Plus className="h-4 w-4" /> Monitorar outra pessoa
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
            { k: "push" as const, label: "Notificações push", paid: false },
            { k: "email" as const, label: "Alertas por e-mail", paid: false },
            { k: "scan" as const, label: "Varredura automática", paid: true },
          ].map((t, i) => {
            const locked = t.paid && !isPremium;
            return (
              <div key={t.k} className={`flex items-center justify-between px-4 py-3.5 ${i > 0 ? "border-t border-border/60" : ""}`}>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground">{t.label}</p>
                  {locked && <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Pago</span>}
                </div>
                <button
                  onClick={() => {
                    if (locked) {
                      track("InitiateCheckout");
                      void startCheckout("protecao_total");
                      return;
                    }
                    setS({ ...s, [t.k]: !s[t.k] });
                  }}
                  className={`relative h-6 w-11 rounded-full transition ${locked ? "bg-muted" : s[t.k] ? "bg-[var(--color-teal)]" : "bg-muted"}`}
                >
                  {locked ? (
                    <span className="absolute inset-0 grid place-items-center">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </span>
                  ) : (
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${s[t.k] ? "left-[22px]" : "left-0.5"}`} />
                  )}
                </button>
              </div>
            );
          })}
          {/* Política de Privacidade — external (iubenda), opens in new tab */}
          <a
            href="https://www.iubenda.com/privacy-policy/23107752"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-between border-t border-border/60 px-4 py-3.5 text-left hover:bg-secondary/50 transition"
          >
            <p className="text-sm text-foreground">Política de Privacidade</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </a>
          {/* Política de Cookies — external (iubenda), opens in new tab */}
          <a
            href="https://www.iubenda.com/privacy-policy/23107752/cookie-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-between border-t border-border/60 px-4 py-3.5 text-left hover:bg-secondary/50 transition"
          >
            <p className="text-sm text-foreground">Política de Cookies</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </a>
          {/* Termos de Uso — internal route */}
          <Link to="/termos" className="flex w-full items-center justify-between border-t border-border/60 px-4 py-3.5 text-left hover:bg-secondary/50 transition">
            <p className="text-sm text-foreground">Termos de Uso</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <button onClick={logout} className="flex w-full items-center justify-between border-t border-border/60 px-4 py-3.5 text-left hover:bg-secondary/50 transition">
            <p className="text-sm font-medium text-[var(--color-danger)]">Sair</p>
            <LogOut className="h-4 w-4 text-[var(--color-danger)]" />
          </button>
        </section>

        {/* Legal footer */}
        <p className="py-4 text-center text-xs text-gray-700">© 2025 Priva · LGPD · Privacidade · Termos</p>
      </div>
    </>
  );
}
