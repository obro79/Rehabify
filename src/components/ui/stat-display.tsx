"use client";

import { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatDisplayProps {
  /** Label text displayed above the value */
  label: string;
  /** The main value to display (can be string, number, or ReactNode) */
  value: ReactNode;
  /** Optional subtitle below the value */
  subtitle?: string;
  /** Optional status message (displayed in accent color) */
  status?: string;
  /** Size variant for the value text */
  size?: "sm" | "md" | "lg";
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Additional CSS classes */
  className?: string;
}

const valueSizeClasses = {
  sm: "text-xl font-bold",
  md: "text-3xl font-bold",
  lg: "text-4xl font-bold",
} as const;

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/**
 * A component for displaying statistics with a label, value, and optional subtitle/status.
 * Provides consistent typography and spacing for metric displays.
 */
export function StatDisplay({
  label,
  value,
  subtitle,
  status,
  size = "md",
  align = "center",
  className,
}: StatDisplayProps): ReactElement {
  return (
    <div className={cn("space-y-1", alignClasses[align], className)}>
      <span className="block text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <span className={cn("block text-foreground", valueSizeClasses[size])}>
        {value}
      </span>
      {subtitle && (
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      )}
      {status && (
        <div className="text-xs font-medium text-sage-600">{status}</div>
      )}
    </div>
  );
}
