"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  mode?: "single" | "range";
  rangeValue?: { start: Date | null; end: Date | null };
  onRangeChange?: (range: { start: Date | null; end: Date | null }) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({
    value,
    onChange,
    mode = "single",
    rangeValue,
    onRangeChange,
    minDate,
    maxDate,
    className,
    placeholder = "Select date",
    disabled = false,
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [viewDate, setViewDate] = React.useState(() => value || new Date());
    const [selectingEnd, setSelectingEnd] = React.useState(false);
    const [focusedDay, setFocusedDay] = React.useState<number | null>(null);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const calendarRef = React.useRef<HTMLDivElement>(null);
    const calendarId = React.useId();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days: (number | null)[] = React.useMemo(() => {
      const result: (number | null)[] = [];
      for (let i = 0; i < firstDay; i++) {
        result.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
        result.push(i);
      }
      return result;
    }, [firstDay, daysInMonth]);

    const prevMonth = React.useCallback(() => {
      setViewDate(new Date(year, month - 1, 1));
      setFocusedDay(null);
    }, [year, month]);

    const nextMonth = React.useCallback(() => {
      setViewDate(new Date(year, month + 1, 1));
      setFocusedDay(null);
    }, [year, month]);

    const isDisabled = React.useCallback((day: number): boolean => {
      const date = new Date(year, month, day);
      if (minDate) {
        const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
        if (date < min) return true;
      }
      if (maxDate) {
        const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
        if (date > max) return true;
      }
      return false;
    }, [year, month, minDate, maxDate]);

    const selectDate = React.useCallback((day: number) => {
      if (isDisabled(day)) return;

      const selected = new Date(year, month, day);

      if (mode === "single") {
        onChange?.(selected);
        setIsOpen(false);
      } else {
        if (!selectingEnd || !rangeValue?.start) {
          onRangeChange?.({ start: selected, end: null });
          setSelectingEnd(true);
        } else {
          if (selected < rangeValue.start) {
            onRangeChange?.({ start: selected, end: rangeValue.start });
          } else {
            onRangeChange?.({ start: rangeValue.start, end: selected });
          }
          setSelectingEnd(false);
          setIsOpen(false);
        }
      }
    }, [year, month, mode, selectingEnd, rangeValue, isDisabled, onChange, onRangeChange]);

    const displayValue = React.useMemo(() => {
      if (mode === "single") {
        return value ? formatDate(value) : placeholder;
      } else {
        if (rangeValue?.start && rangeValue?.end) {
          return `${formatDate(rangeValue.start)} – ${formatDate(rangeValue.end)}`;
        } else if (rangeValue?.start) {
          return `${formatDate(rangeValue.start)} – ...`;
        }
        return placeholder;
      }
    }, [mode, value, rangeValue, placeholder]);

    // Keyboard navigation
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setIsOpen(true);
          setFocusedDay(value?.getDate() || new Date().getDate());
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setFocusedDay(prev => {
            if (prev === null) return 1;
            if (prev <= 1) {
              prevMonth();
              return getDaysInMonth(year, month - 1);
            }
            return prev - 1;
          });
          break;
        case "ArrowRight":
          e.preventDefault();
          setFocusedDay(prev => {
            if (prev === null) return 1;
            if (prev >= daysInMonth) {
              nextMonth();
              return 1;
            }
            return prev + 1;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedDay(prev => {
            if (prev === null) return 1;
            if (prev <= 7) {
              prevMonth();
              const prevMonthDays = getDaysInMonth(year, month - 1);
              return Math.min(prevMonthDays, prev + prevMonthDays - 7);
            }
            return prev - 7;
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedDay(prev => {
            if (prev === null) return 1;
            if (prev + 7 > daysInMonth) {
              nextMonth();
              return Math.min(getDaysInMonth(year, month + 1), prev + 7 - daysInMonth);
            }
            return prev + 7;
          });
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedDay !== null && !isDisabled(focusedDay)) {
            selectDate(focusedDay);
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusedDay(1);
          break;
        case "End":
          e.preventDefault();
          setFocusedDay(daysInMonth);
          break;
      }
    }, [isOpen, focusedDay, daysInMonth, year, month, value, isDisabled, prevMonth, nextMonth, selectDate]);

    // Close on click outside
    React.useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Focus management
    React.useEffect(() => {
      if (isOpen && focusedDay !== null && calendarRef.current) {
        const dayButton = calendarRef.current.querySelector(`[data-day="${focusedDay}"]`) as HTMLButtonElement;
        dayButton?.focus();
      }
    }, [isOpen, focusedDay]);

    // Reset focused day when opening
    React.useEffect(() => {
      if (isOpen) {
        const initialDay = value?.getMonth() === month && value?.getFullYear() === year
          ? value.getDate()
          : new Date().getMonth() === month && new Date().getFullYear() === year
            ? new Date().getDate()
            : 1;
        setFocusedDay(initialDay);
      }
    }, [isOpen, value, month, year]);

    return (
      <div ref={containerRef} className={cn("relative inline-block", className)}>
        <button
          ref={ref}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? calendarId : undefined}
          aria-label={displayValue === placeholder ? placeholder : `Selected date: ${displayValue}`}
          className={cn(
            "flex items-center gap-2 h-11 px-4 rounded-2xl",
            "bg-white border border-sage-200/60",
            "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
            "text-sm text-sage-700",
            "hover:border-sage-300 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-sage-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !value && !rangeValue?.start && "text-sage-400"
          )}
        >
          <Calendar className="h-4 w-4 text-sage-400" />
          <span>{displayValue}</span>
        </button>

        {isOpen && (
          <div
            ref={calendarRef}
            id={calendarId}
            role="dialog"
            aria-modal="true"
            aria-label={`Choose date, ${MONTHS[month]} ${year}`}
            onKeyDown={handleKeyDown}
            className={cn(
              "absolute z-50 mt-2 p-4 rounded-2xl",
              "bg-white border border-sage-200/60",
              "shadow-[0_4px_20px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg",
                  "text-sage-500 hover:bg-sage-50 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-sage-300"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-sage-700" aria-live="polite">
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg",
                  "text-sage-500 hover:bg-sage-50 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-sage-300"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2" role="row">
              {DAYS.map((day) => (
                <div
                  key={day}
                  role="columnheader"
                  aria-label={day === "Su" ? "Sunday" : day === "Mo" ? "Monday" : day === "Tu" ? "Tuesday" : day === "We" ? "Wednesday" : day === "Th" ? "Thursday" : day === "Fr" ? "Friday" : "Saturday"}
                  className="h-8 flex items-center justify-center text-xs font-medium text-sage-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Calendar">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-8 w-8" role="gridcell" />;
                }

                const date = new Date(year, month, day);
                const isSelected = mode === "single"
                  ? value && isSameDay(date, value)
                  : (rangeValue?.start && isSameDay(date, rangeValue.start)) ||
                    (rangeValue?.end && isSameDay(date, rangeValue.end));
                const inRange = mode === "range" && isInRange(date, rangeValue?.start || null, rangeValue?.end || null);
                const isToday = isSameDay(date, new Date());
                const dayDisabled = isDisabled(day);
                const isFocused = focusedDay === day;

                return (
                  <button
                    key={day}
                    type="button"
                    role="gridcell"
                    data-day={day}
                    tabIndex={isFocused ? 0 : -1}
                    onClick={() => !dayDisabled && selectDate(day)}
                    disabled={dayDisabled}
                    aria-selected={isSelected || undefined}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${day} ${MONTHS[month]} ${year}${isToday ? ", today" : ""}${isSelected ? ", selected" : ""}`}
                    className={cn(
                      "h-8 w-8 flex items-center justify-center text-sm rounded-lg",
                      "transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-sage-300 focus:ring-offset-1",
                      dayDisabled && "opacity-30 cursor-not-allowed",
                      isSelected && "bg-sage-500 text-white",
                      !isSelected && inRange && "bg-sage-100 text-sage-700",
                      !isSelected && !inRange && isToday && "border border-sage-400 text-sage-700 font-medium",
                      !isSelected && !inRange && !isToday && "text-sage-600 hover:bg-sage-50"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-sage-100 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setViewDate(today);
                  if (mode === "single") {
                    onChange?.(today);
                    setIsOpen(false);
                  } else {
                    setFocusedDay(today.getDate());
                  }
                }}
                className={cn(
                  "flex-1 h-9 text-sm font-medium rounded-lg",
                  "text-sage-600 hover:bg-sage-50 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-sage-300"
                )}
              >
                Today
              </button>
              {value && mode === "single" && (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.(null);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex-1 h-9 text-sm font-medium rounded-lg",
                    "text-sage-500 hover:bg-sage-50 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-sage-300"
                  )}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
