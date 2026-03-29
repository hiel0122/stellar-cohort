import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FolderOpen, Trash2, Search, Loader2, FileText } from "lucide-react";
import type { SavedReport } from "@/lib/satisfaction/supabaseService";
import { useAuth } from "@/components/AuthProvider";

interface Props {
  reports: SavedReport[];
  loading: boolean;
  onLoad: (report: SavedReport) => void;
  onDelete: (report: SavedReport) => void;
  deleting: string | null;
}

export function SavedReportsList({ reports, loading, onLoad, onDelete, deleting }: Props) {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SavedReport | null>(null);
  const { role } = useAuth();

  const filtered = reports.filter(
    (r) =>
      (r.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.file_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              저장된 리포트
              <Badge variant="secondary" className="text-[10px]">{reports.length}</Badge>
            </CardTitle>
            {reports.length > 0 && (
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-7 text-xs"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {reports.length === 0 ? "저장된 리포트가 없습니다." : "검색 결과가 없습니다."}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title || r.file_name || "제목 없음"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{r.row_count ?? 0}개 응답</span>
                      <span>·</span>
                      <span>{new Date(r.created_at).toLocaleDateString("ko-KR")}</span>
                      {r.file_name && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[120px]">{r.file_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onLoad(r)}>
                      <FolderOpen className="h-3 w-3" /> 불러오기
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(r)}
                      disabled={deleting === r.id}
                    >
                      {deleting === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>리포트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title || deleteTarget?.file_name}" 리포트를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
