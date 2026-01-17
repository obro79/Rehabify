"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: "sm" | "default" | "lg";
  color?: "sage" | "coral";
  showValue?: boolean;
}

const SIZE_CONFIG = {
  sm: "h-1.5",
  default: "h-2.5",
  lg: "h-4",
} as const;

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      size = "default",
      color = "sage",
      showValue = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className={cn("flex items-center gap-2", className)} {...props}>
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-full",
            SIZE_CONFIG[size]
          )}
          style={{
            background: "linear-gradient(to bottom, var(--sage-100) 0%, var(--sage-200) 100%)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
          ref={ref}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          {/* Progress fill - raised pillowy look */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300"
            )}
            style={{
              width: `${percentage}%`,
              background: color === "sage"
                ? "linear-gradient(to bottom, var(--sage-light) 0%, var(--sage-500) 100%)"
                : "linear-gradient(to bottom, var(--coral-light) 0%, var(--coral-500) 100%)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          />
        </div>

        {showValue && (
          <span className="text-sm font-medium text-muted-foreground min-w-[3ch]">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
