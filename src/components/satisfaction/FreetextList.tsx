import type { ColumnClassification } from "@/lib/satisfaction/types";
import { maskName } from "@/lib/satisfaction/privacy";

interface Props {
  rows: string[][];
  columnIndex: number;
  maskPii: boolean;
  piiColumns: ColumnClassification[];
}

export function SatisfactionFreetextList({ rows, columnIndex, maskPii, piiColumns }: Props) {
  const texts = rows
    .map((row, i) => ({ text: (row[columnIndex] ?? "").trim(), rowIdx: i }))
    .filter((t) => t.text.length > 0)
    .slice(0, 50); // Limit display

  if (texts.length === 0) return null;

  return (
    <div className="border-t border-border pt-2">
      <p className="text-xs text-muted-foreground mb-2">원문 (최대 50건)</p>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {texts.map(({ text, rowIdx }) => (
          <div key={rowIdx} className="text-xs text-foreground/80 py-1 border-b border-border/30 last:border-0">
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
