// ── Number formatting utilities (₩ 제거, 만/억/조 단위 텍스트 중심) ──

const koFmt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

/** "150,000,000원" – full precision with '원' suffix */
export function formatWonFull(value: number): string {
  return koFmt.format(value) + "원";
}

/** Compact: "2.93억", "6,500만", "1.5조" – no ₩, no '원' */
export function formatWonCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + "조";
  if (abs >= 1e8) return sign + (abs / 1e8).toFixed(2) + "억";
  if (abs >= 1e4) return sign + koFmt.format(Math.round(abs / 1e4)) + "만";
  return koFmt.format(value);
}

/** Integer with commas: "2,500" */
export function formatInt(value: number): string {
  return koFmt.format(value);
}

/** Percentage with sign: "+2.3%", "−1.0%", null→"—" */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(1)}%`;
}
