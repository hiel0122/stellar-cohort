import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataUpdateBannerProps {
  onApply: () => void;
  onDismiss: () => void;
}

export function DataUpdateBanner({ onApply, onDismiss }: DataUpdateBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-foreground">
        <RefreshCw className="h-3.5 w-3.5 text-primary" />
        <span>새 데이터가 있습니다. 적용하시겠어요?</span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="default" className="h-7 text-xs" onClick={onApply}>
          적용
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDismiss} aria-label="무시">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
