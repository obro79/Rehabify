"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
  id: string;
  label: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  className?: string;
}

/**
 * Step indicator for assessment flow
 * Shows progress through Interview -> Movement -> Summary phases
 */
export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step circle and label */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    isCompleted && "bg-sage-500 border-sage-500 text-white",
                    isCurrent && "bg-sage-100 border-sage-500 text-sage-700",
                    isUpcoming && "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCompleted && "text-sage-600",
                    isCurrent && "text-sage-700 font-semibold",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-3 -mt-6">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      index < currentIndex ? "bg-sage-500" : "bg-muted-foreground/20"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
