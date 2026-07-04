import { useState, type ReactNode } from "react";
import {
  CreditCard, Mail, Phone, MapPin, X, AlertCircle, ShieldAlert, PhoneCall,
  CheckCircle2, Radar, ChevronRight, Trash2, Check,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { generateResult, maskedFields } from "@/lib/funnel";
import { startCheckout } from "@/lib/checkout";
import { getProfile, saveProfile, type ProfileData } from "@/lib/profile";

export type CardType = "cpf" | "email" | "telefone" | "endereco";

function getCpf() {
  try {
    return sessionStorage.getItem("priva_cpf") || "529.982.247-25";
  } catch {
    return "529.982.247-25";
  }
}

function Sheet({ icon, title, onClose, children }: { icon: ReactNode; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="flex h-[92vh] w-full flex-col rounded-t-3xl animate-sheet-up"
        style={{ backgroundColor: "#0A0A0F", borderTop: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 -10px 44px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-1 mt-3 h-1 w-10 rounded-full bg-gray-700" />
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-2 text-indigo-400">
            {icon}
            <span className="text-base font-semibold text-white">{title}</span>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="grid h-8 w-8 place-items-center rounded-full bg-gray-800 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function RiskBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color, backgroundColor: bg }}>{label}</span>;
}

function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-3 w-full rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
      style={{ backgroundColor: "#12121A", border: "1px solid rgba(255,255,255,0.1)" }}
    />
  );
}

function ScanAction({ onScan }: { onScan: () => void }) {
  return (
    <button onClick={onScan} className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: "#12121A" }}>
      <span className="flex items-center gap-2">
        <Radar className="h-4 w-4 text-indigo-400" />
        <span className="text-sm text-white">Fazer novo scan</span>
      </span>
      <ChevronRight className="h-4 w-4 text-gray-600" />
    </button>
  );
}

function DeleteCTA({ title, sub, price = "R$29,90/mês", dimmed = false }: { title: string; sub: string; price?: string; dimmed?: boolean }) {
  return (
    <button
      onClick={() => void startCheckout("protecao_total")}
      className={`mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left ${dimmed ? "opacity-60" : ""}`}
      style={{ border: "1px solid rgba(239,68,68,0.2)" }}
    >
      <span className="flex items-center gap-2">
        <Trash2 className="h-4 w-4 shrink-0 text-red-400" />
        <span>
          <span className="block text-sm font-medium text-white">{title}</span>
          <span className="mt-0.5 block text-xs text-gray-500">{sub}</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <span className="text-xs font-medium text-indigo-400">{price}</span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
      </span>
    </button>
  );
}

const valueBox = { backgroundColor: "#12121A" };

