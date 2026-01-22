"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAYS_OF_WEEK } from "./plan-utils";

interface DayTabsProps {
  selectedDay: number;
  onDayChange: (day: number) => void;
  getExerciseCount: (day: number) => number;
}

export function DayTabs({
  selectedDay,
  onDayChange,
  getExerciseCount,
}: DayTabsProps): React.JSX.Element {
  return (
    <Tabs
      value={String(selectedDay)}
      onValueChange={(val) => onDayChange(Number(val))}
      className="mb-4"
    >
      <TabsList className="grid grid-cols-7 gap-1 w-full">
        {DAYS_OF_WEEK.map((day) => {
          const count = getExerciseCount(day.value);
          return (
            <TabsTrigger
              key={day.value}
              value={String(day.value)}
              className="flex flex-col items-center gap-0.5 py-2"
            >
              <span className="text-xs font-medium">{day.label}</span>
              {count > 0 && (
                <span className="text-[10px] text-sage-600 bg-sage-100 rounded-full px-1.5 min-w-[18px]">
                  {count}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
