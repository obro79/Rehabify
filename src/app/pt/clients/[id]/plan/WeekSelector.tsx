"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PlanStructure, PlanWeek } from "@/lib/gemini/types";

interface WeekSelectorProps {
  planStructure: PlanStructure;
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  currentWeek: PlanWeek | undefined;
  onFocusChange: (focus: string) => void;
  onNotesChange: (notes: string) => void;
}

export function WeekSelector({
  planStructure,
  selectedWeek,
  onWeekChange,
  currentWeek,
  onFocusChange,
  onNotesChange,
}: WeekSelectorProps): React.JSX.Element {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-sage-700 mb-2">
        Week Selection
      </label>
      <Tabs
        value={String(selectedWeek)}
        onValueChange={(val) => onWeekChange(Number(val))}
        className="mb-4"
      >
        <TabsList className="grid grid-cols-6 gap-1 w-full">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((weekNum) => {
            const week = planStructure.weeks.find(
              (w) => w.weekNumber === weekNum
            );
            const exerciseCount = week?.exercises.length || 0;
            return (
              <TabsTrigger
                key={weekNum}
                value={String(weekNum)}
                className="flex flex-col items-center gap-0.5 py-2"
              >
                <span className="text-xs font-medium">W{weekNum}</span>
                {exerciseCount > 0 && (
                  <span className="text-[10px] text-sage-600 bg-sage-100 rounded-full px-1.5 min-w-[18px]">
                    {exerciseCount}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {currentWeek && (
        <div className="mb-4 p-3 bg-sage-50 rounded-lg">
          <div className="mb-2">
            <label className="block text-xs font-medium text-sage-700 mb-1">
              Week Focus
            </label>
            <Input
              value={currentWeek.focus}
              onChange={(e) => onFocusChange(e.target.value)}
              className="text-sm"
              placeholder="e.g., Pain relief and gentle mobility"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-sage-700 mb-1">
              Patient Notes
            </label>
            <Textarea
              value={currentWeek.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="min-h-[60px] text-sm"
              placeholder="Instructions for this week..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
