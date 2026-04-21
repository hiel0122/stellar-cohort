import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { SectionCard } from "@/components/seminar/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useScreeningStore } from "@/lib/screening/store";
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function SeminarDbPage() {
  const { projects, activeProjectId, setActiveProjectId } = useScreeningStore();
  const active = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  const [errorOnly, setErrorOnly] = useState(false);
  const [saveMode, setSaveMode] = useState<"overwrite" | "append">("append");

  const preview = useMemo(() => active?.applicants.slice(0, 10) ?? [], [active]);
  const rows = errorOnly ? preview.filter((a) => !a.email.includes("@")) : preview;

  const validation = useMemo(() => {
    const total = active?.applicants.length ?? 0;
    const invalidEmail = active?.applicants.filter((a) => !a.email.includes("@")).length ?? 0;
    const invalidPhone = active?.applicants.filter((a) => !/^\d{2,4}-\d{3,4}-\d{4}$/.test(a.phone)).length ?? 0;
    return { total, invalidEmail, invalidPhone, missing: 0, dupes: 0 };
  }, [active]);

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">DB 관리</h1>
          <p className="text-sm text-muted-foreground">지원 데이터를 업로드하고 검증/저장합니다.</p>
        </header>

        {/* Top: project select + upload */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard title="프로젝트" className="xl:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={active?.id} onValueChange={setActiveProjectId}>
                <SelectTrigger className="w-64 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => toast.success("샘플 양식 다운로드(더미)")}>
                <Download className="h-3.5 w-3.5 mr-1" /> 샘플 양식
              </Button>
              <div
                className="ml-auto flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-sm text-muted-foreground cursor-pointer hover:bg-primary/10 transition"
                onClick={() => toast.success("업로드 완료(더미) — 12행 추가됨")}
              >
                <Upload className="h-4 w-4 text-primary" />
                <span>xlsx/csv 파일을 끌어오거나 클릭</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="최근 업로드 이력">
            <ul className="space-y-2 max-h-48 overflow-auto">
              {active?.uploads.length === 0 && <li className="text-sm text-muted-foreground">업로드 이력 없음</li>}
              {active?.uploads.map((u) => (
                <li key={u.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{u.filename}</span>
                  </div>
                  <span className="text-muted-foreground shrink-0 ml-2">{u.rows}행 · {u.uploadedAt}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        {/* Validation */}
        <SectionCard title="검증 결과" actions={
          <div className="flex items-center gap-2">
            <Switch id="error-only" checked={errorOnly} onCheckedChange={setErrorOnly} />
            <Label htmlFor="error-only" className="text-xs">오류 행만 보기</Label>
          </div>
        }>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <ValBadge ok={validation.missing === 0} label="필수 컬럼 누락" count={validation.missing} />
            <ValBadge ok={validation.invalidEmail === 0} label="이메일 형식 오류" count={validation.invalidEmail} />
            <ValBadge ok={validation.invalidPhone === 0} label="전화 형식 오류" count={validation.invalidPhone} />
            <ValBadge ok label="중복 응답" count={validation.dupes} />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>응답 ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>브랜드</TableHead>
                  <TableHead>연령대</TableHead>
                  <TableHead>매출</TableHead>
                  <TableHead>예산</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-[11px]">{a.id}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell className={!a.email.includes("@") ? "text-destructive" : ""}>{a.email}</TableCell>
                    <TableCell>{a.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{a.brand}</TableCell>
                    <TableCell>{a.ageGroup}</TableCell>
                    <TableCell>{a.revenueBand}</TableCell>
                    <TableCell>{a.budgetBand}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground text-sm py-8">데이터 없음</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        {/* Bottom save */}
        <SectionCard title="저장">
          <div className="flex flex-wrap items-center gap-6">
            <RadioGroup value={saveMode} onValueChange={(v) => setSaveMode(v as any)} className="flex items-center gap-4">
              <div className="flex items-center gap-2"><RadioGroupItem value="append" id="r-append" /><Label htmlFor="r-append" className="text-sm">추가 저장</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="overwrite" id="r-over" /><Label htmlFor="r-over" className="text-sm">덮어쓰기</Label></div>
            </RadioGroup>
            <Button onClick={() => toast.success(`저장 완료(더미) · ${saveMode === "append" ? "추가" : "덮어쓰기"} · ${preview.length}행`)}>저장</Button>
          </div>
        </SectionCard>

        {/* Log */}
        <SectionCard title="업로드 로그">
          <ul className="space-y-2 text-xs">
            {(active?.uploads ?? []).map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{u.uploadedAt}</span>
                <span>·</span>
                <span>{u.uploader}</span>
                <span>·</span>
                <span>{u.filename} ({u.rows}행)</span>
              </li>
            ))}
            {(active?.uploads ?? []).length === 0 && <li className="text-muted-foreground">로그 없음</li>}
          </ul>
        </SectionCard>
      </div>
    </Layout>
  );
}

function ValBadge({ ok, label, count }: { ok: boolean; label: string; count: number }) {
  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
      <span className="text-xs">{label}</span>
      <Badge variant="outline" className="ml-auto text-[10px]">{count}</Badge>
    </div>
  );
}
