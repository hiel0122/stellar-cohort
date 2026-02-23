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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">전환 퍼널</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={step.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-card-foreground">{step.label}</span>
                <span className="text-muted-foreground">
                  {step.count}명 ({step.pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${step.pct}%`, opacity: 1 - i * 0.15 }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
