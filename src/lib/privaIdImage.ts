/**
 * Renders the Priva ID as an image, on the device.
 *
 * Drawn on a canvas rather than screenshotting the DOM: no extra dependency, no
 * font-loading surprises, and — the part that matters here — the card never
 * leaves the phone to be rendered. What the person shares is a picture they
 * hold, not a page we publish about them.
 *
 * It has to be the SAME card. The first version dropped everything that made
 * the card feel like an object — the fingerprint watermark, the iridescent
 * film, the light catching across it, the lucide seals — and kept only the
 * text, so what people downloaded was a receipt of a card rather than the card.
 * Every element on screen is drawn here, in the same order and the same
 * proportions, and nothing is drawn here that is not on screen.
 *
 * The masked values are the ones already on screen; nothing unmasked is drawn.
 */
export type PrivaIdData = {
  name: string;
  identityId: string;
  score: number | null;
  premium: boolean;
  avatar?: string;
  seals: { label: string; state: "verified" | "filled" | "empty" }[];
};

/**
 * The on-screen card measures about 348×258 CSS px — a 1.35:1 box. The export
 * was drawn at 1.61:1, which is why the same elements in the same order still
 * did not read as the same card: everything sat in a wider, shorter frame.
 */
const W = 1000;
const H = 740;
const INDIGO = "#4F46E5";
const GREEN = "#0FA968";
const GREY = "#8A8AA0";
const INK = "#12121C";
const SANS = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/* ── Icons ────────────────────────────────────────────────────────────────
   The exact lucide paths the card renders, on lucide's 24×24 grid, stroked
   through a transform so they scale without the line weight drifting. Copying
   the path data is what keeps the two cards identical: an approximated circle
   with a tick in it is visibly not the same mark as BadgeCheck.               */

const ICON = {
  // Fingerprint (lucide "fingerprint-pattern") — the watermark.
  fingerprint: [
    "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",
    "M14 13.12c0 2.38 0 6.38-1 8.88",
    "M17.29 21.02c.12-.6.43-2.3.5-3.02",
    "M2 12a10 10 0 0 1 18-6",
    "M2 16h.01",
    "M21.8 16c.2-2 .131-5.354 0-6",
    "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",
    "M8.65 22c.21-.66.45-1.32.57-2",
    "M9 6.8a6 6 0 0 1 9 5.2v2",
  ],
  // BadgeCheck — "Verificado".
  badgeCheck: [
    "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
    "m9 12 2 2 4-4",
  ],
  // CheckCircle2 / CircleCheckBig — "Informado".
  circleCheck: ["M21.801 10A10 10 0 1 1 17 3.335", "m9 11 3 3L22 4"],
  // CircleDashed — "Vazio".
  circleDashed: [
    "M10.1 2.182a10 10 0 0 1 3.8 0",
    "M13.9 21.818a10 10 0 0 1-3.8 0",
    "M17.609 3.721a10 10 0 0 1 2.69 2.7",
    "M2.182 13.9a10 10 0 0 1 0-3.8",
    "M20.279 17.609a10 10 0 0 1-2.7 2.69",
    "M21.818 10.1a10 10 0 0 1 0 3.8",
    "M3.721 6.391a10 10 0 0 1 2.7-2.69",
    "M6.391 20.279a10 10 0 0 1-2.69-2.7",
  ],
  // Sparkles — the PRO pill's glyph.
  sparkles: [
    "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
    "M20 2v4",
    "M22 4h-4",
  ],
} as const;

/**
 * Strokes a lucide icon at (x, y) with the given rendered size.
 *
 * `lineWidth` is divided by the scale so a 2px lucide stroke stays visually 2px
 * at 24px and stays proportional when the icon is drawn at 190px — otherwise
 * the watermark comes out as a solid blob.
 */
function drawIcon(
  ctx: CanvasRenderingContext2D,
  paths: readonly string[],
  x: number,
  y: number,
  size: number,
  color: string,
  strokeWidth = 2,
) {
  const s = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of paths) ctx.stroke(new Path2D(d));
  ctx.restore();
}

