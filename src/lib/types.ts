// Domain types aligned with Supabase schema (v_cohort_kpis view)

export interface Instructor {
  id: string;
  name: string;
  email: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
}

export interface Cohort {
  id: string;
  course_id: string;
  instructor_id: string;
  cohort_no: number;
  start_date: string | null;
  end_date: string | null;
  status: "planned" | "active" | "closed";
  price: number | null;
}

export interface CohortKpi {
  cohort_id: string;
  cohort_no: number;
  course_id: string;
  instructor_id: string;
  start_date: string | null;
  end_date: string | null;
  status: "planned" | "active" | "closed";
  revenue: number;
  students: number;
  leads: number;
  revenue_delta_pct: number | null;
  students_delta_pct: number | null;
  leads_delta_pct: number | null;
  youtube_denominator_est: number | null;
  youtube_conversion_est: number | null;
  youtube_conversion_delta_pct: number | null;
}

export interface FunnelData {
  lead: number;
  applied: number;
  paid: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  is_done: boolean;
  assignee: string | null;
}

export interface ChecklistSummary {
  total: number;
  done: number;
  items: ChecklistItem[];
}

export interface Enrollment {
  id: string;
  cohort_id: string;
  student_name: string | null;
  student_email: string | null;
  paid_amount: number;
  refunded_amount: number;
  paid_at: string | null;
}
