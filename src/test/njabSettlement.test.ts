import { describe, it, expect } from "vitest";
import { recalc, type NjabDetails } from "@/components/NjabSettlementForm";

function makeInput(overrides: Partial<NjabDetails> = {}): NjabDetails {
  return {
    total_sales: 0,
    card_sales: 0,
    bank_sales: 0,
    card_fee_rate_pct: 7.5,
    bank_fee_rate_pct: 0,
    fee_amount: 0,
    net_after_fee: 0,
    owned_media_sales: 0,
    owned_ratio: 0,
    paid_ratio: 1,
    owned_sales: 0,
    paid_sales: 0,
    instructor_rate_pct: 50,
    rs_exclusion_pct: 20,
    rs_factor: 0.8,
    owned_part_settlement: 0,
    paid_part_settlement: 0,
    total_settlement_amount: 0,
    ad_cost_amount: 0,
    final_payout_amount: 0,
    supply_amount: 0,
    vat_amount: 0,
    note: "",
    manual_total_sales: false,
    ...overrides,
  };
}

describe("N잡연구소 정산 계산 (BigInt precision)", () => {
  it("matches the reference settlement sheet exactly", () => {
    const input = makeInput({
      total_sales: 111_410_000,
      card_sales: 92_100_000,
      bank_sales: 19_310_000,
      card_fee_rate_pct: 7.5,
      bank_fee_rate_pct: 0,
      owned_media_sales: 44_110_000,
      rs_exclusion_pct: 20,
      instructor_rate_pct: 50,
      ad_cost_amount: 27_743_145,
    });

    const r = recalc(input);

    expect(r.fee_amount).toBe(6_907_500);
    expect(r.net_after_fee).toBe(104_502_500);
    expect(r.owned_part_settlement).toBe(16_550_059);
    expect(r.paid_part_settlement).toBe(31_563_676);
    expect(r.total_settlement_amount).toBe(48_113_735);
    expect(r.final_payout_amount).toBe(20_370_590);
    expect(r.supply_amount).toBe(18_518_718);
    expect(r.vat_amount).toBe(1_851_872);
  });

  it("handles zero total_sales gracefully", () => {
    const r = recalc(makeInput({ total_sales: 0 }));
    expect(r.fee_amount).toBe(0);
    expect(r.final_payout_amount).toBe(0);
  });
});
