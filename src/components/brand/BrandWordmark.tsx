import { Badge } from "@/components/ui/badge";

interface BrandWordmarkProps {
  className?: string;
  showBadge?: boolean;
}

export function BrandWordmark({ className = "", showBadge = true }: BrandWordmarkProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span
        className="font-medium tracking-[-0.01em] text-foreground"
        style={{ fontFamily: "'Caveat', cursive" }}
      >
        Con-tudio
      </span>
      {showBadge && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-4 font-medium bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400 dark:bg-amber-500/15 dark:border-amber-500/30"
        >
          Beta
        </Badge>
      )}
    </div>
  );
}
