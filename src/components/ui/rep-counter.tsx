"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface RepCounterProps extends React.HTMLAttributes<HTMLDivElement> {
  current: number;
  target: number;
  size?: "sm" | "default" | "lg";
}

const SIZE_CONFIG = {
  sm: { text: "text-lg", label: "text-xs", icon: 16 },
  default: { text: "text-2xl", label: "text-sm", icon: 20 },
  lg: { text: "text-4xl", label: "text-base", icon: 28 },
} as const;

const RepCounter = React.forwardRef<HTMLDivElement, RepCounterProps>(
  ({ className, current, target, size = "default", ...props }, ref) => {
    const config = SIZE_CONFIG[size];
    const isComplete = current >= target;
    const prevCurrentRef = React.useRef(current);
    const [isPulsing, setIsPulsing] = React.useState(false);

    React.useEffect(() => {
      if (current > prevCurrentRef.current) {
        setIsPulsing(true);
        const timer = setTimeout(() => setIsPulsing(false), 300);
        prevCurrentRef.current = current;
        return () => clearTimeout(timer);
      }
      prevCurrentRef.current = current;
    }, [current]);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center",
          className
        )}
        {...props}
      >
        {isComplete ? (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center rounded-full",
                "bg-gradient-to-b from-sage-light to-sage-500",
                "shadow-md animate-[scale-in_0.3s_ease-out]"
              )}
              style={{
                width: config.icon * 1.5,
                height: config.icon * 1.5,
              }}
            >
              <Check className="text-white" size={config.icon} strokeWidth={3} />
            </div>
            <span className={cn("font-bold text-sage-600", config.text)}>
              Complete!
            </span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-bold text-foreground transition-transform",
                config.text,
                isPulsing && "animate-[pulse-scale_0.3s_ease-out]"
              )}
            >
              {current}
            </span>
            <span className={cn("text-muted-foreground", config.label)}>
              / {target}
            </span>
          </div>
        )}
        {!isComplete && (
          <span className={cn("text-muted-foreground mt-0.5", config.label)}>
            reps
          </span>
        )}
      </div>
    );
  }
);
RepCounter.displayName = "RepCounter";

export { RepCounter };
