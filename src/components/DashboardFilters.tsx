import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { Instructor, Course, Cohort } from "@/lib/types";

interface Props {
  instructorId: string;
  courseId: string;
  cohortId: string;
  instructors: Instructor[];
  courses: Course[];
  cohorts: Cohort[];
  onInstructorChange: (v: string) => void;
  onCourseChange: (v: string) => void;
  onCohortChange: (v: string) => void;
  onReset: () => void;
}

export function DashboardFilters({
  instructorId, courseId, cohortId,
  instructors = [], courses = [], cohorts = [],
  onInstructorChange, onCourseChange, onCohortChange, onReset,
}: Props) {
  return (
    <div className="sticky top-12 z-20 -mx-4 md:-mx-8 border-b bg-background/80 backdrop-blur-sm px-4 md:px-8 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <Select value={instructorId} onValueChange={onInstructorChange}>
          <SelectTrigger className="h-8 w-[150px] text-xs bg-card border-border">
            <SelectValue placeholder="강사 선택" />
          </SelectTrigger>
          <SelectContent>
            {instructors.map((inst) => (
              <SelectItem key={inst.id} value={inst.id} className="text-xs">
                {inst.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={courseId} onValueChange={onCourseChange} disabled={!instructorId}>
          <SelectTrigger className="h-8 w-[200px] text-xs bg-card border-border">
            <SelectValue placeholder="강의 선택" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cohortId} onValueChange={onCohortChange} disabled={!courseId}>
          <SelectTrigger className="h-8 w-[120px] text-xs bg-card border-border">
            <SelectValue placeholder="기수" />
          </SelectTrigger>
          <SelectContent>
            {cohorts.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.cohort_no}기
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onReset}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}
