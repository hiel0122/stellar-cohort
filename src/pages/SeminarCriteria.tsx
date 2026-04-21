import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SectionCard } from "@/components/seminar/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScreeningStore } from "@/lib/screening/store";
import { Copy, Lock, Unlock, Play, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BandRow { from: string; to: string; score: number }

const QUANT_TEMPLATE = [
  { key: "revenue", title: "매출액 (20점)", rows: [{ from: "0", to: "1억", score: 5 }, { from: "1억", to: "5억", score: 12 }, { from: "5억", to: "10억", score: 17 }, { from: "10억", to: "∞", score: 20 }] },
  { key: "ownmall", title: "자사몰 (10점)", rows: [{ from: "보유", to: "-", score: 10 }, { from: "없음", to: "-", score: 0 }] },
  { key: "age", title: "나이 (10점)", rows: [{ from: "20대", to: "-", score: 6 }, { from: "30대", to: "-", score: 10 }, { from: "40대", to: "-", score: 8 }, { from: "50대+", to: "-", score: 5 }] },
  { key: "budget", title: "가용예산 (15점)", rows: [{ from: "0", to: "300만", score: 4 }, { from: "300만", to: "500만", score: 8 }, { from: "500만", to: "1000만", score: 12 }, { from: "1000만+", to: "-", score: 15 }] },
];

const QUAL_TEMPLATE = [
  { key: "fit", title: "사업관련성 (12)", rows: [{ from: "매우 적합", to: "-", score: 12 }, { from: "적합", to: "-", score: 8 }, { from: "보통", to: "-", score: 4 }] },
  { key: "will", title: "실행의지 (12)", rows: [{ from: "강함", to: "-", score: 12 }, { from: "보통", to: "-", score: 6 }, { from: "약함", to: "-", score: 2 }] },
  { key: "reason", title: "사유구체성 (11)", rows: [{ from: "구체적 사례", to: "-", score: 11 }, { from: "막연함", to: "-", score: 3 }] },
  { key: "topic", title: "주제적합성 (5)", rows: [{ from: "매우 적합", to: "-", score: 5 }, { from: "보통", to: "-", score: 2 }] },
  { key: "cert", title: "확실성 (5)", rows: [{ from: "높음", to: "-", score: 5 }, { from: "보통", to: "-", score: 3 }, { from: "낮음", to: "-", score: 1 }] },
];

export default function SeminarCriteriaPage() {
  const { projects, activeProjectId, setActiveProjectId, updateProject } = useScreeningStore();
  const active = projects.find((p) => p.id === activeProjectId) ?? projects[0];
  const [selectedVer, setSelectedVer] = useState<string>(active?.criteriaVersions[0]?.id ?? "");
  const version = active?.criteriaVersions.find((v) => v.id === selectedVer) ?? active?.criteriaVersions[0];

  const [quant, setQuant] = useState(QUANT_TEMPLATE);
  const [qual, setQual] = useState(QUAL_TEMPLATE);

  function cloneVersion() {
    if (!active) return;
    const next = {
      id: `cv${active.criteriaVersions.length + 1}`,
      label: `v${active.criteriaVersions.length + 1}`,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      author: "운영팀",
      active: false,
      locked: false,
    };
    updateProject(active.id, { criteriaVersions: [...active.criteriaVersions, next] });
    toast.success(`${next.label} 복제 완료`);
  }

  function toggleLock() {
    if (!active || !version) return;
    updateProject(active.id, {
      criteriaVersions: active.criteriaVersions.map((v) => v.id === version.id ? { ...v, locked: !v.locked } : v),
    });
  }

  function applyToProject() {
    if (!active || !version) return;
    updateProject(active.id, {
      criteriaVersion: version.label,
      criteriaVersions: active.criteriaVersions.map((v) => ({ ...v, active: v.id === version.id })),
    });
    toast.success(`${version.label}을 현재 프로젝트에 적용했습니다`);
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">심사요건 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">정량/정성 항목별 점수 구간을 버전별로 관리합니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={active?.id} onValueChange={setActiveProjectId}>
              <SelectTrigger className="w-56 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={cloneVersion}><Copy className="h-3.5 w-3.5 mr-1" /> 버전 복제</Button>
            <Button variant="outline" size="sm" onClick={toggleLock}>
              {version?.locked ? <><Unlock className="h-3.5 w-3.5 mr-1" /> 잠금 해제</> : <><Lock className="h-3.5 w-3.5 mr-1" /> 잠금</>}
            </Button>
            <Button size="sm" onClick={applyToProject}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> 현재 프로젝트에 적용</Button>
            <Button size="sm" variant="secondary" onClick={() => toast.success("테스트 심사 실행: 5명 평균 62점")}><Play className="h-3.5 w-3.5 mr-1" /> 테스트 심사 실행</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,360px)_1fr] gap-4">
          <SectionCard title="버전 목록">
            <div className="space-y-2">
              {active?.criteriaVersions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVer(v.id)}
                  className={`w-full text-left rounded-md border p-3 transition ${selectedVer === v.id ? "border-primary/40 bg-primary/5" : "hover:bg-accent/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{v.label}</span>
                      {v.active && <Badge className="text-[9px] h-4 bg-primary/10 text-primary border-primary/20">사용중</Badge>}
                      {v.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{v.author}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">생성 {v.createdAt} · 수정 {v.updatedAt}</div>
                </button>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard title="정량 항목 (자동 계산)" description={version?.locked ? "🔒 잠금 상태 — 편집 불가" : undefined}>
              <Accordion type="multiple" defaultValue={[QUANT_TEMPLATE[0].key]}>
                {quant.map((sec, idx) => (
                  <AccordionItem key={sec.key} value={sec.key}>
                    <AccordionTrigger className="text-sm">{sec.title}</AccordionTrigger>
                    <AccordionContent>
                      <BandTable
                        rows={sec.rows}
                        disabled={!!version?.locked}
                        onChange={(rows) => setQuant((q) => q.map((s, i) => i === idx ? { ...s, rows } : s))}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </SectionCard>

            <SectionCard title="정성 항목 (수동 평가, AI 보조 예정)" description={version?.locked ? "🔒 잠금 상태 — 편집 불가" : undefined}>
              <Accordion type="multiple" defaultValue={[QUAL_TEMPLATE[0].key]}>
                {qual.map((sec, idx) => (
                  <AccordionItem key={sec.key} value={sec.key}>
                    <AccordionTrigger className="text-sm">{sec.title}</AccordionTrigger>
                    <AccordionContent>
                      <BandTable
                        rows={sec.rows}
                        disabled={!!version?.locked}
                        onChange={(rows) => setQual((q) => q.map((s, i) => i === idx ? { ...s, rows } : s))}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </SectionCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function BandTable({ rows, onChange, disabled }: { rows: BandRow[]; onChange: (r: BandRow[]) => void; disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>구간(시작)</TableHead>
            <TableHead>구간(끝)</TableHead>
            <TableHead className="w-32">점수</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell><Input value={r.from} disabled={disabled} className="h-8" onChange={(e) => onChange(rows.map((rr, ii) => ii === i ? { ...rr, from: e.target.value } : rr))} /></TableCell>
              <TableCell><Input value={r.to} disabled={disabled} className="h-8" onChange={(e) => onChange(rows.map((rr, ii) => ii === i ? { ...rr, to: e.target.value } : rr))} /></TableCell>
              <TableCell><Input type="number" value={r.score} disabled={disabled} className="h-8 tabular-nums" onChange={(e) => onChange(rows.map((rr, ii) => ii === i ? { ...rr, score: Number(e.target.value) } : rr))} /></TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" disabled={disabled} className="h-7 w-7" onClick={() => onChange(rows.filter((_, ii) => ii !== i))}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button size="sm" variant="outline" disabled={disabled} onClick={() => onChange([...rows, { from: "", to: "", score: 0 }])}>
        <Plus className="h-3 w-3 mr-1" /> 행 추가
      </Button>
    </div>
  );
}
