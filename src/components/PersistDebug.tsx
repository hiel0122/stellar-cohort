import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getAllPersistedState, clearAllPersistedState } from "@/lib/persistedUiStore";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bug, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin-only debug popover for UI state persistence.
 * Shows stored page keys and allows cache reset.
 */
export function PersistDebug() {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<Record<string, unknown>>({});

  if (role !== "admin") return null;

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setSnapshot(getAllPersistedState());
    }
    setOpen(isOpen);
  };

  const handleReset = () => {
    clearAllPersistedState();
    setSnapshot({});
    toast.success("UI 캐시가 초기화되었습니다.");
  };

  const entries = Object.entries(snapshot);

  return (
    <div className="fixed bottom-3 right-3 z-50">
      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur shadow-sm border-border/50 opacity-40 hover:opacity-100 transition-opacity"
          >
            <Bug className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-80 max-h-[400px] overflow-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Persist Debug</h4>
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-destructive" onClick={handleReset}>
                <Trash2 className="h-3 w-3" /> Reset
              </Button>
            </div>
            {entries.length === 0 ? (
              <p className="text-xs text-muted-foreground">저장된 상태 없음</p>
            ) : (
              <div className="space-y-2">
                {entries.map(([key, val]) => (
                  <div key={key} className="rounded border border-border p-2">
                    <p className="text-[10px] font-mono text-muted-foreground break-all">{key}</p>
                    <pre className="text-[10px] mt-1 text-foreground/80 whitespace-pre-wrap break-all max-h-24 overflow-auto">
                      {JSON.stringify(val, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
