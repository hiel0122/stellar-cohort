import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFunnelData } from "@/data/mockData";

interface Props {
  cohortId: string;
}

export function FunnelTable({ cohortId }: Props) {
  const funnel = getFunnelData(cohortId);
  const steps = [
    { label: "리드", count: funnel.lead, pct: 100 },
    { label: "지원", count: funnel.applied, pct: funnel.lead > 0 ? (funnel.applied / funnel.lead) * 100 : 0 },
    { label: "결제", count: funnel.paid, pct: funnel.lead > 0 ? (funnel.paid / funnel.lead) * 100 : 0 },
  ];

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--chart-3))",
    "hsl(var(--kpi-positive))",
  ];

  return (
    <Card className="border">
      <CardHeader className="pb-1 px-4 pt-4">
        <CardTitle className="text-sm font-semibold">전환 퍼널</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.label}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-card-foreground">{step.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-card-foreground">{step.count}명</span>
                  <span className="text-[10px] text-muted-foreground">({step.pct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${step.pct}%`, backgroundColor: colors[i] }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Funnel comparison mini table */}
        <div className="mt-5 border-t pt-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">단계별 전환</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted/50 p-2.5">
              <p className="text-[10px] text-muted-foreground">리드→지원</p>
              <p className="text-sm font-semibold text-card-foreground">
                {funnel.lead > 0 ? ((funnel.applied / funnel.lead) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-2.5">
              <p className="text-[10px] text-muted-foreground">지원→결제</p>
              <p className="text-sm font-semibold text-card-foreground">
                {funnel.applied > 0 ? ((funnel.paid / funnel.applied) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
