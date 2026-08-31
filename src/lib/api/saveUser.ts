import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";
import process from "node:process";
import { getSupabaseAdmin } from "../supabase.server";

// Upserts a user by email and stores a salted SHA-256 hash of the CPF (never the
// raw CPF). Returns ids for the CLIENT to persist (localStorage can't run here).
export const saveUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      cpf: z.string(),
      // Where this lead came from. Optional so every existing caller keeps
      // working and a blocked localStorage never breaks a scan.
      attribution: z
        .object({
          source: z.string(),
          medium: z.string(),
          campaign: z.string(),
          content: z.string(),
          referrer: z.string(),
          landing: z.string(),
        })
        .partial()
        .optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ userId: string | null; plan: string; cpfHash: string }> => {
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

    // Origin, split in two. First touch answers "which narrative sold this"
    // and is written once — a later direct visit must never steal the credit
    // from the video that started it. Last touch is kept as a footnote.
    // Both are best-effort: attribution must never fail a scan.
    const attrib = data.attribution;
    if (attrib) {
      const email = data.email;
      try {
        await admin
          .from("users")
          .update({
            last_source: attrib.source ?? null,
            last_campaign: attrib.campaign ?? null,
            last_content: attrib.content ?? null,
          })
          .eq("email", email);

        await admin
          .from("users")
          .update({
            first_source: attrib.source ?? null,
            first_medium: attrib.medium ?? null,
            first_campaign: attrib.campaign ?? null,
            first_content: attrib.content ?? null,
            first_referrer: attrib.referrer ?? null,
            first_landing: attrib.landing ?? null,
            first_seen_at: new Date().toISOString(),
          })
          .eq("email", email)
          .is("first_source", null);
      } catch {
        /* ignore */
      }
    }

    // Remarketing: add the lead to the Brevo list (best-effort, non-blocking
    // failure). Every scan captures the e-mail even if they never buy.
    try {
      const { addBrevoContact } = await import("../brevo.server");
      await addBrevoContact(data.email);
    } catch {
      /* ignore */
    }

    return { userId: row.id as string, plan: (row.plan as string) ?? "free", cpfHash };
  });
