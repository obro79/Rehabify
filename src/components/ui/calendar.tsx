"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  markedDates?: Date[];
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ selectedDate, onSelectDate, markedDates = [], className }, ref) => {
    const today = new Date();
    const [viewDate, setViewDate] = React.useState(selectedDate || today);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days: (number | null)[] = React.useMemo(() => {
      const result: (number | null)[] = [];
      for (let i = 0; i < firstDay; i++) result.push(null);
      for (let i = 1; i <= daysInMonth; i++) result.push(i);
      return result;
    }, [firstDay, daysInMonth]);

    const isToday = (day: number) => isSameDay(new Date(year, month, day), today);
    const isSelected = (day: number) => selectedDate && isSameDay(new Date(year, month, day), selectedDate);
    const isMarked = (day: number) => markedDates.some((d) => isSameDay(d, new Date(year, month, day)));

    return (
      <div ref={ref} className={cn("calendar-container p-3 rounded-xl w-fit", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-foreground">Calendar</span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-0.5 rounded text-sage-500 hover:text-sage-700 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-0.5 rounded text-sage-500 hover:text-sage-700 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0 mb-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="w-6 h-4 text-[9px] font-medium text-muted-foreground text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0" role="grid" aria-label="Calendar">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="w-6 h-6" role="gridcell" />;
            }

            const dayIsToday = isToday(day);
            const dayIsSelected = isSelected(day);
            const dayIsMarked = isMarked(day);

            return (
              <button
                key={day}
                onClick={() => onSelectDate?.(new Date(year, month, day))}
                role="gridcell"
                aria-selected={dayIsSelected}
                className={cn(
                  "relative w-6 h-6 text-[10px] font-medium transition-all",
                  "flex items-center justify-center rounded-full",
                  !dayIsToday && !dayIsSelected && "text-foreground hover:bg-sage-100",
                  dayIsToday && !dayIsSelected && "text-sage-600",
                  dayIsSelected && "text-white"
                )}
              >
                {/* Today ring */}
                {dayIsToday && !dayIsSelected && (
                  <span className="absolute inset-0.5 rounded-full border-[1.5px] border-sage-400" />
                )}

                {/* Selected state */}
                {dayIsSelected && <span className="calendar-day-selected" />}

                <span className="relative z-10">{day}</span>

                {/* Marked indicator */}
                {dayIsMarked && !dayIsSelected && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sage-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
Calendar.displayName = "Calendar";

export { Calendar };