export async function renderPrivaIdPng(data: PrivaIdData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  const R = 34; // the card's corner radius, at this scale

  // ── Card ground ────────────────────────────────────────────────────────
  ctx.save();
  roundRect(ctx, 0, 0, W, H, R);
  ctx.clip(); // everything below is clipped to the card, so no film shows a corner

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // The card's two background washes, same stops as the CSS.
  const tintA = ctx.createRadialGradient(W * 0.88, H * 0.16, 20, W * 0.88, H * 0.16, W * 0.78);
  tintA.addColorStop(0, "rgba(99,102,241,0.11)");
  tintA.addColorStop(1, "rgba(99,102,241,0)");
  ctx.fillStyle = tintA;
  ctx.fillRect(0, 0, W, H);

  const tintB = ctx.createRadialGradient(W * 0.1, H * 0.94, 20, W * 0.1, H * 0.94, W * 0.6);
  tintB.addColorStop(0, "rgba(79,70,229,0.07)");
  tintB.addColorStop(1, "rgba(79,70,229,0)");
  ctx.fillStyle = tintB;
  ctx.fillRect(0, 0, W, H);

  // ── Watermark ──────────────────────────────────────────────────────────
  // Bleeds off the right edge exactly as on screen (-right-8, top-4).
  ctx.save();
  ctx.globalAlpha = 0.07;
  drawIcon(ctx, ICON.fingerprint, W - 470 + 66, 34, 470, INDIGO, 0.7);
  ctx.restore();

  // ── Reflective film, layer 1: the permanent iridescent wash ────────────
  const film = ctx.createLinearGradient(0, H, W, 0);
  film.addColorStop(0, "rgba(139,92,246,0.10)");
  film.addColorStop(0.26, "rgba(255,255,255,0)");
  film.addColorStop(0.44, "rgba(99,102,241,0.09)");
  film.addColorStop(0.62, "rgba(255,255,255,0)");
  film.addColorStop(1, "rgba(167,139,250,0.11)");
  ctx.fillStyle = film;
  ctx.fillRect(0, 0, W, H);

  // ── Reflective film, layer 2: the bright pass ──────────────────────────
  // On screen this sweeps across once when the card turns. A still can only
  // hold one frame of it, so it is frozen mid-card — the position where the
  // blade reads as light on a laminate rather than as a stripe.
  ctx.save();
  const bandW = W * 0.34;
  ctx.translate(W * 0.46, H / 2);
  ctx.rotate((-10 * Math.PI) / 180); // the 100deg gradient, as a tilt
  const sheen = ctx.createLinearGradient(-bandW / 2, 0, bandW / 2, 0);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.32, "rgba(199,210,254,0.22)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.34)");
  sheen.addColorStop(0.68, "rgba(196,181,253,0.2)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.filter = "blur(16px)";
  ctx.fillRect(-bandW / 2, -H, bandW, H * 2.6);
  ctx.restore();

  const pad = 58;

  // ── Wordmark ───────────────────────────────────────────────────────────
  const logo = await loadImage("/PRIVA_logo_light_theme.png");
  let idX = pad;
  if (logo) {
    const h = 34;
    const w = (logo.width / logo.height) * h;
    ctx.drawImage(logo, pad, pad, w, h);
    idX = pad + w + 12;
  } else {
    ctx.fillStyle = INK;
    ctx.font = `800 34px ${SANS}`;
    ctx.fillText("PRIVA", pad, pad + 29);
    idX = pad + ctx.measureText("PRIVA").width + 12;
  }
  ctx.fillStyle = INDIGO;
  ctx.font = `700 39px ${SANS}`;
  ctx.letterSpacing = "3.9px"; // tracking-[0.10em]
  ctx.fillText("ID", idX, pad + 29);
  ctx.letterSpacing = "0px";

  // ── Plan pill ──────────────────────────────────────────────────────────
  const pill = data.premium ? "PRO · ATIVO" : "GRATUITO";
  ctx.font = `700 21px ${SANS}`;
  const glyph = data.premium ? 30 : 0;
  const pw = ctx.measureText(pill).width + 40 + glyph;
  const ph = 42;
  const px = W - pad - pw;
  const py = pad - 2;
  ctx.strokeStyle = data.premium ? "rgba(79,70,229,0.35)" : "rgba(20,20,40,0.14)";
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, ph / 2);
  ctx.stroke();
  let tx = px + 20;
  if (data.premium) {
    drawIcon(ctx, ICON.sparkles, tx, py + 12, 18, INDIGO, 2.2);
    tx += 26;
  }
  ctx.fillStyle = data.premium ? INDIGO : GREY;
  ctx.fillText(pill, tx, py + 28);

  // ── Identity block ─────────────────────────────────────────────────────
  const cx = pad + 64;
  const cy = 330;
  const avatar = data.avatar ? await loadImage(data.avatar) : null;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 64, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (avatar) {
    // Cover, not stretch: a portrait photo squashed into a circle is the
    // giveaway that the export was generated rather than captured.
    const scale = Math.max(128 / avatar.width, 128 / avatar.height);
    const dw = avatar.width * scale;
    const dh = avatar.height * scale;
    ctx.drawImage(avatar, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = "rgba(79,70,229,0.10)";
    ctx.fillRect(cx - 64, cy - 64, 128, 128);
    ctx.fillStyle = INDIGO;
    ctx.font = `700 40px ${SANS}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      data.name
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join(""),
      cx,
      cy + 2,
    );
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  // The 3px indigo ring the card carries as a box-shadow.
  ctx.strokeStyle = "rgba(79,70,229,0.14)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 67, 0, Math.PI * 2);
  ctx.stroke();

  const textX = pad + 146;
  ctx.fillStyle = INK;
  ctx.font = `800 40px ${SANS}`;
  ctx.fillText(data.name, textX, 318);

  ctx.fillStyle = GREY;
  ctx.font = `600 26px ${SANS}`;
  ctx.fillText(`PRV •••• ${data.identityId.slice(-4)}`, textX, 358);

  ctx.font = `600 20px ${SANS}`;
  ctx.letterSpacing = "1px";
  ctx.fillStyle = "rgba(138,138,160,0.7)";
  ctx.fillText("IDENTITY ID", textX, 388);
  ctx.letterSpacing = "0px";

  // ── Score ──────────────────────────────────────────────────────────────
  if (data.score !== null) {
    ctx.textAlign = "right";
    const right = W - pad - 6; // the card's pr-3 on the score column
    ctx.fillStyle = GREY;
    ctx.font = `600 20px ${SANS}`;
    ctx.letterSpacing = "1px";
    ctx.fillText("SCORE", right, 298);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = INDIGO;
    ctx.font = `800 64px ${SANS}`;
    ctx.fillText(String(data.score), right, 364);
    ctx.textAlign = "left";
  }

  // ── Seals ──────────────────────────────────────────────────────────────
  const colW = (W - pad * 2) / data.seals.length;
  data.seals.forEach((s, i) => {
    const x = pad + colW * i;
    const y = 552;
    const color = s.state === "verified" ? INDIGO : s.state === "filled" ? GREEN : GREY;
    const paths =
      s.state === "verified"
        ? ICON.badgeCheck
        : s.state === "filled"
          ? ICON.circleCheck
          : ICON.circleDashed;
    drawIcon(ctx, paths, x, y - 14, 28, color, 2);

    ctx.fillStyle = INK;
    ctx.font = `600 25px ${SANS}`;
    ctx.fillText(s.label, x + 40, y + 2);
    ctx.fillStyle = s.state === "empty" ? GREY : color;
    ctx.font = `500 21px ${SANS}`;
    ctx.fillText(
      s.state === "verified" ? "Verificado" : s.state === "filled" ? "Informado" : "Vazio",
      x + 40,
      y + 30,
    );
  });

  // ── Footer ─────────────────────────────────────────────────────────────
  // Not on the on-screen card, and deliberately so: on screen the row holds
  // "Voltar ao score" and the share button, which mean nothing in a picture.
  // A shared card still has to say where it came from and when it was true.
  ctx.strokeStyle = "rgba(20,20,40,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, 634);
  ctx.lineTo(W - pad, 634);
  ctx.stroke();
  ctx.fillStyle = GREY;
  ctx.font = `600 22px ${SANS}`;
  ctx.fillText("privaapp.com.br", pad, 682);
  ctx.textAlign = "right";
  ctx.fillText(new Date().toLocaleDateString("pt-BR"), W - pad, 682);
  ctx.textAlign = "left";

  ctx.restore(); // release the card clip

  // ── Border, drawn last so it sits above the film ───────────────────────
  ctx.strokeStyle = "rgba(20,20,40,0.10)";
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, R);
  ctx.stroke();

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
}
