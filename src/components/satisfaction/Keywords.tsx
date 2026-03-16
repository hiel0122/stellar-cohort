import { Badge } from "@/components/ui/badge";

interface Props {
  keywords: { word: string; count: number }[];
}

export function SatisfactionKeywords({ keywords }: Props) {
  if (keywords.length === 0) return null;
  const maxCount = keywords[0]?.count ?? 1;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">키워드 Top {keywords.length}</p>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((kw) => {
          const opacity = 0.4 + (kw.count / maxCount) * 0.6;
          return (
            <Badge
              key={kw.word}
              variant="secondary"
              className="text-xs"
              style={{ opacity }}
            >
              {kw.word}
              <span className="ml-1 text-muted-foreground">({kw.count})</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
