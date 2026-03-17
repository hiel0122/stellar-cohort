import type { ParsedCsv, ColumnClassification, ColumnKind, ColumnGroup } from "./types";
import { normalizeHeader, matchAllowlist, SATISFACTION_ALLOWLIST } from "./allowlist";

// ── PII keyword detection (Korean + English) ──
const PII_KEYWORDS = [
  "이름", "성함", "성명", "name",
  "전화", "휴대폰", "핸드폰", "연락처", "phone", "mobile", "tel",
  "이메일", "email", "e-mail", "메일",
  "주소", "address",
  "주민", "생년월일", "birth",
  "대표자", "사업자등록번호", "사업자명", "마케팅 활용 동의",
];

// ── Fieldtrip (견학 수요) keywords ──
const FIELDTRIP_KEYWORDS = [
  "오전 / 오후", "오전/오후", "견학", "공장", "견학 안내", "견학 수요",
];

// ── Meta / description columns to exclude from analysis ──
const META_KEYWORDS = [
  "작성해주신", "안내", "설명", "timestamp", "타임스탬프",
];

function isPiiHeader(header: string): boolean {
  const lower = header.toLowerCase();
  return PII_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function isFieldtripHeader(header: string): boolean {
  const lower = header.toLowerCase();
  return FIELDTRIP_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function isMetaHeader(header: string): boolean {
  const lower = header.toLowerCase();
  return META_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

// ── Score parsing: "4(긍정)" → 4, "5 (매우 긍정)" → 5, plain "3" → 3 ──
const SCORE_REGEX = /^(\d+)\s*(?:\(.*\))?$/;

export function parseScoreValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const m = trimmed.match(SCORE_REGEX);
  if (m) return parseInt(m[1], 10);
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

// ── Column classification (with allowlist override) ──
function classifyColumn(
  header: string,
  index: number,
  rows: string[][],
  allowlistMatch: ReturnType<typeof matchAllowlist>[number] | undefined
): ColumnClassification {
  // If allowlist matched → force satisfaction group
  if (allowlistMatch) {
    // Determine kind by inspecting values
    const kind = detectKind(header, index, rows);
    return {
      header,
      index,
      kind,
      isPii: false,
      group: "satisfaction",
      scoreRange: kind === "score" ? detectScoreRange(index, rows) : undefined,
    };
  }

  // PII check
  if (isPiiHeader(header)) {
    return { header, index, kind: "pii", isPii: true, group: "pii" };
  }

  // Fieldtrip check
  if (isFieldtripHeader(header)) {
    const kind = detectKind(header, index, rows);
    return { header, index, kind, isPii: false, group: "fieldtrip" };
  }

  // Meta check
  if (isMetaHeader(header)) {
    return { header, index, kind: "meta", isPii: false, group: "meta" };
  }

  // Auto-detect kind
  const kind = detectKind(header, index, rows);

  // Numbered questions → satisfaction
  if (/^\d+\./.test(header.trim())) {
    return {
      header, index, kind, isPii: false, group: "satisfaction",
      scoreRange: kind === "score" ? detectScoreRange(index, rows) : undefined,
    };
  }

  // Score/freetext → satisfaction by default
  if (kind === "score" || kind === "freetext") {
    return {
      header, index, kind, isPii: false, group: "satisfaction",
      scoreRange: kind === "score" ? detectScoreRange(index, rows) : undefined,
    };
  }

  return { header, index, kind, isPii: false, group: "unknown" };
}

function detectKind(header: string, index: number, rows: string[][]): ColumnKind {
  const values = rows.map((r) => r[index]?.trim() ?? "").filter(Boolean);
  if (values.length === 0) return "unknown";

  // Try score detection
  const parsed = values.map(parseScoreValue);
  const validScores = parsed.filter((v): v is number => v !== null);
  const scoreRatio = validScores.length / values.length;

  if (scoreRatio >= 0.6 && validScores.length >= 3) {
    const max = Math.max(...validScores);
    if (max <= 10) return "score";
  }

  // Choice detection
  const unique = new Set(values);
  if (unique.size <= 15 && unique.size < values.length * 0.5) {
    return "choice";
  }

  // Free text
  const avgLen = values.reduce((s, v) => s + v.length, 0) / values.length;
  if (avgLen > 10 && unique.size > values.length * 0.5) {
    return "freetext";
  }

  return "unknown";
}

function detectScoreRange(index: number, rows: string[][]): { min: number; max: number } | undefined {
  const values = rows.map((r) => parseScoreValue(r[index] ?? "")).filter((v): v is number => v !== null);
  if (values.length === 0) return undefined;
  return { min: Math.min(...values), max: Math.max(...values) };
}

// ── CSV text parsing (handles quoted fields) ──
function parseCsvText(text: string): string[][] {
  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        current.push(field);
        field = "";
        if (current.some((c) => c.trim())) lines.push(current);
        current = [];
      } else {
        field += ch;
      }
    }
  }
  current.push(field);
  if (current.some((c) => c.trim())) lines.push(current);

  return lines;
}

// ── Main parse function ──
export async function parseCsvFile(file: File): Promise<ParsedCsv> {
  const text = await file.text();
  const allRows = parseCsvText(text);

  if (allRows.length < 2) {
    throw new Error("CSV에 헤더와 최소 1개 데이터 행이 필요합니다.");
  }

  const headers = allRows[0].map((h) => h.trim());
  const dataRows = allRows.slice(1);

  // Normalize row lengths to header count
  const normalized = dataRows.map((row) => {
    const r = [...row];
    while (r.length < headers.length) r.push("");
    return r.slice(0, headers.length);
  });

  // Match headers against allowlist
  const allowlistMatches = matchAllowlist(headers);

  const columns = headers.map((h, i) =>
    classifyColumn(h, i, normalized, allowlistMatches[i])
  );

  // Compute missing allowlist items
  const matchedAllowlistIndices = new Set(
    Object.values(allowlistMatches)
      .filter(Boolean)
      .map((m) => m!.allowlistIndex)
  );
  const missingAllowlist = SATISFACTION_ALLOWLIST
    .map((item, idx) => ({ ...item, allowlistIndex: idx }))
    .filter((item) => !matchedAllowlistIndices.has(item.allowlistIndex))
    .map((item) => item.label);

  return {
    headers,
    rows: normalized,
    columns,
    rowCount: normalized.length,
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    missingAllowlistQuestions: missingAllowlist.length > 0 ? missingAllowlist : undefined,
  };
}
