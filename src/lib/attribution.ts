/**
 * Where this person came from.
 *
 * The content plan measures narratives, not videos: the question is "which
 * story sells Priva", not "which clip got views". Answering it needs the
 * origin to survive all the way from the click to the sale — TikTok can report
 * views and Stripe can report revenue, but nothing joins the two unless we
 * carry the source ourselves.
 *
 * Link convention, so the asset bank maps 1:1 onto the data:
 *   utm_source   = the account that posted  (tiktok_creator_01, ig_priva)
 *   utm_medium   = organic | paid | bio | dm
 *   utm_campaign = the NARRATIVE            (cpf_exposto, golpes_comecam_assim)
 *   utm_content  = the ASSET id             (042)
 *
 * First touch is what we keep. Someone sees the UGC video, comes back three
 * days later by typing the domain, and buys — the sale belongs to the video,
 * not to the direct visit. Last touch is stored too, but only as a footnote.
 */
export type Attribution = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  referrer: string;
  landing: string;
  at: string;
};

const FIRST_KEY = "priva_attrib_first";
const LAST_KEY = "priva_attrib_last";

const CLICK_IDS = ["fbclid", "ttclid", "gclid"] as const;

/** Infers a source when there are no UTMs — a shared link, a bio without tags. */
function inferSource(params: URLSearchParams, referrer: string): string {
  for (const id of CLICK_IDS) {
    if (params.get(id)) return id === "fbclid" ? "meta" : id === "ttclid" ? "tiktok" : "google";
  }
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.endsWith("privaapp.com.br")) return "internal";
    return host;
  } catch {
    return "direct";
  }
}

function readParams(): Attribution | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || "";
  const source = params.get("utm_source") || inferSource(params, referrer);
  // An internal navigation is not a new visit — ignore it entirely so it can
  // never overwrite a real source as "last touch".
  if (source === "internal") return null;
  return {
    source,
    medium: params.get("utm_medium") || (params.get("utm_source") ? "unknown" : "direct"),
    campaign: params.get("utm_campaign") || "",
    content: params.get("utm_content") || "",
    term: params.get("utm_term") || "",
    referrer: referrer.slice(0, 300),
    landing: window.location.pathname,
    at: new Date().toISOString(),
  };
}

/**
 * Records the visit. Safe to call on every load: the first touch is written
 * once and never overwritten.
 */
export function captureAttribution(): void {
  const now = readParams();
  if (!now) return;
  try {
    if (!localStorage.getItem(FIRST_KEY)) {
      localStorage.setItem(FIRST_KEY, JSON.stringify(now));
    }
    localStorage.setItem(LAST_KEY, JSON.stringify(now));
  } catch {
    /* storage blocked — attribution is best-effort, the funnel still works */
  }
}

function read(key: string): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as Attribution | null;
  } catch {
    return null;
  }
}

export const getFirstTouch = () => read(FIRST_KEY);
export const getLastTouch = () => read(LAST_KEY);

/** Flat params for analytics events, so GA4/Meta can break down by narrative. */
export function attributionParams(): Record<string, string> {
  const f = getFirstTouch();
  if (!f) return {};
  return {
    source: f.source,
    campaign: f.campaign,
    asset: f.content,
  };
}
