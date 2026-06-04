import logoAsset from "@/assets/priva-logo.png.asset.json";

type Props = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
};

export function PrivaLogo({
  size = 36,
  showWordmark = true,
  className = "",
  wordmarkClassName = "text-white",
}: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoAsset.url}
        alt="Priva"
        width={size}
        height={size}
        className="rounded-[22%] object-contain"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className={`font-bold text-xl tracking-tight ${wordmarkClassName}`}>
          priva
        </span>
      )}
    </div>
  );
}
