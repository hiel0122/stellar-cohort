import type { ScoreDistribution } from "@/lib/satisfaction/types";

interface Props {
  distribution: ScoreDistribution[];
}

export function SatisfactionScoreChart({ distribution }: Props) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5 h-20">
      {distribution.map((d) => (
        <div key={d.value} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{d.percentage.toFixed(0)}%</span>
          <div
            className="w-full rounded-sm bg-primary/80 transition-all min-h-[2px]"
            style={{ height: `${(d.count / maxCount) * 100}%` }}
          />
          <span className="text-[11px] font-medium text-muted-foreground">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
