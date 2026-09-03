/**
 * A progressive fade: the background rises and the blur deepens together.
 *
 * A single backdrop-filter over the whole strip blurs everything by the same
 * amount, which does not read as depth — it reads as bad eyesight. Real
 * fade-outs ramp: barely touched at the top, unreadable at the bottom. That is
 * built by stacking a few blur layers, each masked to start lower than the last,
 * with the colour wash on top.
 */
const LAYERS = [
  { blur: 1, from: 0 },
  { blur: 3, from: 22 },
  { blur: 7, from: 45 },
  { blur: 14, from: 68 },
];

export function FadeOut({ height = 110 }: { height?: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height }}>
      {LAYERS.map((l) => {
        const mask = `linear-gradient(to bottom, transparent ${l.from}%, black ${Math.min(100, l.from + 26)}%)`;
        return (
          <div
            key={l.blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${l.blur}px)`,
              WebkitBackdropFilter: `blur(${l.blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--color-background) 0%, transparent) 0%, color-mix(in srgb, var(--color-background) 55%, transparent) 52%, var(--color-background) 92%)",
        }}
      />
    </div>
  );
}
