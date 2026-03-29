/**
 * Supabase-backed survey report persistence
 * - save/load/delete reports to survey_reports table
 * - upload/download CSV to survey_uploads storage bucket
 */
import { supabase } from "@/integrations/supabase/client";
import type { ParsedCsv, SatisfactionReport } from "./types";

export interface SavedReport {
  id: string;
  owner_id: string;
  title: string;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  row_count: number | null;
  created_at: string;
  updated_at: string;
  summary: any;
  questions: any;
  meta: any;
  owner_email?: string;
}

/** List all reports visible to current user (own + admin sees all) */
export async function listReports(): Promise<SavedReport[]> {
  const { data, error } = await (supabase as any)
    .from("survey_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SavedReport[];
}

/** Save a new report: upload CSV → insert DB row → update with analysis */
export async function saveReport(
  userId: string,
  file: File,
  parsed: ParsedCsv,
  satReport: SatisfactionReport,
  ftReport: SatisfactionReport | null,
  title: string
): Promise<SavedReport> {
  // 1) Insert minimal row to get ID
  const { data: row, error: insertErr } = await (supabase as any)
    .from("survey_reports")
    .insert({
      owner_id: userId,
      title,
      source_type: "csv",
      file_name: file.name,
      row_count: parsed.rowCount,
    })
    .select("*")
    .single();
  if (insertErr) throw new Error(insertErr.message);

  const reportId = row.id as string;
  const storagePath = `${userId}/${reportId}/${file.name}`;

  // 2) Upload CSV to storage
  const { error: uploadErr } = await supabase.storage
    .from("survey_uploads")
    .upload(storagePath, file, { upsert: false });
  if (uploadErr) {
    // rollback: delete the DB row
    await (supabase as any).from("survey_reports").delete().eq("id", reportId);
    throw new Error(`파일 업로드 실패: ${uploadErr.message}`);
  }

  // 3) Build summary/questions/meta and update
  const summary = {
    totalResponses: satReport.totalResponses,
    overallMean: satReport.overallMean,
    positiveRate: satReport.positiveRate,
    neutralRate: satReport.neutralRate,
    negativeRate: satReport.negativeRate,
  };

  const questionsData = {
    satisfaction: {
      questions: satReport.questions,
      choices: satReport.choices,
      freetexts: satReport.freetexts,
      filters: satReport.filters,
    },
    fieldtrip: ftReport
      ? {
          questions: ftReport.questions,
          choices: ftReport.choices,
          freetexts: ftReport.freetexts,
          filters: ftReport.filters,
          totalResponses: ftReport.totalResponses,
          overallMean: ftReport.overallMean,
          positiveRate: ftReport.positiveRate,
          neutralRate: ftReport.neutralRate,
          negativeRate: ftReport.negativeRate,
        }
      : null,
  };

  const meta = {
    uploadedAt: parsed.uploadedAt,
    fileName: parsed.fileName,
    headers: parsed.headers,
    columnCount: parsed.columns.length,
    missingAllowlistQuestions: parsed.missingAllowlistQuestions ?? [],
    hasFieldtrip: parsed.columns.some((c) => c.group === "fieldtrip"),
  };

  const { data: updated, error: updateErr } = await (supabase as any)
    .from("survey_reports")
    .update({
      file_path: storagePath,
      file_size: file.size,
      summary,
      questions: questionsData,
      meta,
    })
    .eq("id", reportId)
    .select("*")
    .single();

  if (updateErr) throw new Error(updateErr.message);
  return updated as SavedReport;
}

/** Delete a report + its storage files */
export async function deleteReport(report: SavedReport): Promise<void> {
  // Delete storage file if exists
  if (report.file_path) {
    await supabase.storage.from("survey_uploads").remove([report.file_path]);
  }
  const { error } = await (supabase as any)
    .from("survey_reports")
    .delete()
    .eq("id", report.id);
  if (error) throw new Error(error.message);
}

/** Reconstruct SatisfactionReport from saved DB data */
export function restoreSatReport(saved: SavedReport): SatisfactionReport {
  const q = saved.questions as any;
  const sat = q?.satisfaction;
  if (!sat) {
    return {
      totalResponses: saved.summary?.totalResponses ?? 0,
      overallMean: saved.summary?.overallMean ?? null,
      positiveRate: saved.summary?.positiveRate ?? null,
      neutralRate: saved.summary?.neutralRate ?? null,
      negativeRate: saved.summary?.negativeRate ?? null,
      questions: [],
      choices: [],
      freetexts: [],
      filters: [],
    };
  }
  return {
    totalResponses: saved.summary?.totalResponses ?? 0,
    overallMean: saved.summary?.overallMean ?? null,
    positiveRate: saved.summary?.positiveRate ?? null,
    neutralRate: saved.summary?.neutralRate ?? null,
    negativeRate: saved.summary?.negativeRate ?? null,
    questions: sat.questions ?? [],
    choices: sat.choices ?? [],
    freetexts: sat.freetexts ?? [],
    filters: sat.filters ?? [],
  };
}

export function restoreFtReport(saved: SavedReport): SatisfactionReport | null {
  const q = saved.questions as any;
  const ft = q?.fieldtrip;
  if (!ft) return null;
  return {
    totalResponses: ft.totalResponses ?? 0,
    overallMean: ft.overallMean ?? null,
    positiveRate: ft.positiveRate ?? null,
    neutralRate: ft.neutralRate ?? null,
    negativeRate: ft.negativeRate ?? null,
    questions: ft.questions ?? [],
    choices: ft.choices ?? [],
    freetexts: ft.freetexts ?? [],
    filters: ft.filters ?? [],
  };
}

/** Download the original CSV file from storage */
export async function downloadCsvFile(filePath: string): Promise<File | null> {
  const { data, error } = await supabase.storage
    .from("survey_uploads")
    .download(filePath);
  if (error || !data) return null;
  const fileName = filePath.split("/").pop() ?? "report.csv";
  return new File([data], fileName, { type: "text/csv" });
}
