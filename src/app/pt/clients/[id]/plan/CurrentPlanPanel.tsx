"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { PlanExercise } from "@/lib/mock-data";
import type { PlanWeek } from "@/lib/gemini/types";

import { WeekSelector } from "./WeekSelector";
import { DayTabs } from "./DayTabs";
import { PlanExerciseCard } from "./PlanExerciseCard";

type ExerciseForDay =
  | PlanExercise
  | {
      exerciseId: string;
      name: string;
      sets: number;
      reps: number;
      holdSeconds?: number;
      days: number[];
      order: number;
      exerciseSlug?: string;
      notes?: string;
    };

interface CurrentPlanPanelProps {
  draftPlanStructure: { weeks: PlanWeek[] } | null;
  draftPlan: PlanExercise[];
  currentWeek: PlanWeek | undefined;
  selectedWeek: number;
  selectedDay: number;
  dayLabel: string;
  exerciseCount: number;
  hasExercises: boolean;
  exercisesForSelectedDay: ExerciseForDay[];
  onWeekChange: (week: number) => void;
  onDayChange: (day: number) => void;
  onFocusChange: (focus: string) => void;
  onNotesChange: (notes: string) => void;
  getExerciseCountForDay: (day: number) => number;
  onExerciseUpdate: (
    id: string,
    config: { sets?: number; reps?: number; holdSeconds?: number }
  ) => void;
  onExerciseRemove: (id: string) => void;
}

export function CurrentPlanPanel({
  draftPlanStructure,
  draftPlan,
  currentWeek,
  selectedWeek,
  selectedDay,
  dayLabel,
  exerciseCount,
  hasExercises,
  exercisesForSelectedDay,
  onWeekChange,
  onDayChange,
  onFocusChange,
  onNotesChange,
  getExerciseCountForDay,
  onExerciseUpdate,
  onExerciseRemove,
}: CurrentPlanPanelProps): React.JSX.Element {
  const planSummary = draftPlanStructure
    ? `12-week plan${currentWeek ? ` - Week ${selectedWeek}` : ""}`
    : `${draftPlan.length} exercise${draftPlan.length !== 1 ? "s" : ""} total`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-sage-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Current Plan</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{planSummary}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {draftPlanStructure && (
          <WeekSelector
            planStructure={draftPlanStructure}
            selectedWeek={selectedWeek}
            onWeekChange={onWeekChange}
            currentWeek={currentWeek}
            onFocusChange={onFocusChange}
            onNotesChange={onNotesChange}
          />
        )}

        <DayTabs
          selectedDay={selectedDay}
          onDayChange={onDayChange}
          getExerciseCount={getExerciseCountForDay}
        />

        <div className="mb-3">
          <h3 className="text-sm font-medium text-sage-700">
            {dayLabel} - {exerciseCount} exercise
            {exerciseCount !== 1 ? "s" : ""}
            {draftPlanStructure && currentWeek && (
              <span className="text-xs text-muted-foreground ml-2">
                (Week {selectedWeek})
              </span>
            )}
          </h3>
        </div>

        {!hasExercises ? (
          <EmptyDayState
            dayLabel={dayLabel}
            weekNumber={draftPlanStructure ? selectedWeek : undefined}
          />
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {exercisesForSelectedDay.map((exercise, index) => {
              const exerciseId =
                "exerciseId" in exercise
                  ? exercise.exerciseId
                  : (exercise as PlanExercise).id;
              const category =
                "category" in exercise ? exercise.category : "mobility";
              const days =
                "days" in exercise
                  ? exercise.days
                  : [(exercise as PlanExercise).dayOfWeek || selectedDay];

              return (
                <PlanExerciseCard
                  key={`${exerciseId}-${index}`}
                  exerciseId={exerciseId}
                  name={exercise.name}
                  category={category}
                  sets={exercise.sets}
                  reps={exercise.reps}
                  holdSeconds={exercise.holdSeconds}
                  days={days}
                  index={index}
                  onRemove={() => onExerciseRemove(exerciseId)}
                  onUpdate={(config) => onExerciseUpdate(exerciseId, config)}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EmptyDayStateProps {
  dayLabel: string;
  weekNumber?: number;
}

function EmptyDayState({
  dayLabel,
  weekNumber,
}: EmptyDayStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-sage-200 rounded-xl">
      <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mb-4">
        <Plus className="w-6 h-6 text-sage-500" />
      </div>
      <p className="text-muted-foreground">
        No exercises for {dayLabel}
        {weekNumber && ` (Week ${weekNumber})`}
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Click exercises from the library to add them
      </p>
    </div>
  );
}
