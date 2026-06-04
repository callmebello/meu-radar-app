const logoUrl = "/PRIVA_BLACK_WEB.png";

type Props = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

export function PrivaLogo({
  size = 36,
  showWordmark = true,
  className = "",
  wordmarkClassName = "text-white",
  onClick,
  ariaLabel = "Priva — ir para o início",
}: Props) {
  const content = (
    <>
      <img
        src={logoUrl}
        alt="Priva"
        className="w-auto object-contain"
        style={{ height: size }}
      />
      {showWordmark && (
        <span className={`font-bold text-xl tracking-tight ${wordmarkClassName}`}>
          priva
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`flex items-center gap-2 rounded-xl transition-transform duration-200 hover:scale-[1.04] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${className}`}
      >
        {content}
      </button>
    );
  }

  return <div className={`flex items-center gap-2 ${className}`}>{content}</div>;
}
