"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { WeeklyCalendar } from "@/components/ui/weekly-calendar";

interface ActivityDay {
  date: string;
  completed: boolean;
}

interface WeeklyActivityCardProps {
  activities: ActivityDay[];
  completedDays: number;
  totalDays: number;
  remainingDays: number;
}

export function WeeklyActivityCard({
  activities,
  completedDays,
  totalDays,
  remainingDays,
}: WeeklyActivityCardProps): ReactNode {
  return (
    <Card variant="organic" className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Weekly Activity</h3>
        <span className="text-sm text-muted-foreground">
          {completedDays} of {totalDays} days
        </span>
      </div>
      <WeeklyCalendar activities={activities} startOfWeek="monday" />
      <p className="text-sm text-muted-foreground mt-4">
        Keep going! Just {remainingDays} more days to hit your weekly goal.
      </p>
    </Card>
  );
}
