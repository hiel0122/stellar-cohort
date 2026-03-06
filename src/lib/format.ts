// ── Number formatting utilities (₩ 제거, 만/억/조 단위 텍스트 중심) ──

const koFmt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

/** "293,000,000원" – full precision with '원' suffix */
export function formatWonFull(value: number): string {
  return koFmt.format(value) + "원";
}

/** "293,000,000" – full precision, no suffix (for chart axes) */
export function formatNumberFull(value: number): string {
  return koFmt.format(value);
}

/**
 * Compact: "2.93억", "1.5억", "6,500만" – no ₩, no '원'
 * 소수점 자리수: scale>=100 → 0자리, >=10 → 1자리, else → 2자리, trailing 0 제거
 */
export function formatWonCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  let divisor: number;
  let unit: string;

  if (abs >= 1e12) {
    divisor = 1e12; unit = "조";
  } else if (abs >= 1e8) {
    divisor = 1e8; unit = "억";
  } else if (abs >= 1e4) {
    divisor = 1e4; unit = "만";
  } else {
    return koFmt.format(Math.round(value));
  }

  const scale = abs / divisor;
  let decimals: number;
  if (scale >= 100) decimals = 0;
  else if (scale >= 10) decimals = 1;
  else decimals = 2;

  // Format with fixed decimals then strip trailing zeros
  let formatted = scale.toFixed(decimals);
  if (decimals > 0) {
    formatted = formatted.replace(/\.?0+$/, "");
  }

  return sign + formatted + unit;
}

/** Integer with commas: "2,500" */
export function formatInt(value: number): string {
  return koFmt.format(value);
}

/** Percentage with sign: "+2.3%", "−1.0%", null→"—" */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
