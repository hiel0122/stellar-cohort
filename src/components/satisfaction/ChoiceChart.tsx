import type { ChoiceAnalysis } from "@/lib/satisfaction/types";

interface Props {
  analysis: ChoiceAnalysis;
}

export function SatisfactionChoiceChart({ analysis }: Props) {
  const maxCount = Math.max(...analysis.distribution.map((d) => d.count), 1);

  return (
    <div className="space-y-1.5">
      {analysis.distribution.map((d) => (
        <div key={d.value} className="flex items-center gap-2 text-xs">
          <span className="w-[40%] truncate text-foreground/80" title={d.value}>
            {d.value}
          </span>
          <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-sm transition-all"
              style={{ width: `${(d.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-16 text-right text-muted-foreground">
            {d.count}명 ({d.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
}
