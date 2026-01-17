"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
}

const SIZE_CONFIG = {
  sm: { dimension: 16, stroke: 2.5 },
  default: { dimension: 24, stroke: 3 },
  lg: { dimension: 36, stroke: 4 },
} as const;

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "default", ...props }, ref) => {
    const config = SIZE_CONFIG[size];

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn("relative inline-flex items-center justify-center", className)}
        {...props}
      >
        {/* Static track with pillowy shadow */}
        <svg
          className="absolute"
          width={config.dimension}
          height={config.dimension}
          viewBox="0 0 24 24"
          fill="none"
          style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))" }}
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="var(--sage-200)"
            strokeWidth={config.stroke}
          />
        </svg>
        {/* Spinning arc - no filter to avoid weird shadow rotation */}
        <svg
          className="animate-spin"
          width={config.dimension}
          height={config.dimension}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="var(--sage-500)"
            strokeWidth={config.stroke}
            strokeLinecap="round"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner };
