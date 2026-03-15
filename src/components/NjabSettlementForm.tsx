import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWonFull } from "@/lib/format";
import { type PlatformCost, upsertPlatformCost } from "@/lib/platformCostStore";

interface Props {
  costRecord: PlatformCost;
  cohortRevenue: number;
  onSaved?: () => void;
}

function parseNum(v: string): number {
  return Number(v.replace(/[^0-9.-]/g, "")) || 0;
}
function fmtInput(v: number): string {
  return v === 0 ? "" : v.toLocaleString("ko-KR");
}

export interface NjabDetails {
  total_sales: number;
  card_sales: number;
  bank_sales: number;
  card_fee_rate_pct: number;
  bank_fee_rate_pct: number;
  fee_amount: number;
  net_after_fee: number;
  owned_media_sales: number;
  owned_ratio: number;
  paid_ratio: number;
  owned_sales: number;
  paid_sales: number;
  instructor_rate_pct: number;
  rs_exclusion_pct: number;
  rs_factor: number;
  owned_part_settlement: number;
  paid_part_settlement: number;
  total_settlement_amount: number;
  ad_cost_amount: number;
  final_payout_amount: number;
  supply_amount: number;
  vat_amount: number;
  note: string;
  manual_total_sales: boolean;
}

function loadDetails(cost: PlatformCost, cohortRevenue: number): NjabDetails {
  const d = (cost.details ?? {}) as Partial<NjabDetails>;
  return {
    total_sales: d.total_sales ?? cohortRevenue,
    card_sales: d.card_sales ?? 0,
    bank_sales: d.bank_sales ?? 0,
    card_fee_rate_pct: d.card_fee_rate_pct ?? 7.5,
    bank_fee_rate_pct: d.bank_fee_rate_pct ?? 0,
    fee_amount: d.fee_amount ?? 0,
    net_after_fee: d.net_after_fee ?? 0,
    owned_media_sales: d.owned_media_sales ?? 0,
    owned_ratio: d.owned_ratio ?? 0,
    paid_ratio: d.paid_ratio ?? 1,
    owned_sales: d.owned_sales ?? 0,
    paid_sales: d.paid_sales ?? 0,
    instructor_rate_pct: d.instructor_rate_pct ?? 50,
    rs_exclusion_pct: d.rs_exclusion_pct ?? 20,
    rs_factor: d.rs_factor ?? 0.8,
    owned_part_settlement: d.owned_part_settlement ?? 0,
    paid_part_settlement: d.paid_part_settlement ?? 0,
    total_settlement_amount: d.total_settlement_amount ?? 0,
    ad_cost_amount: d.ad_cost_amount ?? cost.ad_cost_amount ?? 0,
    final_payout_amount: d.final_payout_amount ?? 0,
    vat_included_amount: d.vat_included_amount ?? 0,
    note: d.note ?? cost.note ?? "",
    manual_total_sales: d.manual_total_sales ?? false,
  };
}

function recalc(d: NjabDetails): NjabDetails {
  const fee = Math.round(d.card_sales * (d.card_fee_rate_pct / 100) + d.bank_sales * (d.bank_fee_rate_pct / 100));
  const net = d.total_sales - fee;
  const ownedRatio = d.total_sales > 0 ? d.owned_media_sales / d.total_sales : 0;
  const paidRatio = 1 - ownedRatio;
  const ownedSales = Math.round(d.total_sales * ownedRatio);
  const paidSales = d.total_sales - ownedSales;
  const rsFactor = 1 - d.rs_exclusion_pct / 100;
  const instrRate = d.instructor_rate_pct / 100;
  const ownedPart = Math.round(net * ownedRatio * rsFactor * instrRate);
  const paidPart = Math.round(net * paidRatio * instrRate);
  const totalSettlement = ownedPart + paidPart;
  const finalPayout = totalSettlement - d.ad_cost_amount;
  const vatIncluded = Math.round(finalPayout * 1.1);
  return {
    ...d,
    fee_amount: fee,
    net_after_fee: net,
    owned_ratio: ownedRatio,
    paid_ratio: paidRatio,
    owned_sales: ownedSales,
    paid_sales: paidSales,
    rs_factor: rsFactor,
    owned_part_settlement: ownedPart,
    paid_part_settlement: paidPart,
    total_settlement_amount: totalSettlement,
    final_payout_amount: finalPayout,
    vat_included_amount: vatIncluded,
  };
}

