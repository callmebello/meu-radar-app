import process from "node:process";

// Brevo (Sendinblue) marketing API — SERVER ONLY. Adds/updates a contact and
// drops them into a list so leads who scanned (paid or not) can be remarketed.
// No-ops when BREVO_API_KEY is missing, so it's safe before configuration.
export async function addBrevoContact(email: string, attributes?: Record<string, unknown>): Promise<void> {
  const key = process.env.BREVO_API_KEY;
  if (!key || !email) return;
  const listId = Number(process.env.BREVO_LIST_ID || 0);
  try {
    await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": key,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        email,
        updateEnabled: true, // upsert: update the contact if it already exists
        ...(listId ? { listIds: [listId] } : {}),
        ...(attributes ? { attributes } : {}),
      }),
    });
  } catch {
    /* best-effort — never block the scan flow on marketing sync */
  }
}
