import type {
  Instructor,
  Course,
  Cohort,
  CohortKpi,
  FunnelData,
  ChecklistSummary,
  Enrollment,
} from "./types";

export interface DataProvider {
  listInstructors(): Promise<Instructor[]>;
  listCourses(instructorId: string): Promise<Course[]>;
  listCohorts(instructorId: string, courseId: string): Promise<Cohort[]>;
  getCohortKpis(instructorId: string, courseId: string): Promise<CohortKpi[]>;
  getFunnel(cohortId: string): Promise<FunnelData>;
  getChecklist(cohortId: string): Promise<ChecklistSummary>;
  getRecentEnrollments(cohortId: string, limit?: number): Promise<Enrollment[]>;
}
