/**
 * Renders the Priva ID as an image, on the device.
 *
 * Drawn on a canvas rather than screenshotting the DOM: no extra dependency, no
 * font-loading surprises, and — the part that matters here — the card never
 * leaves the phone to be rendered. What the person shares is a picture they
 * hold, not a page we publish about them.
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

const W = 1000;
const H = 620;
const INDIGO = "#4F46E5";
const GREEN = "#0FA968";
const GREY = "#8A8AA0";

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

function drawCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy);
  ctx.lineTo(cx - 1.5, cy + 5);
  ctx.lineTo(cx + 6.5, cy - 5);
  ctx.stroke();
}

function drawEmptyRing(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.strokeStyle = GREY;
  ctx.lineWidth = 4;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export async function renderPrivaIdPng(data: PrivaIdData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  // Card
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  const tint = ctx.createRadialGradient(W * 0.86, H * 0.18, 20, W * 0.86, H * 0.18, W * 0.75);
  tint.addColorStop(0, "rgba(99,102,241,0.13)");
  tint.addColorStop(1, "rgba(99,102,241,0)");
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(20,20,40,0.10)";
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, 34);
  ctx.stroke();

  const pad = 58;

  // Wordmark
  const logo = await loadImage("/PRIVA_logo_light_theme.png");
  if (logo) {
    const h = 34;
    ctx.drawImage(logo, pad, pad, (logo.width / logo.height) * h, h);
    ctx.fillStyle = GREY;
    ctx.font = "700 24px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("ID", pad + (logo.width / logo.height) * h + 14, pad + 26);
  } else {
    ctx.fillStyle = INDIGO;
    ctx.font = "800 30px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("PRIVA", pad, pad + 28);
    ctx.fillStyle = GREY;
    ctx.fillText("ID", pad + 120, pad + 28);
  }

  // Plan pill
  const pill = data.premium ? "PRO · ATIVO" : "GRATUITO";
  ctx.font = "700 20px system-ui, -apple-system, Segoe UI, sans-serif";
  const pw = ctx.measureText(pill).width + 44;
  ctx.strokeStyle = data.premium ? "rgba(79,70,229,0.40)" : "rgba(20,20,40,0.14)";
  ctx.lineWidth = 2;
  roundRect(ctx, W - pad - pw, pad - 4, pw, 44, 22);
  ctx.stroke();
  ctx.fillStyle = data.premium ? INDIGO : GREY;
  ctx.fillText(pill, W - pad - pw + 22, pad + 25);

  // Avatar
  const cx = pad + 62;
  const cy = 250;
  const avatar = data.avatar ? await loadImage(data.avatar) : null;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, cx - 62, cy - 62, 124, 124);
  } else {
    ctx.fillStyle = "rgba(79,70,229,0.10)";
    ctx.fillRect(cx - 62, cy - 62, 124, 124);
    ctx.fillStyle = INDIGO;
    ctx.font = "700 46px system-ui, -apple-system, Segoe UI, sans-serif";
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
  ctx.strokeStyle = "rgba(79,70,229,0.22)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  ctx.stroke();

  // Name + identity id
  ctx.fillStyle = "#12121C";
  ctx.font = "800 52px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(data.name, pad + 150, 238);
  ctx.fillStyle = GREY;
  ctx.font = "600 26px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(`PRV •••• ${data.identityId.slice(-4)}`, pad + 150, 278);
  ctx.font = "600 18px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("IDENTITY ID", pad + 150, 306);

  // Score
  if (data.score !== null) {
    ctx.textAlign = "right";
    ctx.fillStyle = GREY;
    ctx.font = "600 20px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("SCORE", W - pad, 218);
    ctx.fillStyle = INDIGO;
    ctx.font = "800 72px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(String(data.score), W - pad, 288);
    ctx.textAlign = "left";
  }

  // Seals
  const colW = (W - pad * 2) / data.seals.length;
  data.seals.forEach((s, i) => {
    const x = pad + colW * i;
    const y = 430;
    if (s.state === "empty") drawEmptyRing(ctx, x + 15, y);
    else drawCheck(ctx, x + 15, y, s.state === "verified" ? INDIGO : GREEN);
    ctx.fillStyle = "#12121C";
    ctx.font = "700 24px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(s.label, x + 40, y - 2);
    ctx.fillStyle = s.state === "verified" ? INDIGO : s.state === "filled" ? GREEN : GREY;
    ctx.font = "600 20px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(
      s.state === "verified" ? "Verificado" : s.state === "filled" ? "Informado" : "Vazio",
      x + 40,
      y + 26,
    );
  });

  // Footer
  ctx.strokeStyle = "rgba(20,20,40,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, 512);
  ctx.lineTo(W - pad, 512);
  ctx.stroke();
  ctx.fillStyle = GREY;
  ctx.font = "600 22px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("privaapp.com.br", pad, 556);
  ctx.textAlign = "right";
  ctx.fillText(new Date().toLocaleDateString("pt-BR"), W - pad, 556);
  ctx.textAlign = "left";

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
}
