import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string;
  deltaPct: number | null;
  icon: React.ReactNode;
  onClick?: () => void;
}

export function KPICard({ title, value, deltaPct, icon, onClick }: KPICardProps) {
  const deltaDisplay =
    deltaPct === null
      ? { text: "N/A", color: "text-kpi-neutral", bg: "bg-kpi-neutral-bg", Icon: Minus }
      : deltaPct >= 0
      ? { text: `+${deltaPct.toFixed(1)}%`, color: "text-kpi-positive", bg: "bg-kpi-positive-bg", Icon: TrendingUp }
      : { text: `${deltaPct.toFixed(1)}%`, color: "text-kpi-negative", bg: "bg-kpi-negative-bg", Icon: TrendingDown };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            {icon}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${deltaDisplay.bg} ${deltaDisplay.color}`}>
            <deltaDisplay.Icon className="h-3 w-3" />
            {deltaDisplay.text}
          </span>
          <span className="text-xs text-muted-foreground">vs 전기수</span>
        </div>
      </CardContent>
    </Card>
  );
}
