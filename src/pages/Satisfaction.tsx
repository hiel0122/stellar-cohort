import { useState, useCallback, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Upload, FileText, RotateCcw, BarChart3, Users, ThumbsUp, Minus, Eye, EyeOff, X, AlertTriangle, Save, Loader2 } from "lucide-react";
import { satisfactionService } from "@/lib/satisfaction";
import type { ParsedCsv, SatisfactionReport } from "@/lib/satisfaction";
import {
  listReports, saveReport, deleteReport, restoreSatReport, restoreFtReport,
  type SavedReport,
} from "@/lib/satisfaction/supabaseService";
import { toast } from "@/hooks/use-toast";
import { SatisfactionScoreChart } from "@/components/satisfaction/ScoreChart";
import { SatisfactionChoiceChart } from "@/components/satisfaction/ChoiceChart";
import { SatisfactionKeywords } from "@/components/satisfaction/Keywords";
import { SatisfactionFreetextList } from "@/components/satisfaction/FreetextList";
import { SavedReportsList } from "@/components/satisfaction/SavedReportsList";
import { usePageState } from "@/hooks/usePageState";
import { useAuth } from "@/components/AuthProvider";

export default function SatisfactionPage() {
  const { user } = useAuth();
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [satReport, setSatReport] = useState<SatisfactionReport | null>(null);
  const [ftReport, setFtReport] = useState<SatisfactionReport | null>(null);
  const [maskPii, setMaskPii] = usePageState("survey", "maskPii", true);
  const [showRawText, setShowRawText] = usePageState("survey", "showRawText", false);
  const [activeFilters, setActiveFilters] = usePageState<Record<number, string[]>>("survey", "activeFilters", {});
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = usePageState("survey", "activeTab", "satisfaction");

  // Saved reports state
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loadedReportId, setLoadedReportId] = useState<string | null>(null);

  // Save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");

  // Fetch saved reports on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setReportsLoading(true);
    listReports()
      .then((r) => { if (!cancelled) setSavedReports(r); })
      .catch((e) => { if (!cancelled) console.warn("Failed to load reports", e); })
      .finally(() => { if (!cancelled) setReportsLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  // Also try local snapshot for backward compatibility
  useEffect(() => {
    const last = satisfactionService.loadLastSnapshot();
    if (last) {
      setParsed(last);
      setSatReport(satisfactionService.buildReport(last, {}, "satisfaction"));
      setFtReport(satisfactionService.buildReport(last, {}, "fieldtrip"));
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "CSV 파일만 업로드 가능합니다.", variant: "destructive" });
      return;
    }
    try {
      const result = await satisfactionService.loadCsv(file);
      setParsed(result);
      setCurrentFile(file);
      setLoadedReportId(null);
      satisfactionService.saveSnapshot(result);
      const newSat = satisfactionService.buildReport(result, {}, "satisfaction");
      const newFt = satisfactionService.buildReport(result, {}, "fieldtrip");
      setSatReport(newSat);
      setFtReport(newFt);
      setActiveFilters({});
      toast({ title: `"${file.name}" 업로드 완료`, description: `${result.rowCount}개 응답 감지` });
    } catch (e: any) {
      toast({ title: "CSV 파싱 실패", description: e.message, variant: "destructive" });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  const generateReport = useCallback(() => {
    if (!parsed) return;
    setSatReport(satisfactionService.buildReport(parsed, activeFilters, "satisfaction"));
    setFtReport(satisfactionService.buildReport(parsed, activeFilters, "fieldtrip"));
  }, [parsed, activeFilters]);

  const handleReset = useCallback(() => {
    setParsed(null);
    setCurrentFile(null);
    setSatReport(null);
    setFtReport(null);
    setActiveFilters({});
    setLoadedReportId(null);
    satisfactionService.clearSnapshot();
  }, []);

  const handleFilterChange = useCallback((colIdx: number, value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (value === "__all__") { delete next[colIdx]; } else { next[colIdx] = [value]; }
      return next;
    });
  }, []);

  // Re-generate reports when filters change
  useEffect(() => {
    if (parsed && satReport && !loadedReportId) {
      setSatReport(satisfactionService.buildReport(parsed, activeFilters, "satisfaction"));
      setFtReport(satisfactionService.buildReport(parsed, activeFilters, "fieldtrip"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters]);

  // Save to server
  const handleSaveToServer = useCallback(async () => {
    if (!user || !currentFile || !parsed || !satReport) return;
    setSaving(true);
    try {
      const saved = await saveReport(user.id, currentFile, parsed, satReport, ftReport ?? null, saveTitle || currentFile.name);
      setSavedReports((prev) => [saved, ...prev]);
      setLoadedReportId(saved.id);
      setShowSaveDialog(false);
      setSaveTitle("");
      toast({ title: "리포트가 저장되었습니다." });
    } catch (e: any) {
      toast({ title: "저장 실패", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [user, currentFile, parsed, satReport, ftReport, saveTitle]);

  // Load from saved
  const handleLoadReport = useCallback((report: SavedReport) => {
    const sat = restoreSatReport(report);
    const ft = restoreFtReport(report);
    setSatReport(sat);
    setFtReport(ft);
    setLoadedReportId(report.id);
    setParsed(null);
    setCurrentFile(null);
    setActiveFilters({});
    toast({ title: `"${report.title || report.file_name}" 리포트를 불러왔습니다.` });
  }, []);

  // Delete
  const handleDeleteReport = useCallback(async (report: SavedReport) => {
    setDeleting(report.id);
    try {
      await deleteReport(report);
      setSavedReports((prev) => prev.filter((r) => r.id !== report.id));
      if (loadedReportId === report.id) {
        setSatReport(null);
        setFtReport(null);
        setLoadedReportId(null);
      }
      toast({ title: "리포트가 삭제되었습니다." });
    } catch (e: any) {
      toast({ title: "삭제 실패", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  }, [loadedReportId]);

  const currentReport = activeTab === "satisfaction" ? satReport : ftReport;
  const hasFieldtrip = parsed?.columns.some((c) => c.group === "fieldtrip")
    ?? (satReport && (satReport as any)?.questions?.fieldtrip !== undefined)
    ?? false;
  const canSave = !!user && !!currentFile && !!parsed && !!satReport && !loadedReportId;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">만족도 분석</h1>
          <p className="text-sm text-muted-foreground mt-1">CSV 업로드 기반 만족도 리포트</p>
        </div>

        {/* Upload & Controls */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <label
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                CSV 파일을 드래그하거나 클릭하여 업로드
              </span>
              <input type="file" accept=".csv" className="hidden" onChange={handleInputChange} />
            </label>

            {parsed && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{parsed.fileName}</span>
                  <Badge variant="secondary" className="text-xs">{parsed.rowCount}개 응답</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(parsed.uploadedAt).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  {canSave && (
                    <Button size="sm" variant="default" onClick={() => { setSaveTitle(currentFile?.name ?? ""); setShowSaveDialog(true); }} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" /> 서버에 저장
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={generateReport} className="gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" /> 리포트 생성
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReset} className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> 초기화
                  </Button>
                </div>
              </div>
            )}

            {loadedReportId && !parsed && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>저장된 리포트를 보고 있습니다.</span>
                <Button size="sm" variant="outline" onClick={handleReset} className="gap-1.5 ml-auto">
                  <RotateCcw className="h-3.5 w-3.5" /> 초기화
                </Button>
              </div>
            )}

            {(parsed || loadedReportId) && (
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch checked={maskPii} onCheckedChange={setMaskPii} id="pii-toggle" />
                  <label htmlFor="pii-toggle" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                    {maskPii ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    개인정보 마스킹 {maskPii ? "(ON)" : "(OFF)"}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={showRawText} onCheckedChange={setShowRawText} id="raw-toggle" />
                  <label htmlFor="raw-toggle" className="text-xs text-muted-foreground cursor-pointer">
                    원문 보기 (PII 제외)
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Reports List */}
        {user && (
          <SavedReportsList
            reports={savedReports}
            loading={reportsLoading}
            onLoad={handleLoadReport}
            onDelete={handleDeleteReport}
            deleting={deleting}
          />
        )}

        {/* Missing questions warning */}
        {parsed?.missingAllowlistQuestions && parsed.missingAllowlistQuestions.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>강의 만족도 문항 누락: {parsed.missingAllowlistQuestions.length}개</AlertTitle>
            <AlertDescription>
              <p className="text-xs mb-2">아래 문항이 CSV에서 감지되지 않았습니다. 헤더를 확인해주세요.</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                {parsed.missingAllowlistQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs + Report */}
        {satReport && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="satisfaction">강의 만족도</TabsTrigger>
              {hasFieldtrip && <TabsTrigger value="fieldtrip">견학 수요</TabsTrigger>}
            </TabsList>

            {/* Filters (only for live parsed data) */}
            {currentReport && currentReport.filters.length > 0 && parsed && (
              <Card className="mt-4">
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground">필터:</span>
                    {currentReport.filters.map((f) => (
                      <Select
                        key={f.columnIndex}
                        value={activeFilters[f.columnIndex]?.[0] ?? "__all__"}
                        onValueChange={(v) => handleFilterChange(f.columnIndex, v)}
                      >
                        <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
                          <SelectValue placeholder={f.header} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">전체 ({f.header})</SelectItem>
                          {f.values.map((v) => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ))}
                    {Object.keys(activeFilters).length > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setActiveFilters({})}>
                        <X className="h-3 w-3" /> 초기화
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <TabsContent value="satisfaction">
              <ReportView report={satReport} parsed={parsed} showRawText={showRawText} maskPii={maskPii} />
            </TabsContent>

            {hasFieldtrip && (
              <TabsContent value="fieldtrip">
                {ftReport && (ftReport.questions.length > 0 || ftReport.freetexts.length > 0 || ftReport.choices.length > 0) ? (
                  <ReportView report={ftReport} parsed={parsed} showRawText={showRawText} maskPii={maskPii} />
                ) : (
                  <Card className="mt-4">
                    <CardContent className="pt-6 pb-6 text-center text-sm text-muted-foreground">
                      견학 수요 관련 문항이 감지되지 않았습니다.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Save Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>리포트 저장</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">리포트 제목</label>
                <Input
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="예: [N잡연구소x보부상] 5기 만족도"
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                CSV 파일과 분석 결과가 서버에 저장됩니다. 다른 기기에서도 불러올 수 있습니다.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>취소</Button>
              <Button onClick={handleSaveToServer} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

// ── Report View (shared between tabs) ──
function ReportView({
  report, parsed, showRawText, maskPii,
}: {
  report: SatisfactionReport;
  parsed: ParsedCsv | null;
  showRawText: boolean;
  maskPii: boolean;
}) {
  return (
    <div className="space-y-6 mt-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={<Users className="h-4 w-4" />} label="총 응답 수" value={`${report.totalResponses.toLocaleString()}명`} />
        <SummaryCard icon={<BarChart3 className="h-4 w-4" />} label="전체 평균" value={report.overallMean !== null ? `${report.overallMean}점` : "—"} />
        <SummaryCard icon={<ThumbsUp className="h-4 w-4 text-emerald-500" />} label="긍정 비율" value={report.positiveRate !== null ? `${report.positiveRate}%` : "—"} sub={report.negativeRate !== null ? `부정 ${report.negativeRate}%` : undefined} />
        <SummaryCard icon={<Minus className="h-4 w-4 text-amber-500" />} label="보통 비율" value={report.neutralRate !== null ? `${report.neutralRate}%` : "—"} />
      </div>

      {/* Choice Analysis */}
      {report.choices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            선택형 문항
            <Badge variant="outline" className="text-[10px]">{report.choices.length}개 문항</Badge>
          </h2>
          <div className="grid gap-3">
            {report.choices.map((ch) => (
              <Card key={ch.columnIndex}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">
                    {ch.header}
                    <span className="text-xs text-muted-foreground font-normal ml-2">({ch.totalResponses}개 응답)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <SatisfactionChoiceChart analysis={ch} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Score Question Analysis */}
      {report.questions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            점수형 문항 분석
            <Badge variant="outline" className="text-[10px]">{report.questions.length}개 문항</Badge>
          </h2>
          <div className="grid gap-3">
            {report.questions.map((q) => (
              <Card key={q.columnIndex}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">{q.header}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
                    <span>평균 <strong>{q.mean}</strong></span>
                    <span>중앙값 <strong>{q.median}</strong></span>
                    <span className="text-emerald-600 dark:text-emerald-400">긍정 {q.positiveRate}%</span>
                    <span className="text-rose-600 dark:text-rose-400">부정 {q.negativeRate}%</span>
                    <span className="text-muted-foreground text-xs">({q.validCount}명 응답)</span>
                  </div>
                  <SatisfactionScoreChart distribution={q.distribution} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Freetext Analysis */}
      {report.freetexts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            자유응답 분석
            <Badge variant="outline" className="text-[10px]">{report.freetexts.length}개 문항</Badge>
          </h2>
          <div className="grid gap-3">
            {report.freetexts.map((ft) => (
              <Card key={ft.columnIndex}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">
                    {ft.header}
                    <span className="text-xs text-muted-foreground font-normal ml-2">({ft.totalResponses}개 응답)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {ft.topKeywords.length > 0 && <SatisfactionKeywords keywords={ft.topKeywords} />}
                  {showRawText && parsed && (
                    <SatisfactionFreetextList
                      rows={parsed.rows}
                      columnIndex={ft.columnIndex}
                      maskPii={maskPii}
                      piiColumns={parsed.columns.filter((c) => c.isPii)}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {report.questions.length === 0 && report.freetexts.length === 0 && report.choices.length === 0 && (
        <Card>
          <CardContent className="pt-6 pb-6 text-center text-sm text-muted-foreground">
            해당 그룹에 분석 가능한 문항이 없습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Summary Card ──
function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
