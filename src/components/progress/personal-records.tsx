"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/ui/stats-card";
import { Trophy, Flame, Activity, Clock } from "lucide-react";
import { getMockPersonalRecords, type PersonalRecords } from "@/lib/mock-data";

interface PersonalRecordsSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: PersonalRecords;
}

const PersonalRecordsSection = React.forwardRef<HTMLDivElement, PersonalRecordsSectionProps>(
  ({ className, data = getMockPersonalRecords(), ...props }, ref) => {
    const formattedTotalTime = React.useMemo(() => {
      const hours = Math.floor(data.totalTimeMinutes / 60);
      const minutes = data.totalTimeMinutes % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }, [data.totalTimeMinutes]);

    return (
      <div
        ref={ref}
        className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}
        {...props}
      >
        <StatsCard
          title="Best Form Score"
          value={data.bestScore.score}
          customIcon={<Trophy className="w-5 h-5" />}
          variant="sage"
          trend={{
            direction: "neutral",
            value: data.bestScore.exerciseName,
          }}
        />

        <StatsCard
          title="Longest Streak"
          value={`${data.longestStreak} days`}
          customIcon={<Flame className="w-5 h-5" />}
          variant="coral"
        />

        <StatsCard
          title="Total Sessions"
          value={data.totalSessions}
          customIcon={<Activity className="w-5 h-5" />}
          variant="default"
        />

        <StatsCard
          title="Total Time"
          value={formattedTotalTime}
          customIcon={<Clock className="w-5 h-5" />}
          variant="default"
        />
      </div>
    );
  }
);
PersonalRecordsSection.displayName = "PersonalRecordsSection";

export { PersonalRecordsSection };
