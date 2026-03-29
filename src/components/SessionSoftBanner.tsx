import { AlertTriangle, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionSoftBannerProps {
  message: string;
  busy?: boolean;
  onRetry: () => void | Promise<void>;
  onReset: () => void;
  onDismiss: () => void;
}

export function SessionSoftBanner({ message, busy = false, onRetry, onReset, onDismiss }: SessionSoftBannerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-background/85 px-4 py-3 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 rounded-full bg-muted p-1.5 text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
        <p className="min-w-0 text-sm text-foreground/85">{message}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end md:self-auto">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void onRetry()} disabled={busy}>
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          다시 시도
        </Button>
        <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={onReset}>
          <Trash2 className="h-3.5 w-3.5" />
          세션 초기화
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onDismiss} aria-label="배너 닫기">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}