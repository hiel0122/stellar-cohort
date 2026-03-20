import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { marketingProvider } from "@/lib/marketing";
import type { MarketingLink, ClickEvent } from "@/lib/marketing/types";

interface Props {
  selectedLink: MarketingLink | null;
}

export function ClickLogTable({ selectedLink }: Props) {
  const [limit, setLimit] = useState<10 | 50>(50);
  const [refreshKey, setRefreshKey] = useState(0);

  const events = useMemo(() => {
    void refreshKey;
    const all = selectedLink
      ? marketingProvider.listClickEvents(selectedLink.id)
      : [];
    return [...all]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }, [selectedLink, limit, refreshKey]);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="pb-1 px-5 pt-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium text-foreground">클릭 로그</CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {selectedLink
              ? `"${selectedLink.alias}" 최근 클릭 이벤트(최대 ${limit}개). 중복 제외/집계 여부 확인 가능`
              : "링크를 선택하면 클릭 로그가 표시됩니다"}
          </p>
        </div>
        {selectedLink && (
          <div className="flex items-center gap-1">
            <div className="flex rounded-full border border-border bg-muted/50 p-0.5">
              {([10, 50] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setLimit(n)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                    limit === n
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}개
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {!selectedLink ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            상단 링크 리스트에서 링크를 클릭하여 선택해주세요
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            아직 클릭 이벤트가 없습니다
          </div>
        ) : (
          <div className="max-h-64 overflow-auto rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 px-3 text-[11px]">시간</TableHead>
                  <TableHead className="h-8 px-3 text-[11px]">채널</TableHead>
                  <TableHead className="h-8 px-3 text-[11px] text-right">처리결과</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt) => (
                  <TableRow
                    key={evt.id}
                    className={evt.deduped ? "opacity-60" : ""}
                  >
                    <TableCell className="px-3 py-1.5 text-xs font-mono whitespace-nowrap">
                      {fmtTime(evt.timestamp)}
                    </TableCell>
                    <TableCell className="px-3 py-1.5">
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {selectedLink.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-1.5 text-right">
                      {evt.deduped ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 font-normal border-amber-300/50 text-amber-600 dark:text-amber-400"
                        >
                          중복 제외
                        </Badge>
                      ) : (
                        <span className="text-xs text-foreground">집계됨</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
