"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface WeeklyCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  activities: { date: string; completed: boolean }[];
  startOfWeek?: "sunday" | "monday";
}

const DAYS = {
  sunday: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  monday: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
} as const;

function getWeekDates(startOfWeek: "sunday" | "monday"): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const offset = startOfWeek === "monday" ? (dayOfWeek === 0 ? -6 : 1 - dayOfWeek) : -dayOfWeek;

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset + i);
    dates.push(date);
  }
  return dates;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WeeklyCalendar = React.forwardRef<HTMLDivElement, WeeklyCalendarProps>(
  ({ className, activities, startOfWeek = "sunday", ...props }, ref) => {
    const today = new Date();
    const weekDates = React.useMemo(() => getWeekDates(startOfWeek), [startOfWeek]);
    const dayLabels = DAYS[startOfWeek];

    const activityMap = React.useMemo(() => {
      const map = new Map<string, boolean>();
      activities.forEach((a) => map.set(a.date, a.completed));
      return map;
    }, [activities]);

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        <div className="grid grid-cols-7 gap-2">
          {dayLabels.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const dateKey = formatDateKey(date);
            const isCompleted = activityMap.get(dateKey) ?? false;
            const isToday = isSameDay(date, today);
            const isPast = date < today && !isToday;

            return (
              <div
                key={index}
                className={cn(
                  "relative flex items-center justify-center",
                  "w-9 h-9 rounded-lg transition-all",
                  isCompleted
                    ? "bg-gradient-to-b from-sage-light to-sage-500 text-white shadow-sm"
                    : isPast
                      ? "bg-muted text-muted-foreground"
                      : "bg-sage-50 text-foreground",
                  isToday && !isCompleted && "ring-2 ring-sage-400 ring-offset-1"
                )}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <span className="text-sm font-medium">{date.getDate()}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
WeeklyCalendar.displayName = "WeeklyCalendar";

export { WeeklyCalendar };
