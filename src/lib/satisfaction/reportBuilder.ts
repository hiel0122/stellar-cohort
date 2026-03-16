import type {
  ParsedCsv,
  SatisfactionReport,
  QuestionAnalysis,
  FreetextAnalysis,
  ScoreDistribution,
  ColumnGroup,
} from "./types";
import { parseScoreValue } from "./csvParser";

// ── Korean stop words for keyword extraction ──
const STOP_WORDS = new Set([
  "있", "없", "것", "수", "등", "더", "좀", "잘", "매우", "정말", "너무",
  "그", "이", "저", "및", "또", "나", "를", "을", "의", "에", "가", "은",
  "는", "로", "와", "과", "도", "에서", "으로", "하", "된", "할", "한",
  "합니다", "입니다", "있습니다", "없습니다", "같", "다",
  "the", "a", "an", "is", "are", "was", "were", "be", "and", "or", "to",
  "of", "in", "for", "on", "it", "that", "this", "with",
]);

function extractKeywords(texts: string[]): { word: string; count: number }[] {
  const freq = new Map<string, number>();

  for (const text of texts) {
    // Simple tokenization: split by whitespace and punctuation
    const tokens = text
      .replace(/[.,!?;:""''()\[\]{}\/\\<>~@#$%^&*+=|`]/g, " ")
      .split(/\s+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

    const seen = new Set<string>();
    for (const token of tokens) {
      if (!seen.has(token)) {
        seen.add(token);
        freq.set(token, (freq.get(token) || 0) + 1);
      }
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
}

function analyzeScoreColumn(
  header: string,
  columnIndex: number,
  rows: string[][],
  maxScore: number
): QuestionAnalysis {
  const values: number[] = [];
  for (const row of rows) {
    const v = parseScoreValue(row[columnIndex] ?? "");
    if (v !== null) values.push(v);
  }

  if (values.length === 0) {
    return {
      header,
      columnIndex,
      mean: 0,
      median: 0,
      distribution: [],
      positiveRate: 0,
      negativeRate: 0,
      neutralRate: 0,
      validCount: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  // Distribution
  const countMap = new Map<number, number>();
  for (const v of values) countMap.set(v, (countMap.get(v) || 0) + 1);
  const distribution: ScoreDistribution[] = [];
  for (let i = 1; i <= maxScore; i++) {
    const count = countMap.get(i) || 0;
    distribution.push({ value: i, count, percentage: (count / values.length) * 100 });
  }

  // Sentiment thresholds based on scale
  let positiveThreshold: number, negativeThreshold: number;
  if (maxScore <= 5) {
    positiveThreshold = 4;
    negativeThreshold = 2;
  } else {
    positiveThreshold = Math.ceil(maxScore * 0.7);
    negativeThreshold = Math.floor(maxScore * 0.3);
  }

  const positive = values.filter((v) => v >= positiveThreshold).length;
  const negative = values.filter((v) => v <= negativeThreshold).length;
  const neutral = values.length - positive - negative;

  return {
    header,
    columnIndex,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    distribution,
    positiveRate: Math.round((positive / values.length) * 1000) / 10,
    negativeRate: Math.round((negative / values.length) * 1000) / 10,
    neutralRate: Math.round((neutral / values.length) * 1000) / 10,
    validCount: values.length,
  };
}

function analyzeFreetextColumn(
  header: string,
  columnIndex: number,
  rows: string[][]
): FreetextAnalysis {
  const texts = rows
    .map((r) => (r[columnIndex] ?? "").trim())
    .filter(Boolean);

  return {
    header,
    columnIndex,
    totalResponses: texts.length,
    topKeywords: extractKeywords(texts),
  };
}

export function buildReport(
  parsed: ParsedCsv,
  activeFilters?: Record<number, string[]>,
  group?: ColumnGroup
): SatisfactionReport {
  // Apply filters
  let filteredRows = parsed.rows;
  if (activeFilters) {
    for (const [colIdx, allowedValues] of Object.entries(activeFilters)) {
      const idx = Number(colIdx);
      if (allowedValues.length > 0) {
        filteredRows = filteredRows.filter((row) =>
          allowedValues.includes((row[idx] ?? "").trim())
        );
      }
    }
  }

  // Score columns analysis
  const scoreColumns = parsed.columns.filter((c) => c.kind === "score");
  const questions = scoreColumns.map((col) =>
    analyzeScoreColumn(
      col.header,
      col.index,
      filteredRows,
      col.scoreRange?.max ?? 5
    )
  );

  // Freetext columns analysis
  const freetextColumns = parsed.columns.filter((c) => c.kind === "freetext");
  const freetexts = freetextColumns.map((col) =>
    analyzeFreetextColumn(col.header, col.index, filteredRows)
  );

  // Filter options
  const choiceColumns = parsed.columns.filter((c) => c.kind === "choice");
  const filters = choiceColumns.map((col) => {
    const values = [
      ...new Set(
        parsed.rows
          .map((r) => (r[col.index] ?? "").trim())
          .filter(Boolean)
      ),
    ].sort();
    return { header: col.header, columnIndex: col.index, values };
  });

  // Overall stats
  const validQuestions = questions.filter((q) => q.validCount > 0);
  const overallMean =
    validQuestions.length > 0
      ? Math.round(
          (validQuestions.reduce((s, q) => s + q.mean, 0) / validQuestions.length) * 100
        ) / 100
      : null;

  const totalValid = validQuestions.reduce((s, q) => s + q.validCount, 0);
  const totalPositive = validQuestions.reduce(
    (s, q) => s + Math.round((q.positiveRate / 100) * q.validCount),
    0
  );
  const totalNegative = validQuestions.reduce(
    (s, q) => s + Math.round((q.negativeRate / 100) * q.validCount),
    0
  );
  const totalNeutral = totalValid - totalPositive - totalNegative;

  return {
    totalResponses: filteredRows.length,
    overallMean,
    positiveRate: totalValid > 0 ? Math.round((totalPositive / totalValid) * 1000) / 10 : null,
    neutralRate: totalValid > 0 ? Math.round((totalNeutral / totalValid) * 1000) / 10 : null,
    negativeRate: totalValid > 0 ? Math.round((totalNegative / totalValid) * 1000) / 10 : null,
    questions,
    freetexts,
    filters,
  };
}
