"use client";

import React from "react";
import { Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionTimer } from "@/components/ui/session-timer";

interface SessionHeaderProps {
  exerciseName: string;
  category: string;
  startTime: Date;
  isPaused: boolean;
  onPauseToggle: () => void;
  onEnd: () => void;
}

export function SessionHeader({
  exerciseName,
  category,
  startTime,
  isPaused,
  onPauseToggle,
  onEnd,
}: SessionHeaderProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{exerciseName}</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {category.replace(/_/g, " ")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SessionTimer startTime={startTime} isPaused={isPaused} size="default" />

            <Button variant="ghost" size="sm" onClick={onPauseToggle} className="gap-1.5">
              {isPaused ? (
                <>
                  <Play className="h-4 w-4" /> Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              )}
            </Button>

            <Button variant="destructive" size="sm" onClick={onEnd} className="gap-1.5">
              <X className="h-4 w-4" /> End
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