export function NjabSettlementForm({ costRecord, cohortRevenue, onSaved }: Props) {
  const [d, setD] = useState<NjabDetails>(() => recalc(loadDetails(costRecord, cohortRevenue)));
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-init when cost record changes
  useEffect(() => {
    setD(recalc(loadDetails(costRecord, cohortRevenue)));
  }, [costRecord.id]);

  // Sync total_sales with cohort revenue when not manual
  useEffect(() => {
    if (!d.manual_total_sales) {
      update({ total_sales: cohortRevenue });
    }
  }, [cohortRevenue]);

  const save = useCallback((updated: NjabDetails) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newCost: PlatformCost = {
        ...costRecord,
        fee_amount: updated.fee_amount,
        ad_cost_amount: updated.ad_cost_amount,
        note: updated.note,
        details: updated as unknown as Record<string, unknown>,
      };
      upsertPlatformCost(newCost);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      onSaved?.();
    }, 400);
  }, [costRecord, onSaved]);

  const update = useCallback((patch: Partial<NjabDetails>) => {
    setD(prev => {
      const merged = { ...prev, ...patch };
      const calculated = recalc(merged);
      save(calculated);
      return calculated;
    });
  }, [save]);

  // Warnings
  const salesMismatch = d.card_sales + d.bank_sales !== d.total_sales && (d.card_sales > 0 || d.bank_sales > 0);
  const ownedExceeds = d.owned_media_sales > d.total_sales && d.total_sales > 0;

  const pctDisplay = (ratio: number) => (ratio * 100).toFixed(2) + "%";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">N잡연구소 정산 (공식)</p>
        {saveStatus === "saved" && <Badge variant="secondary" className="text-[9px] h-5 gap-1"><Check className="h-3 w-3" /> 저장됨</Badge>}
      </div>

      {/* ── 2-1: 매출/수수료 ── */}
      <div className="rounded-md border border-border/60 p-3 space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">① 매출 / 수수료</p>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">총 결제액 (세전, 원)</Label>
            <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
              직접 입력
              <Switch
                checked={d.manual_total_sales}
                onCheckedChange={(v) => update({ manual_total_sales: v, total_sales: v ? d.total_sales : cohortRevenue })}
                className="h-4 w-7 [&>span]:h-3 [&>span]:w-3"
              />
            </label>
          </div>
          <Input
            value={fmtInput(d.total_sales)}
            onChange={(e) => update({ total_sales: parseNum(e.target.value) })}
            readOnly={!d.manual_total_sales}
            className={cn("tabular-nums h-8 text-xs w-full", !d.manual_total_sales && "bg-muted/50")}
            inputMode="numeric"
          />
          {!d.manual_total_sales && <p className="text-[10px] text-muted-foreground">기수 매출에서 자동 주입</p>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">카드 결제액 (원)</Label>
            <Input value={fmtInput(d.card_sales)} onChange={(e) => update({ card_sales: parseNum(e.target.value) })} className="tabular-nums h-8 text-xs w-full" inputMode="numeric" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">계좌이체액 (원)</Label>
            <Input value={fmtInput(d.bank_sales)} onChange={(e) => update({ bank_sales: parseNum(e.target.value) })} className="tabular-nums h-8 text-xs w-full" inputMode="numeric" />
          </div>
        </div>

        {salesMismatch && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
            <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              카드 + 계좌 ({formatWonFull(d.card_sales + d.bank_sales)}) ≠ 총 결제액 ({formatWonFull(d.total_sales)})
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">카드 수수료율 (%)</Label>
            <Input type="number" step="0.1" min="0" max="100" value={d.card_fee_rate_pct} onChange={(e) => update({ card_fee_rate_pct: Number(e.target.value) || 0 })} className="tabular-nums h-8 text-xs w-full" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">계좌 수수료율 (%)</Label>
            <Input type="number" step="0.1" min="0" max="100" value={d.bank_fee_rate_pct} onChange={(e) => update({ bank_fee_rate_pct: Number(e.target.value) || 0 })} className="tabular-nums h-8 text-xs w-full" />
          </div>
        </div>

        <div className="rounded-md bg-muted p-2 space-y-0.5">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">자동 계산</p>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">수수료 금액</span><span className="font-medium tabular-nums">{formatWonFull(d.fee_amount)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">수수료 제외 후 최종금</span><span className="font-medium tabular-nums">{formatWonFull(d.net_after_fee)}</span></div>
        </div>
      </div>

      {/* ── 2-2: 온드미디어 RS ── */}
      <div className="rounded-md border border-border/60 p-3 space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">② 온드미디어 RS 비율</p>

        <div className="space-y-1">
          <Label className="text-xs">온드미디어 매출액 (세전, 원)</Label>
          <Input value={fmtInput(d.owned_media_sales)} onChange={(e) => update({ owned_media_sales: parseNum(e.target.value) })} className="tabular-nums h-8 text-xs w-full" inputMode="numeric" />
        </div>

        {ownedExceeds && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
            <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              온드미디어 매출이 총 결제액을 초과합니다
            </p>
          </div>
        )}

        <div className="rounded-md bg-muted p-2 space-y-0.5">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">자동 계산</p>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">온드 비율</span><span className="font-medium tabular-nums">{pctDisplay(d.owned_ratio)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">페이드 비율</span><span className="font-medium tabular-nums">{pctDisplay(d.paid_ratio)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">온드 매출액</span><span className="font-medium tabular-nums">{formatWonFull(d.owned_sales)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">페이드 매출액</span><span className="font-medium tabular-nums">{formatWonFull(d.paid_sales)}</span></div>
        </div>
      </div>

      {/* ── 2-3: 파트별 정산액 ── */}
      <div className="rounded-md border border-border/60 p-3 space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">③ 파트별 정산액</p>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">강사 요율 (%)</Label>
            <Input type="number" step="1" min="0" max="100" value={d.instructor_rate_pct} onChange={(e) => update({ instructor_rate_pct: Number(e.target.value) || 0 })} className="tabular-nums h-8 text-xs w-full" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">RS 제외율 (%)</Label>
            <Input type="number" step="1" min="0" max="100" value={d.rs_exclusion_pct} onChange={(e) => update({ rs_exclusion_pct: Number(e.target.value) || 0 })} className="tabular-nums h-8 text-xs w-full" />
          </div>
        </div>

        <div className="rounded-md bg-muted p-2 space-y-0.5">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">자동 계산</p>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">온드 파트 정산액</span><span className="font-medium tabular-nums">{formatWonFull(d.owned_part_settlement)}</span></div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-[10px]">= 최종금 × 온드비율 × {d.rs_factor} × {d.instructor_rate_pct}%</span>
          </div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">페이드 파트 정산액</span><span className="font-medium tabular-nums">{formatWonFull(d.paid_part_settlement)}</span></div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-[10px]">= 최종금 × 페이드비율 × {d.instructor_rate_pct}%</span>
          </div>
          <div className="flex justify-between text-xs border-t border-border/50 pt-1 mt-1">
            <span className="text-muted-foreground font-medium">최종 정산액</span>
            <span className="font-semibold tabular-nums">{formatWonFull(d.total_settlement_amount)}</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">※ 실제 정산 시 천~만원 단위의 오차가 발생할 수 있습니다.</p>
      </div>

      {/* ── 2-4: 광고비/최종 지급 ── */}
      <div className="rounded-md border border-border/60 p-3 space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">④ 기타 비용 / 최종 지급</p>

        <div className="space-y-1">
          <Label className="text-xs">광고비 부담 (원)</Label>
          <Input value={fmtInput(d.ad_cost_amount)} onChange={(e) => update({ ad_cost_amount: parseNum(e.target.value) })} className="tabular-nums h-8 text-xs w-full" inputMode="numeric" />
        </div>

        <div className="rounded-md bg-muted p-2 space-y-0.5">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">자동 계산</p>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">차인지급액</span>
            <span className={cn("font-semibold tabular-nums", d.final_payout_amount >= 0 ? "text-foreground" : "text-destructive")}>{formatWonFull(d.final_payout_amount)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">VAT 포함 지급액</span>
            <span className="font-medium tabular-nums">{formatWonFull(d.vat_included_amount)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">※ VAT 포함 지급, 세금계산서 과세 발행</p>
        </div>
      </div>

      {/* ── 메모 ── */}
      <div className="space-y-1">
        <Label className="text-xs">메모</Label>
        <Input value={d.note} onChange={(e) => update({ note: e.target.value })} className="h-8 text-xs w-full" placeholder="(선택)" />
      </div>
    </div>
  );
}
