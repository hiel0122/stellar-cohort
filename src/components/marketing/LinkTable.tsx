import { useState, useMemo } from "react";
import { Copy, Check, ExternalLink, Search } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketingLink } from "@/lib/marketing/types";

interface Props {
  links: MarketingLink[];
  selectedLinkId?: string | null;
  onSelect: (link: MarketingLink) => void;
}

export function LinkTable({ links, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"clicks" | "date">("date");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = links.filter(
      (l) =>
        l.alias.toLowerCase().includes(q) ||
        l.channel.toLowerCase().includes(q) ||
        l.campaign.toLowerCase().includes(q),
    );
    list = [...list].sort((a, b) =>
      sortBy === "clicks"
        ? b.total_clicks - a.total_clicks
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return list;
  }, [links, search, sortBy]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base">링크 리스트</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="별명/채널/캠페인 검색"
                className="pl-8 h-8 text-xs w-48"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSortBy(sortBy === "clicks" ? "date" : "clicks")}
            >
              {sortBy === "clicks" ? "클릭순" : "최신순"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">No</TableHead>
                <TableHead>별명</TableHead>
                <TableHead>채널</TableHead>
                <TableHead>캠페인</TableHead>
                <TableHead>단축 링크</TableHead>
                <TableHead>원래 링크</TableHead>
                <TableHead className="text-center">클릭수</TableHead>
                <TableHead>생성일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {links.length === 0 ? "링크를 생성해주세요" : "검색 결과 없음"}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((link, i) => (
                <TableRow
                  key={link.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelect(link)}
                >
                  <TableCell className="text-center text-muted-foreground text-xs">{i + 1}</TableCell>
                  <TableCell className="font-medium text-sm max-w-[120px] truncate">{link.alias}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{link.channel}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{link.campaign || "—"}</TableCell>
                  <TableCell className="max-w-[140px]">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono truncate">{link.short_url}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleCopy(link.short_url, link.id); }}
                      >
                        {copiedId === link.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[140px]">
                    <div className="flex items-center gap-1">
                      <span className="text-xs truncate">{link.destination_url}</span>
                      <a
                        href={link.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      >
                        <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-sm">{link.total_clicks}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(link.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
