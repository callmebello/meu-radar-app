import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";
import process from "node:process";
import { getSupabaseAdmin } from "../supabase.server";

// Upserts a user by email and stores a salted SHA-256 hash of the CPF (never the
// raw CPF). Returns ids for the CLIENT to persist (localStorage can't run here).
export const saveUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), cpf: z.string() }))
  .handler(
    async ({ data }): Promise<{ userId: string | null; plan: string; cpfHash: string }> => {
      const cpfHash = crypto
        .createHash("sha256")
        .update(data.cpf.replace(/\D/g, "") + (process.env.CPF_SALT ?? ""))
        .digest("hex");

      const admin = getSupabaseAdmin();
      if (!admin) return { userId: null, plan: "free", cpfHash };

      const { data: row, error } = await admin
        .from("users")
        .upsert(
          {
            email: data.email,
            cpf_hash: cpfHash,
            plan: "free",
            is_paid: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        )
        .select()
        .single();

      if (error || !row) return { userId: null, plan: "free", cpfHash };

      // Remarketing: add the lead to the Brevo list (best-effort, non-blocking
      // failure). Every scan captures the e-mail even if they never buy.
      try {
        const { addBrevoContact } = await import("../brevo.server");
        await addBrevoContact(data.email);
      } catch {
        /* ignore */
      }

      return { userId: row.id as string, plan: (row.plan as string) ?? "free", cpfHash };
    },
  );
