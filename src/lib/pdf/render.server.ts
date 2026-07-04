import type { SupabaseClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildRelatorioDocument, type RelatorioProps } from "./relatorioTemplate";
import { buildCartaLgpdDocument, type CartaLgpdProps } from "./cartaLgpdTemplate";
import { firstSourceUrl, type StoredScanResult } from "./types";

// SERVER ONLY. Imported dynamically from the generate*/lgpd server functions so
// the @react-pdf chain never lands in the client bundle.

const SIGNED_TTL = 7 * 24 * 60 * 60; // 7 days

// QR for the Proteção Total checkout → data URL embedded in the PDF.
async function makeQr(text: string): Promise<string | undefined> {
  try {
    const QRCode = (await import("qrcode")).default;
    return await QRCode.toDataURL(text, { margin: 1, width: 240, color: { dark: "#0B0B1A", light: "#FFFFFF" } });
  } catch {
    return undefined;
  }
}

export async function renderRelatorioBuffer(props: RelatorioProps): Promise<Buffer> {
  // Stripe Payment Link (persistent — checkout sessions expire); MP fallback
  // while dormant, then the site.
  const url =
    process.env.STRIPE_PAYMENT_LINK_PROTECAO ||
    process.env.VITE_MP_PROTECAO_URL ||
    "https://www.privaapp.com.br";
  const qrDataUrl = await makeQr(url);
  return renderToBuffer(buildRelatorioDocument({ ...props, qrDataUrl }));
}

export async function renderCartaBuffer(props: CartaLgpdProps): Promise<Buffer> {
  return renderToBuffer(buildCartaLgpdDocument(props));
}

// Upload a PDF buffer to a (private) bucket, creating the bucket on first use,
// and return a time-limited signed URL.
export async function uploadAndSign(
  admin: SupabaseClient,
  bucket: string,
  path: string,
  buffer: Buffer,
): Promise<string> {
  // Best-effort bucket creation — ignores "already exists".
  await admin.storage.createBucket(bucket, { public: false }).catch(() => undefined);

  const { error: upErr } = await admin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: "application/pdf", upsert: true });
  if (upErr) throw new Error(`upload_failed: ${upErr.message}`);

  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, SIGNED_TTL);
  if (error || !data?.signedUrl) throw new Error(`sign_failed: ${error?.message ?? "no_url"}`);
  return data.signedUrl;
}

export type UserRow = { id: string; email: string; plan: string };
export type ScanRow = { result: StoredScanResult; breach_count: number; created_at: string; email: string | null };

export async function fetchUserAndScan(
  admin: SupabaseClient,
  userId: string,
): Promise<{ user: UserRow | null; scan: ScanRow | null }> {
  const [{ data: user }, { data: scan }] = await Promise.all([
    admin.from("users").select("id, email, plan").eq("id", userId).maybeSingle(),
    admin
      .from("scans")
      .select("result, breach_count, created_at, email")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return { user: (user as UserRow) ?? null, scan: (scan as ScanRow) ?? null };
}

// Full carta-LGPD generation for a user: reads scan + latest authorization,
// renders the PDF, uploads it and returns a signed URL plus the metadata the
// admin notification needs. Shared by generateCartaLgpdPdf and the auth flow.
export async function generateCartaForUser(
  admin: SupabaseClient,
  userId: string,
): Promise<{ url: string; sourceUrl: string | null; fullName: string; email: string } | null> {
  const { user, scan } = await fetchUserAndScan(admin, userId);
  if (!user) return null;

  const { data: auth } = await admin
    .from("lgpd_authorizations")
    .select("full_name, authorized_at")
    .eq("user_id", userId)
    .order("authorized_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const result = scan?.result ?? {};
  const sourceUrl = firstSourceUrl(result);
  const fullName = (auth?.full_name as string) || result.name || user.email;

  const buffer = await renderCartaBuffer({
    fullName,
    cpfLast2: result.cpfLast2,
    email: user.email,
    sourceUrl,
    authorizedAt: (auth?.authorized_at as string) || new Date().toISOString(),
  });

  const url = await uploadAndSign(admin, "cartas-lgpd", `${userId}/carta-lgpd.pdf`, buffer);
  return { url, sourceUrl, fullName, email: user.email };
}
