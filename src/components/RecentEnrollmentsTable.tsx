import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Enrollment } from "@/lib/types";
import { formatWonCompact, formatWonFull } from "@/lib/format";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  enrollments: Enrollment[];
  loading?: boolean;
}

export function RecentEnrollmentsTable({ enrollments, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-1 px-4 pt-4">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardHeader className="pb-1 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">최근 결제</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {enrollments.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">결제 내역이 없습니다</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2">이름</TableHead>
                  <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2">이메일</TableHead>
                  <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">결제액</TableHead>
                  <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">날짜</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((e) => {
                  const net = e.paid_amount - e.refunded_amount;
                  return (
                    <TableRow key={e.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <TableCell className="py-2 px-2 text-xs">{e.student_name ?? "—"}</TableCell>
                      <TableCell className="py-2 px-2 text-xs text-muted-foreground">{e.student_email ?? "—"}</TableCell>
                      <TableCell className="py-2 px-2 text-xs text-right tabular-nums font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{formatWonCompact(net)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs tabular-nums">{formatWonFull(net)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="py-2 px-2 text-xs text-right text-muted-foreground">{e.paid_at ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
