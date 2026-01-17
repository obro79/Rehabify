"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { BodyRegion } from "@/lib/exercises/types";

export interface BodyRegionCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  region: BodyRegion;
  icon: React.ReactNode;
  title: string;
  description: string;
  onSelect?: (region: BodyRegion) => void;
}

const BodyRegionCard = React.forwardRef<HTMLDivElement, BodyRegionCardProps>(
  ({ region, icon, title, description, onSelect, className, ...props }, ref) => {
    const handleClick = () => {
      onSelect?.(region);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect?.(region);
      }
    };

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded-2xl",
          className
        )}
        {...props}
      >
        <Card
          className={cn(
            "h-full p-6 transition-all duration-200",
            "hover:shadow-lg motion-safe:hover:scale-[1.02]",
            "border-2 border-transparent hover:border-sage-200"
          )}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Icon container */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-sage-50">
              {icon}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground">
              {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </Card>
      </div>
    );
  }
);
BodyRegionCard.displayName = "BodyRegionCard";

export { BodyRegionCard };
