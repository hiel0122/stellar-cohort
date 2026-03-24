import { useAuth } from "@/components/AuthProvider";
import { hasClearance, CLEARANCE_LABELS } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";

interface Props {
  minLevel: number;
  children: React.ReactNode;
  label?: string;
}

/** Hides children if user clearance is below minLevel. Shows a banner instead. */
export function ClearanceGate({ minLevel, children, label }: Props) {
  const { profile } = useAuth();

  if (hasClearance(profile, minLevel)) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center gap-2.5 rounded-md border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span>
        권한이 필요합니다 ({CLEARANCE_LABELS[minLevel] ?? `Level ${minLevel}`}급 이상)
        {label && <span className="ml-1">— {label}</span>}
      </span>
    </div>
  );
}
