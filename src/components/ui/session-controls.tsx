"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Play, Pause, Square, HelpCircle } from "lucide-react";

export interface SessionControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onHelp?: () => void;
  showHelp?: boolean;
  size?: "sm" | "default" | "lg";
}

const SIZE_CONFIG = {
  sm: { button: "sm" as const, icon: 16 },
  default: { button: "default" as const, icon: 20 },
  lg: { button: "lg" as const, icon: 24 },
} as const;

const SessionControls = React.forwardRef<HTMLDivElement, SessionControlsProps>(
  (
    {
      className,
      isPaused,
      onPause,
      onResume,
      onEnd,
      onHelp,
      showHelp = true,
      size = "default",
      ...props
    },
    ref
  ) => {
    const config = SIZE_CONFIG[size];

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        {/* Pause/Resume Button */}
        <Button
          variant="ghost"
          size={config.button}
          onClick={isPaused ? onResume : onPause}
          aria-label={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <>
              <Play size={config.icon} />
              <span className="ml-1">Resume</span>
            </>
          ) : (
            <>
              <Pause size={config.icon} />
              <span className="ml-1">Pause</span>
            </>
          )}
        </Button>

        {/* End Session Button */}
        <Button
          variant="destructive"
          size={config.button}
          onClick={onEnd}
          aria-label="End session"
        >
          <Square size={config.icon} className="fill-current" />
          <span className="ml-1">End</span>
        </Button>

        {/* Help Button (optional) */}
        {showHelp && onHelp && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onHelp}
            aria-label="Get help"
            className="rounded-full"
          >
            <HelpCircle size={config.icon} />
          </Button>
        )}
      </div>
    );
  }
);
SessionControls.displayName = "SessionControls";

export { SessionControls };
