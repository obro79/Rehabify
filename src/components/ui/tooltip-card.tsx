"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipCardProps {
  content: React.ReactNode;
  children: React.ReactNode;
  containerClassName?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({
  content,
  children,
  containerClassName,
  side = "top",
}: TooltipCardProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 200);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      className={cn("relative inline-flex", containerClassName)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 w-64 p-4",
            "bg-white rounded-lg shadow-xl border border-sage-200",
            "animate-in fade-in-0 zoom-in-95",
            positionClasses[side]
          )}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-0 h-0 border-4",
              side === "top" && "top-full left-1/2 -translate-x-1/2 border-t-white border-x-transparent border-b-transparent",
              side === "bottom" && "bottom-full left-1/2 -translate-x-1/2 border-b-white border-x-transparent border-t-transparent",
              side === "left" && "left-full top-1/2 -translate-y-1/2 border-l-white border-y-transparent border-r-transparent",
              side === "right" && "right-full top-1/2 -translate-y-1/2 border-r-white border-y-transparent border-l-transparent"
            )}
          />
        </div>
      )}
    </span>
  );
}

