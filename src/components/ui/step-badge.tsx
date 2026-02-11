import * as React from "react";
import { cn } from "@/lib/utils";

export interface StepBadgeProps {
  /** The step number to display */
  number: number;
  /** Color variant */
  variant?: "sage" | "terracotta";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

const variantStyles = {
  sage: "bg-sage-100 text-sage-700",
  terracotta: "bg-terracotta-100 text-terracotta-700",
} as const;

const sizeStyles = {
  sm: "w-8 h-8 text-base rounded-lg",
  md: "w-10 h-10 text-lg rounded-xl",
  lg: "w-12 h-12 text-xl rounded-2xl",
} as const;

/**
 * Step badge component for numbered steps in guides/wizards
 *
 * @example
 * ```tsx
 * <StepBadge number={1} />
 * <StepBadge number={2} variant="terracotta" />
 * <StepBadge number={3} size="lg" />
 * ```
 */
export function StepBadge({
  number,
  variant = "sage",
  size = "md",
  className,
}: StepBadgeProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex items-center justify-center font-bold",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {number}
    </div>
  );
}
