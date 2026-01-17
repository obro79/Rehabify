"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

export interface StreakDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStreak: number;
  bestStreak?: number;
  lastActiveDate?: Date;
  size?: "sm" | "default" | "lg";
}

const SIZE_CONFIG = {
  sm: { flame: 20, streak: "text-xl", label: "text-xs" },
  default: { flame: 28, streak: "text-3xl", label: "text-sm" },
  lg: { flame: 40, streak: "text-5xl", label: "text-base" },
} as const;

function isStreakAtRisk(lastActive?: Date): boolean {
  if (!lastActive) return false;
  const hoursSince = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
  return hoursSince > 20;
}

const StreakDisplay = React.forwardRef<HTMLDivElement, StreakDisplayProps>(
  ({ className, currentStreak, bestStreak, lastActiveDate, size = "default", ...props }, ref) => {
    const config = SIZE_CONFIG[size];
    const atRisk = isStreakAtRisk(lastActiveDate);
    const hasStreak = currentStreak > 0;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center gap-1",
          className
        )}
        {...props}
      >
        <div className="relative">
          <Flame
            size={config.flame}
            className={cn(
              "transition-colors",
              hasStreak
                ? atRisk
                  ? "text-coral-400 animate-pulse"
                  : "text-coral-500 motion-safe:animate-pulse-flame"
                : "text-muted-foreground"
            )}
            fill={hasStreak ? "currentColor" : "none"}
          />
          {hasStreak && !atRisk && (
            <div className="streak-flame-glow animate-[flame-flicker_1s_ease-in-out_infinite]" />
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className={cn("font-bold text-foreground", config.streak)}>
            {currentStreak}
          </span>
          <span className={cn("text-muted-foreground", config.label)}>
            day{currentStreak !== 1 ? "s" : ""}
          </span>
        </div>

        {bestStreak !== undefined && bestStreak > currentStreak && (
          <span className={cn("text-muted-foreground", config.label)}>
            Best: {bestStreak} days
          </span>
        )}

        {atRisk && (
          <span className={cn("text-coral-500 font-medium", config.label)}>
            Don&apos;t lose your streak!
          </span>
        )}
      </div>
    );
  }
);
StreakDisplay.displayName = "StreakDisplay";

export { StreakDisplay };
