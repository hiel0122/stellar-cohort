import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import type { ChecklistSummary } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  checklist: ChecklistSummary | null;
  loading?: boolean;
}

export function ChecklistWidget({ checklist, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-1 px-4 pt-4">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <Skeleton className="h-2 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!checklist || checklist.total === 0) {
    return (
      <Card>
        <CardHeader className="pb-1 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">체크리스트</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground py-6 text-center">체크리스트가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  const pct = Math.round((checklist.done / checklist.total) * 100);
  const incomplete = checklist.items.filter((it) => !it.is_done).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">체크리스트</CardTitle>
          <span className="text-xs tabular-nums text-muted-foreground">
            {checklist.done}/{checklist.total}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <div className="space-y-1.5">
          <Progress value={pct} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground">{pct}% 완료</p>
        </div>

        {incomplete.length > 0 && (
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">미완료 항목</p>
            {incomplete.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50 transition-colors"
              >
                <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                <span className="flex-1 text-foreground">{item.label}</span>
                {item.assignee && (
                  <span className="text-[10px] text-muted-foreground">{item.assignee}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {incomplete.length === 0 && (
          <div className="flex items-center gap-2 py-2 text-xs text-kpi-positive">
            <CheckCircle2 className="h-4 w-4" />
            <span>모든 항목 완료!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
