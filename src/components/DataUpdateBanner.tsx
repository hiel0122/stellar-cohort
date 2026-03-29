import { useState, useEffect, useRef } from "react";
import { RefreshCw, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface KpiDiff {
  label: string;
  from: string;
  to: string;
  change: string;
}

interface DataUpdateBannerProps {
  onApply: () => void;
  onDismiss: () => void;
  diffs?: KpiDiff[];
}

export function DataUpdateBanner({ onApply, onDismiss, diffs = [] }: DataUpdateBannerProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const mountedRef = useRef(true);

  // Entrance animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(t);
      mountedRef.current = false;
    };
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => {
      if (mountedRef.current) onDismiss();
    }, 120);
  };

  const handleApply = () => {
    setExiting(true);
    setTimeout(() => {
      if (mountedRef.current) onApply();
    }, 120);
  };

  const shownDiffs = diffs.slice(0, 5);
  const extraCount = diffs.length - shownDiffs.length;

  return (
    <div
      className={cn(
        "transition-all duration-150",
        visible && !exiting
          ? "opacity-100 translate-y-0"
          : exiting
            ? "opacity-0 -translate-y-1 duration-[120ms]"
            : "opacity-0 translate-y-1.5",
      )}
    >
      <div className="relative flex items-center gap-3 rounded-[14px] border border-border/70 bg-card px-3.5 py-3 shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)] dark:shadow-none overflow-hidden">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[14px] bg-primary" />

        {/* Icon chip */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <RefreshCw className="h-3.5 w-3.5 text-primary" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            새 데이터가 있습니다
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
            적용하면 최신 KPI로 업데이트됩니다
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {diffs.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-[34px] px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  자세히
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-72 p-3"
              >
                <p className="text-xs font-medium text-foreground mb-2">변경 요약</p>
                <div className="space-y-1.5">
                  {shownDiffs.map((d, i) => (
                    <div key={i} className="flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground truncate mr-2">{d.label}</span>
                      <span className="tabular-nums text-foreground whitespace-nowrap">
                        {d.from} → {d.to}{" "}
                        <span className="text-primary text-[11px]">({d.change})</span>
                      </span>
                    </div>
                  ))}
                  {extraCount > 0 && (
                    <p className="text-[11px] text-muted-foreground pt-0.5">외 {extraCount}건</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-[34px] px-3 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            나중에
          </Button>

          <Button
            size="sm"
            className="h-[34px] rounded-[10px] px-3.5 text-xs font-medium"
            onClick={handleApply}
          >
            업데이트 적용
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            aria-label="닫기"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
