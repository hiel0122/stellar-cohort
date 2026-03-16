/**
 * Satisfaction Analysis Service
 * Currently: local state + localStorage
 * Future: swap to Supabase implementation
 */
import type { ParsedCsv, SatisfactionReport, SatisfactionDataService } from "./types";
import { parseCsvFile } from "./csvParser";
import { buildReport } from "./reportBuilder";

const STORAGE_KEY_CSV = "satisfaction_csv_last_v1";

class LocalSatisfactionService implements SatisfactionDataService {
  async loadCsv(file: File): Promise<ParsedCsv> {
    return parseCsvFile(file);
  }

  buildReport(parsed: ParsedCsv, activeFilters?: Record<number, string[]>): SatisfactionReport {
    return buildReport(parsed, activeFilters);
  }

  saveSnapshot(parsed: ParsedCsv): void {
    try {
      localStorage.setItem(STORAGE_KEY_CSV, JSON.stringify(parsed));
    } catch {
      // Storage full — silently ignore
    }
  }

  loadLastSnapshot(): ParsedCsv | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CSV);
      if (!raw) return null;
      return JSON.parse(raw) as ParsedCsv;
    } catch {
      return null;
    }
  }

  clearSnapshot(): void {
    localStorage.removeItem(STORAGE_KEY_CSV);
  }
}

// Singleton — swap with SupabaseSatisfactionService later
export const satisfactionService: SatisfactionDataService = new LocalSatisfactionService();
