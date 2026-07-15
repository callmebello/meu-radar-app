import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listRemovalRequests, updateRemovalStatus } from "@/lib/api/removal.functions";

export const Route = createFileRoute("/admin/removal")({
  head: () => ({ meta: [{ title: "Casos de Remoção — Priva Admin" }] }),
  component: AdminRemoval,
});

const STATUSES = ["pending", "sent", "waiting", "resolved", "escalated"] as const;
type Row = {
  id: string;
  case_id: string;
  full_name: string;
  cpf: string;
  phone: string;
  sources_to_remove: string[] | null;
  status: string;
  created_at: string;
};

function AdminRemoval() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busyId, setBusyId] = useState<string>("");

  const load = async () => {
    try {
      const res = await listRemovalRequests({ data: {} });
      setRows((res.rows as Row[]) ?? []);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    const ok = typeof window !== "undefined" && localStorage.getItem("priva_admin") === "true";
    setAuthed(ok);
    if (ok) void load();
  }, []);

  const change = async (id: string, status: (typeof STATUSES)[number]) => {
    setBusyId(id);
    try {
      await updateRemovalStatus({ data: { id, status } });
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch {
      /* ignore */
    }
    setBusyId("");
  };

  if (authed === null) return <div className="min-h-screen" style={{ backgroundColor: "#0A0A0F" }} />;
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center" style={{ backgroundColor: "#0A0A0F" }}>
        <p className="text-sm text-gray-400">
          Acesso restrito. Rode <code className="text-indigo-400">localStorage.setItem(&apos;priva_admin&apos;,&apos;true&apos;)</code> no console e recarregue.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 text-gray-200" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Casos de Remoção ({rows.length})</h1>
          <button onClick={load} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm">Atualizar</button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                {["Caso", "Nome", "CPF", "Fontes", "Status", "Criado"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">Nenhum caso ainda.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-indigo-300">{r.case_id}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-white">{r.full_name}</td>
                  <td className="whitespace-nowrap px-3 py-2">{r.cpf}</td>
                  <td className="px-3 py-2">{(r.sources_to_remove ?? []).length}</td>
                  <td className="px-3 py-2">
                    <select
                      value={r.status}
                      disabled={busyId === r.id}
                      onChange={(e) => change(r.id, e.target.value as (typeof STATUSES)[number])}
                      className="rounded-md border border-white/10 bg-[#12121A] px-2 py-1 text-xs text-white"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Alterar para <b>sent</b> dispara e-mail “carta enviada” ao usuário; <b>resolved</b> dispara “dados removidos”.
        </p>
      </div>
    </div>
  );
}
