import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

// Proteção Total removal cases: create the case (+ internal & user e-mails),
// read the latest case for the dashboard tracking card, and admin status
// management (+ e-mails on 'sent'/'resolved'). All server-only.

const ADMIN_EMAIL = "contato@privaapp.com.br";

function newCaseId(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rnd = String(Math.floor(1000 + Math.random() * 9000));
  return `PV-${ym}-${rnd}`;
}

const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

function internalEmail(p: {
  caseId: string;
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  sources: string[];
}) {
  const rows = [
    ["Caso", p.caseId],
    ["Nome", p.fullName],
    ["E-mail", p.email],
    ["CPF", p.cpf],
    ["Telefone", p.phone],
    ["Data de nascimento", p.birthDate],
    ["Fontes a remover", p.sources.join(", ") || "—"],
    ["Data/hora", new Date().toLocaleString("pt-BR")],
  ]
    .map(([k, v]) => `<tr><td style="padding:4px 10px;color:#666;">${k}</td><td style="padding:4px 10px;font-weight:600;">${v}</td></tr>`)
    .join("");
  return {
    subject: `🔔 Novo caso de remoção — ${p.caseId}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111;">
      <h2>Novo caso de remoção (Proteção Total)</h2>
      <table style="border-collapse:collapse;">${rows}</table>
      <p style="margin-top:16px;padding:12px;background:#f4f4f7;border-radius:8px;">
        <strong>Ação necessária:</strong> enviar carta LGPD às fontes identificadas com o usuário em CC.
      </p></div>`,
    text: `Novo caso ${p.caseId}\nNome: ${p.fullName}\nE-mail: ${p.email}\nCPF: ${p.cpf}\nTelefone: ${p.phone}\nNascimento: ${p.birthDate}\nFontes: ${p.sources.join(", ")}\nAção: enviar carta LGPD com o usuário em CC.`,
  };
}

function shell(title: string, bodyHtml: string) {
  return `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;background:#06060f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06060f;padding:32px 0;"><tr><td align="center">
  <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:92%;background:#12121a;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
  <tr><td style="padding:32px 40px 8px;text-align:center;"><img src="https://www.privaapp.com.br/PRIVA_logo_dark_theme.png" alt="PRIVA" width="90" style="width:90px;height:auto;" /></td></tr>
  <tr><td style="padding:12px 40px 8px;"><h1 style="margin:0;font-family:Arial,sans-serif;font-size:20px;color:#fff;text-align:center;">${title}</h1></td></tr>
  <tr><td style="padding:8px 40px 28px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#c4c4d0;">${bodyHtml}</td></tr>
  <tr><td style="padding:20px 40px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;"><p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#565663;">Priva · Proteção de Identidade Digital · privaapp.com.br</p></td></tr>
  </table></td></tr></table></body></html>`;
}

export const createRemovalRequest = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().nullish(),
      email: z.string().email(),
      fullName: z.string().min(1),
      cpf: z.string().min(1),
      phone: z.string().min(1),
      birthDate: z.string().min(1),
      address: z.string().nullish(),
      confirmedData: z.record(z.string(), z.unknown()).nullish(),
      sourcesToRemove: z.array(z.string()).default([]),
      authorizationText: z.string().min(1),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; caseId?: string; status?: string; reason?: string }> => {
    const admin = getSupabaseAdmin();
    if (!admin) return { ok: false, reason: "not_configured" };

    let uid = data.userId ?? null;
    if (!uid) {
      const { data: u } = await admin.from("users").select("id").eq("email", data.email).maybeSingle();
      uid = (u?.id as string) ?? null;
    }

    // Insert with a unique case_id (retry once on the rare collision).
    let caseId = newCaseId();
    let inserted = false;
    for (let attempt = 0; attempt < 2 && !inserted; attempt++) {
      const { error } = await admin.from("removal_requests").insert({
        user_id: uid,
        case_id: caseId,
        full_name: data.fullName,
        cpf: data.cpf,
        phone: data.phone,
        birth_date: data.birthDate,
        address: data.address ?? null,
        confirmed_data: data.confirmedData ?? null,
        sources_to_remove: data.sourcesToRemove,
        authorization_text: data.authorizationText,
        status: "pending",
      });
      if (!error) inserted = true;
      else if (error.code === "23505") caseId = newCaseId(); // unique violation → retry
      else return { ok: false, reason: error.message };
    }
    if (!inserted) return { ok: false, reason: "insert_failed" };

    // E-mails (best-effort — never fail the flow on mail issues).
    try {
      const { sendEmail } = await import("../email.server");
      const internal = internalEmail({
        caseId,
        fullName: data.fullName,
        email: data.email,
        cpf: data.cpf,
        phone: data.phone,
        birthDate: data.birthDate,
        sources: data.sourcesToRemove,
      });
      await sendEmail({ to: ADMIN_EMAIL, subject: internal.subject, html: internal.html, text: internal.text });

      const first = data.fullName.trim().split(/\s+/)[0] || "";
      const n = data.sourcesToRemove.length;
      await sendEmail({
        to: data.email,
        subject: `Priva: sua solicitação foi recebida ✓ — Caso ${caseId}`,
        html: shell(
          "Solicitação recebida ✓",
          `<p>Olá, <strong style="color:#fff;">${first}</strong>.</p>
           <p>Recebemos sua solicitação de remoção de dados e nossa equipe já está trabalhando no seu caso.</p>
           <p style="background:#1a1a2e;border-radius:10px;padding:14px;">
             📋 <strong style="color:#fff;">Caso:</strong> ${caseId}<br/>
             📅 <strong style="color:#fff;">Aberto em:</strong> ${fmtDate(new Date())}<br/>
             ⏱ <strong style="color:#fff;">Prazo legal de resposta:</strong> 15 dias úteis
           </p>
           <p>Identificamos <strong style="color:#fff;">${n}</strong> fontes onde seus dados aparecem. Enviaremos a solicitação formal nas próximas 48 horas.</p>
           <p>Você receberá atualizações por e-mail.</p>
           <p style="margin-top:18px;">— Equipe Priva<br/><span style="color:#8a8a99;">contato@privaapp.com.br</span></p>`,
        ),
      });
    } catch {
      /* ignore mail errors */
    }

    return { ok: true, caseId, status: "pending" };
  });

