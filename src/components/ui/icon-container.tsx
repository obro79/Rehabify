"use client";

import { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconContainerProps {
  /** Icon or content to display inside the container */
  children: ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Color variant */
  variant?: "sage" | "coral" | "muted";
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-12 w-12 rounded-2xl",
} as const;

const variantClasses = {
  sage: "bg-sage-100",
  coral: "bg-coral-100",
  muted: "bg-muted",
} as const;

/**
 * A container for displaying icons with consistent styling.
 * Commonly used in stat cards and metric displays.
 */
export function IconContainer({
  children,
  size = "md",
  variant = "sage",
  className,
}: IconContainerProps): ReactElement {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
