/**
 * Tokens for the institutional landing at /inicio.
 *
 * The page owns its palette in literal hex instead of the app's design tokens:
 * it is a public marketing page and must look identical whether or not the
 * visitor has the in-app dark theme stored. Kept in its own module so the
 * component files stay fast-refresh friendly.
 */
export const LP = {
  dark: "#05050D",
  indigo: "#6366F1",
  violet: "#633CFF",
  lilac: "#8B7CFF",
  bgLight: "#FAFAFC",
  text: "#11111A",
  muted: "#656575",
  green: "#0FA968",
};

/** The scan funnel lives at the app root — every "verificar" CTA lands there. */
export const SCAN_HREF = "/";
