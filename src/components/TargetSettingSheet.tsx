import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CourseTargets } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: CourseTargets | null;
  onSave: (t: CourseTargets) => void;
  onClear: () => void;
}

export function TargetSettingSheet({ open, onOpenChange, targets, onSave, onClear }: Props) {
  const [revenue, setRevenue] = useState("");
  const [students, setStudents] = useState("");
  const [conversion, setConversion] = useState("");

  useEffect(() => {
    if (open) {
      setRevenue(targets?.revenue_target != null ? String(targets.revenue_target) : "");
      setStudents(targets?.students_target != null ? String(targets.students_target) : "");
      setConversion(targets?.conversion_target != null ? String(targets.conversion_target) : "");
    }
  }, [open, targets]);

  const handleSave = () => {
    onSave({
      revenue_target: revenue ? Number(revenue) : null,
      students_target: students ? Number(students) : null,
      conversion_target: conversion ? Number(conversion) : null,
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    onClear();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-base">목표 설정</SheetTitle>
          <SheetDescription className="text-xs">
            현재 선택된 과정의 운영 목표를 설정합니다. 저장 후 대시보드에 달성률이 표시됩니다.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="target-revenue" className="text-xs font-medium">
              목표 매출 (원)
            </Label>
            <Input
              id="target-revenue"
              type="number"
              placeholder="예: 300000000"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              className="h-9 text-sm tabular-nums"
            />
            <p className="text-[10px] text-muted-foreground">원 단위로 입력 (예: 3억 = 300000000)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-students" className="text-xs font-medium">
              목표 수강생 (명)
            </Label>
            <Input
              id="target-students"
              type="number"
              placeholder="예: 100"
              value={students}
              onChange={(e) => setStudents(e.target.value)}
              className="h-9 text-sm tabular-nums"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-conversion" className="text-xs font-medium">
              목표 전환율 (%, 결제/지원)
            </Label>
            <Input
              id="target-conversion"
              type="number"
              step="0.1"
              placeholder="예: 10"
              value={conversion}
              onChange={(e) => setConversion(e.target.value)}
              className="h-9 text-sm tabular-nums"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-8">
          <Button onClick={handleSave} className="flex-1 h-9 text-xs">
            저장
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs">
            취소
          </Button>
        </div>

        {targets && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 h-8 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleClear}
          >
            목표 초기화
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
