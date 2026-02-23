import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  instructors,
  getCoursesForInstructor,
  getCohortsForInstructorCourse,
} from "@/data/mockData";

interface Props {
  instructorId: string;
  courseId: string;
  cohortId: string;
  onInstructorChange: (v: string) => void;
  onCourseChange: (v: string) => void;
  onCohortChange: (v: string) => void;
}

export function DashboardFilters({
  instructorId,
  courseId,
  cohortId,
  onInstructorChange,
  onCourseChange,
  onCohortChange,
}: Props) {
  const availableCourses = instructorId ? getCoursesForInstructor(instructorId) : [];
  const availableCohorts =
    instructorId && courseId
      ? getCohortsForInstructorCourse(instructorId, courseId)
      : [];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={instructorId} onValueChange={onInstructorChange}>
        <SelectTrigger className="w-[180px] bg-card">
          <SelectValue placeholder="강사 선택" />
        </SelectTrigger>
        <SelectContent>
          {instructors.map((inst) => (
            <SelectItem key={inst.id} value={inst.id}>
              {inst.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={courseId} onValueChange={onCourseChange} disabled={!instructorId}>
        <SelectTrigger className="w-[220px] bg-card">
          <SelectValue placeholder="강의 선택" />
        </SelectTrigger>
        <SelectContent>
          {availableCourses.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={cohortId} onValueChange={onCohortChange} disabled={!courseId}>
        <SelectTrigger className="w-[140px] bg-card">
          <SelectValue placeholder="기수 선택" />
        </SelectTrigger>
        <SelectContent>
          {availableCohorts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.cohort_no}기 ({c.status})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
