import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FunnelData } from "@/lib/types";
import { formatInt } from "@/lib/format";

interface Props {
  funnel: FunnelData | null;
  loading?: boolean;
}

export function FunnelTable({ funnel, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-1 px-4 pt-4"><Skeleton className="h-4 w-20" /></CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!funnel || funnel.lead === 0) {
    return (
      <Card>
        <CardHeader className="pb-1 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">전환 퍼널</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground py-6 text-center">퍼널 데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    { label: "리드", count: funnel.lead, pct: 100 },
    { label: "지원", count: funnel.applied, pct: (funnel.applied / funnel.lead) * 100 },
    { label: "결제", count: funnel.paid, pct: (funnel.paid / funnel.lead) * 100 },
  ];

  const opacities = [1, 0.65, 0.4];

  return (
    <Card>
      <CardHeader className="pb-1 px-4 pt-4">
        <CardTitle className="text-sm font-semibold">전환 퍼널</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3.5">
          {steps.map((step, i) => (
            <div key={step.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{step.label}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold tabular-nums text-foreground">{formatInt(step.count)}명</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{step.pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${step.pct}%`, opacity: opacities[i] }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t pt-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">단계별 전환</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-md bg-muted p-2.5">
              <p className="text-[10px] text-muted-foreground">리드 → 지원</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {funnel.lead > 0 ? ((funnel.applied / funnel.lead) * 100).toFixed(1) : "0.0"}%
              </p>
            </div>
            <div className="rounded-md bg-muted p-2.5">
              <p className="text-[10px] text-muted-foreground">지원 → 결제</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {funnel.applied > 0 ? ((funnel.paid / funnel.applied) * 100).toFixed(1) : "0.0"}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
