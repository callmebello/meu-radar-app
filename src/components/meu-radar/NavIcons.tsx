/**
 * Two nav glyphs drawn here rather than taken from the set.
 *
 * Lucide's Shield carries a small peak at the top — fine on its own, but at
 * 22px in a tab bar it reads as a dent. This one has a clean flat shoulder.
 * Atividade uses a plain magnifier: ScanSearch's corner brackets turn to mush
 * at that size and said "scanner" when the tab is simply "look something up".
 */
type Props = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number, strokeWidth: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function ShieldPlain({ size = 22, className, strokeWidth = 2 }: Props) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden>
      <path d="M12 3.2 19.5 6v6.1c0 4.4-3.1 7.4-7.5 8.7-4.4-1.3-7.5-4.3-7.5-8.7V6z" />
    </svg>
  );
}

export function MagnifierPlain({ size = 22, className, strokeWidth = 2 }: Props) {
  return (
    <svg {...base(size, strokeWidth)} className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}