function SaveButton({ label, saved, onClick, variant = "solid" }: { label: string; saved: boolean; onClick: () => void; variant?: "solid" | "outline" }) {
  return (
    <button
      onClick={onClick}
      className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.99] ${
        variant === "outline" ? "border border-indigo-500/40 text-indigo-300" : "bg-indigo-600 text-white"
      }`}
    >
      {saved ? (
        <>
          <Check className="h-4 w-4" /> Salvo
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function IdentityCardSheet({ type, onClose }: { type: CardType; onClose: () => void }) {
  const { openScan } = useApp();
  const profile = getProfile();
  const init = (k: keyof ProfileData) => profile[k] ?? "";
  const [a, setA] = useState(() =>
    type === "cpf" ? init("cpfName") : type === "email" ? init("extraEmail") : type === "telefone" ? init("extraPhone") : init("addrCep"),
  );
  const [b, setB] = useState(() => (type === "cpf" ? init("cpfBirth") : type === "endereco" ? init("addrStreet") : ""));
  const [c, setC] = useState(() => (type === "endereco" ? init("addrCity") : ""));
  const [saved, setSaved] = useState(false);
  const cpf = getCpf();
  const result = generateResult(cpf);
  const mask = maskedFields(cpf, result.seed);
  const scan = () => { onClose(); openScan(); };
  const persist = (patch: Partial<ProfileData>) => {
    saveProfile(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  if (type === "cpf") {
    return (
      <Sheet icon={<CreditCard size={20} />} title="CPF" onClose={onClose}>
        <RiskBadge label="ALTO RISCO" color="#F87171" bg="rgba(239,68,68,0.2)" />
        <div className="mt-4 rounded-xl px-4 py-3" style={valueBox}>
          <p className="text-xs text-gray-400">CPF monitorado</p>
          <p className="mt-1 font-mono text-lg text-white">{`***.***.**${mask.cpfLast2}`}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-red-400"><AlertCircle className="h-3.5 w-3.5" /> Encontrado em {result.breaches} vazamentos</p>
        </div>

        <p className="mt-5 font-medium text-white">Adicionar informações</p>
        <p className="mt-1 text-xs text-gray-400">Adicione dados para monitoramento mais preciso</p>
        <Input placeholder="Seu nome completo" value={a} onChange={setA} />
        <Input placeholder="DD/MM/AAAA" value={b} onChange={setB} />
        <SaveButton label="Salvar" saved={saved} onClick={() => persist({ cpfName: a, cpfBirth: b })} />

        <ScanAction onScan={scan} />
        <DeleteCTA title="Remover dados da internet" sub="Solicitar remoção via LGPD" />
      </Sheet>
    );
  }

  if (type === "email") {
    const breaches = [
      { src: "Base de dados comprometida — Jan 2025", desc: "E-mail e senha expostos", lvl: "ALTO" },
      { src: "Loja VarejoBR — Set 2024", desc: "E-mail exposto", lvl: "MÉDIO" },
    ];
    return (
      <Sheet icon={<Mail size={20} />} title="E-mail" onClose={onClose}>
        <RiskBadge label="MÉDIO RISCO" color="#FBBF24" bg="rgba(245,158,11,0.2)" />
        <div className="mt-4 rounded-xl px-4 py-3" style={valueBox}>
          <p className="font-mono text-lg text-white">{`${mask.first}•••••@${mask.domain}`}</p>
        </div>

        <p className="mt-4 font-medium text-white">Vazamentos encontrados</p>
        <div className="mt-2 space-y-2">
          {breaches.map((br) => (
            <div key={br.src} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={valueBox}>
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{br.src}</p>
                <p className="text-xs text-gray-400">{br.desc}</p>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: br.lvl === "ALTO" ? "#F87171" : "#FBBF24", backgroundColor: br.lvl === "ALTO" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)" }}>{br.lvl}</span>
            </div>
          ))}
        </div>

        <p className="mt-5 font-medium text-white">Adicionar outro e-mail</p>
        <Input placeholder="outro@email.com" value={a} onChange={setA} />
        <SaveButton label="Monitorar este e-mail também" variant="outline" saved={saved} onClick={() => persist({ extraEmail: a })} />

        <ScanAction onScan={scan} />
        <DeleteCTA title="Remover e-mail da internet" sub="Solicitar exclusão de bases de dados" />
      </Sheet>
    );
  }

  if (type === "telefone") {
    return (
      <Sheet icon={<Phone size={20} />} title="Telefone" onClose={onClose}>
        <RiskBadge label="BAIXO RISCO" color="#34D399" bg="rgba(34,197,94,0.2)" />
        <div className="mt-4 rounded-xl px-4 py-3" style={valueBox}>
          <p className="font-mono text-lg text-white">{`(11) 9••••-${mask.phoneLast4}`}</p>
        </div>

        <div className="mt-4 rounded-xl px-4 py-3" style={valueBox}>
          <p className="flex items-center gap-2 text-sm text-amber-400"><PhoneCall className="h-4 w-4" /> Telefone encontrado em 1 base</p>
          <p className="mt-2 text-xs text-gray-400">Pode estar sendo usado para tentativas de SIM swap ou golpes via WhatsApp</p>
        </div>

        <p className="mt-5 font-medium text-white">Adicionar outro número</p>
        <Input placeholder="(11) 99999-9999" value={a} onChange={(v) => setA(v)} />
        <SaveButton label="Salvar" saved={saved} onClick={() => persist({ extraPhone: a })} />

        <ScanAction onScan={scan} />
        <DeleteCTA title="Remover telefone de bases públicas" sub="Solicitar remoção via LGPD" />
      </Sheet>
    );
  }

  // endereco
  return (
    <Sheet icon={<MapPin size={20} />} title="Endereço" onClose={onClose}>
      <RiskBadge label="VERIFICADO" color="#34D399" bg="rgba(34,197,94,0.2)" />
      <div className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
        <p className="text-sm text-green-400">Endereço não encontrado em vazamentos conhecidos</p>
      </div>

      <p className="mt-5 font-medium text-white">Adicionar endereço para monitoramento</p>
      <Input placeholder="CEP" value={a} onChange={setA} />
      <Input placeholder="Rua e número" value={b} onChange={setB} />
      <Input placeholder="Cidade, Estado" value={c} onChange={setC} />
      <SaveButton label="Salvar e monitorar" saved={saved} onClick={() => persist({ addrCep: a, addrStreet: b, addrCity: c })} />

      <ScanAction onScan={scan} />
      <DeleteCTA title="Monitoramento preventivo" sub="Proteção contínua do endereço" dimmed />
    </Sheet>
  );
}
