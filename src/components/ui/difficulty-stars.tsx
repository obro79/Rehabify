"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export interface DifficultyStarsProps {
  level: number;
  max?: number;
  size?: "sm" | "default";
  className?: string;
}

const SIZE_CONFIG = {
  sm: 12,
  default: 14,
} as const;

const DifficultyStars = React.forwardRef<HTMLDivElement, DifficultyStarsProps>(
  ({ level, max = 5, size = "sm", className }, ref) => {
    const starSize = SIZE_CONFIG[size];

    return (
      <div ref={ref} className={cn("flex gap-0.5", className)}>
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
          <Star
            key={star}
            size={starSize}
            className={cn(
              star <= level
                ? "fill-amber-400 text-amber-400"
                : "text-sage-200"
            )}
          />
        ))}
      </div>
    );
  }
);
DifficultyStars.displayName = "DifficultyStars";

export { DifficultyStars };
