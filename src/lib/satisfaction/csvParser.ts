import type { ParsedCsv, ColumnClassification, ColumnKind } from "./types";

// ── PII keyword detection (Korean + English) ──
const PII_KEYWORDS = [
  "이름", "성함", "성명", "name",
  "전화", "휴대폰", "핸드폰", "연락처", "phone", "mobile", "tel",
  "이메일", "email", "e-mail", "메일",
  "주소", "address",
  "주민", "생년월일", "birth",
];

function isPiiHeader(header: string): boolean {
  const lower = header.toLowerCase();
  return PII_KEYWORDS.some((kw) => lower.includes(kw));
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

// ── Column classification ──
function classifyColumn(header: string, index: number, rows: string[][]): ColumnClassification {
  if (isPiiHeader(header)) {
    return { header, index, kind: "pii", isPii: true };
  }

  const values = rows.map((r) => r[index]?.trim() ?? "").filter(Boolean);
  if (values.length === 0) {
    return { header, index, kind: "unknown", isPii: false };
  }

  // Try score detection
  const parsed = values.map(parseScoreValue);
  const validScores = parsed.filter((v): v is number => v !== null);
  const scoreRatio = validScores.length / values.length;

  if (scoreRatio >= 0.6 && validScores.length >= 3) {
    const min = Math.min(...validScores);
    const max = Math.max(...validScores);
    if (max <= 10) {
      return { header, index, kind: "score", isPii: false, scoreRange: { min, max } };
    }
  }

  // Choice detection: limited unique values
  const unique = new Set(values);
  if (unique.size <= 15 && unique.size < values.length * 0.5) {
    return { header, index, kind: "choice", isPii: false };
  }

  // Free text: longer strings with high diversity
  const avgLen = values.reduce((s, v) => s + v.length, 0) / values.length;
  if (avgLen > 10 && unique.size > values.length * 0.5) {
    return { header, index, kind: "freetext", isPii: false };
  }

  return { header, index, kind: "unknown", isPii: false };
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

  const columns = headers.map((h, i) => classifyColumn(h, i, normalized));

  return {
    headers,
    rows: normalized,
    columns,
    rowCount: normalized.length,
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
  };
}
