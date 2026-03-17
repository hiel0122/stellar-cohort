// ── Satisfaction Analysis Domain Types ──
// Completely isolated from revenue dashboard types

export type ColumnKind = "pii" | "score" | "choice" | "freetext" | "meta" | "unknown";

/** Which logical group a column belongs to */
export type ColumnGroup = "satisfaction" | "fieldtrip" | "pii" | "meta" | "unknown";

export interface ColumnClassification {
  header: string;
  index: number;
  kind: ColumnKind;
  /** For score columns: min/max detected range */
  scoreRange?: { min: number; max: number };
  /** Whether this column is a PII candidate */
  isPii: boolean;
  /** Logical group for tab-based separation */
  group: ColumnGroup;
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  columns: ColumnClassification[];
  rowCount: number;
  fileName: string;
  uploadedAt: string;
  /** Allowlist questions not found in CSV headers */
  missingAllowlistQuestions?: string[];
}

export interface ScoreDistribution {
  value: number;
  count: number;
  percentage: number;
}

export interface QuestionAnalysis {
  header: string;
  columnIndex: number;
  mean: number;
  median: number;
  distribution: ScoreDistribution[];
  positiveRate: number;
  negativeRate: number;
  neutralRate: number;
  validCount: number;
}

export interface ChoiceAnalysis {
  header: string;
  columnIndex: number;
  totalResponses: number;
  distribution: { value: string; count: number; percentage: number }[];
}

export interface FreetextAnalysis {
  header: string;
  columnIndex: number;
  totalResponses: number;
  topKeywords: { word: string; count: number }[];
}

export interface SatisfactionReport {
  totalResponses: number;
  overallMean: number | null;
  positiveRate: number | null;
  neutralRate: number | null;
  negativeRate: number | null;
  questions: QuestionAnalysis[];
  choices: ChoiceAnalysis[];
  freetexts: FreetextAnalysis[];
  /** Unique values for filterable columns (choice type outside satisfaction group) */
  filters: { header: string; columnIndex: number; values: string[] }[];
}

// ── Service interface (for future Supabase swap) ──

export interface SatisfactionDataService {
  loadCsv(file: File): Promise<ParsedCsv>;
  buildReport(parsed: ParsedCsv, activeFilters?: Record<number, string[]>, group?: ColumnGroup): SatisfactionReport;
  saveSnapshot(parsed: ParsedCsv): void;
  loadLastSnapshot(): ParsedCsv | null;
  clearSnapshot(): void;
}

// Future DB tables (design reference only)
// satisfaction_sources (id, sheet_name, cohort, created_by, mode, created_at)
// satisfaction_snapshots (id, source_id, raw_json, cleaned_json, created_at)
// satisfaction_reports (id, snapshot_id, aggregates_json, created_at)
// satisfaction_pii (id, snapshot_id, pii_json, created_at) — RLS admin only
