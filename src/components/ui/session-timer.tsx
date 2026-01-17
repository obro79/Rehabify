"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export interface SessionTimerProps extends React.HTMLAttributes<HTMLDivElement> {
  startTime: Date;
  isPaused?: boolean;
  showIcon?: boolean;
  size?: "sm" | "default" | "lg";
}

const SIZE_CONFIG = {
  sm: { text: "text-sm", icon: 14 },
  default: { text: "text-base", icon: 16 },
  lg: { text: "text-xl", icon: 20 },
} as const;

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const SessionTimer = React.forwardRef<HTMLDivElement, SessionTimerProps>(
  ({ className, startTime, isPaused = false, showIcon = true, size = "default", ...props }, ref) => {
    const config = SIZE_CONFIG[size];
    const [elapsed, setElapsed] = React.useState(0);
    const pausedAtRef = React.useRef<number | null>(null);

    React.useEffect(() => {
      if (isPaused) {
        pausedAtRef.current = elapsed;
        return;
      }

      const baseElapsed = pausedAtRef.current ?? 0;
      const adjustedStart = new Date(Date.now() - baseElapsed * 1000);

      const interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - adjustedStart.getTime()) / 1000);
        setElapsed(diff);
      }, 1000);

      return () => clearInterval(interval);
    }, [isPaused, elapsed]);

    React.useEffect(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsed(Math.max(0, diff));
    }, [startTime]);

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5",
          isPaused && "opacity-60",
          className
        )}
        {...props}
      >
        {showIcon && (
          <Clock
            size={config.icon}
            className="text-muted-foreground"
          />
        )}
        <span
          className={cn(
            "font-mono font-medium text-foreground tabular-nums",
            config.text
          )}
        >
          {formatTime(elapsed)}
        </span>
      </div>
    );
  }
);
SessionTimer.displayName = "SessionTimer";

export { SessionTimer };
