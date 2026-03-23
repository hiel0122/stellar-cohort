import brandSymbol from "@/assets/brand-symbol.svg";
import brandWordmark from "@/assets/brand-wordmark.svg";
import brandLockup from "@/assets/brand-lockup.svg";

type Variant = "lockup" | "symbol" | "wordmark";

interface BrandMarkProps {
  variant?: Variant;
  height?: number;
  className?: string;
}

const config: Record<Variant, { src: string; alt: string }> = {
  symbol: { src: brandSymbol, alt: "CS logo" },
  wordmark: { src: brandWordmark, alt: "Content S tudio wordmark" },
  lockup: { src: brandLockup, alt: "Content S tudio" },
};

export function BrandMark({ variant = "lockup", height = 32, className = "" }: BrandMarkProps) {
  const { src, alt } = config[variant];

  return (
    <img
      src={src}
      alt={alt}
      aria-label={alt}
      style={{ height, width: "auto" }}
      className={`block shrink-0 ${className}`}
    />
  );
}