export const getRemovalRequest = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string().nullish(), email: z.string().email().nullish() }))
  .handler(
    async ({
      data,
    }): Promise<{ found: boolean; caseId?: string; status?: string; createdAt?: string; updatedAt?: string; sources?: string[] }> => {
      const admin = getSupabaseAdmin();
      if (!admin) return { found: false };
      let uid = data.userId ?? null;
      if (!uid && data.email) {
        const { data: u } = await admin.from("users").select("id").eq("email", data.email).maybeSingle();
        uid = (u?.id as string) ?? null;
      }
      if (!uid) return { found: false };
      const { data: row } = await admin
        .from("removal_requests")
        .select("case_id, status, created_at, updated_at, sources_to_remove")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!row) return { found: false };
      return {
        found: true,
        caseId: row.case_id as string,
        status: (row.status as string) ?? "pending",
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        sources: (row.sources_to_remove as string[]) ?? [],
      };
    },
  );

export type RemovalRow = {
  id: string;
  case_id: string;
  full_name: string;
  cpf: string;
  phone: string;
  sources_to_remove: string[] | null;
  status: string;
  created_at: string;
  user_id: string | null;
};

export const listRemovalRequests = createServerFn({ method: "POST" })
  .inputValidator(z.object({ limit: z.number().optional() }))
  .handler(async ({ data }): Promise<{ rows: RemovalRow[] }> => {
    const admin = getSupabaseAdmin();
    if (!admin) return { rows: [] };
    const { data: rows } = await admin
      .from("removal_requests")
      .select("id, case_id, full_name, cpf, phone, sources_to_remove, status, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(data?.limit ?? 300);
    return { rows: (rows ?? []) as RemovalRow[] };
  });

export const updateRemovalStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), status: z.enum(["pending", "sent", "waiting", "resolved", "escalated"]) }))
  .handler(async ({ data }): Promise<{ ok: boolean; reason?: string }> => {
    const admin = getSupabaseAdmin();
    if (!admin) return { ok: false, reason: "not_configured" };

    const { data: row } = await admin
      .from("removal_requests")
      .select("case_id, sources_to_remove, user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return { ok: false, reason: "not_found" };

    const { error } = await admin
      .from("removal_requests")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) return { ok: false, reason: error.message };

    // Notify the user on the two milestones.
    if (data.status === "sent" || data.status === "resolved") {
      try {
        const { data: u } = await admin.from("users").select("email").eq("id", row.user_id).maybeSingle();
        const email = u?.email as string | undefined;
        const sources = ((row.sources_to_remove as string[]) ?? []).slice(0, 8).join(", ");
        const caseId = row.case_id as string;
        if (email) {
          const { sendEmail } = await import("../email.server");
          if (data.status === "sent") {
            await sendEmail({
              to: email,
              subject: "Priva: sua carta LGPD foi enviada ✓",
              html: shell(
                "Carta LGPD enviada ✓",
                `<p>Enviamos a solicitação formal de remoção às fontes onde seus dados aparecem (Caso <strong style="color:#fff;">${caseId}</strong>).</p>
                 <p>O prazo legal de resposta é de <strong style="color:#fff;">15 dias úteis</strong>. Você será avisado quando houver retorno.</p>
                 <p style="margin-top:18px;">— Equipe Priva</p>`,
              ),
            });
          } else {
            await sendEmail({
              to: email,
              subject: "Priva: seus dados foram removidos ✓",
              html: shell(
                "Seus dados foram removidos ✓",
                `<p>Confirmamos a remoção dos seus dados${sources ? ` de: <strong style="color:#fff;">${sources}</strong>` : ""} (Caso <strong style="color:#fff;">${caseId}</strong>).</p>
                 <p>Continue monitorando sua exposição com a Priva.</p>
                 <p style="margin-top:18px;">— Equipe Priva</p>`,
              ),
            });
          }
        }
      } catch {
        /* ignore mail errors */
      }
    }
    return { ok: true };
  });
