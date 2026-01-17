"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "default" | "lg";
}

const SIZE_CONFIG = {
  sm: 14,
  default: 18,
  lg: 22,
} as const;

/**
 * Reusable close button for modals, alerts, toasts, etc.
 */
const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ className, size = "default", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "close-btn",
        className
      )}
      {...props}
    >
      <X size={SIZE_CONFIG[size]} />
      <span className="sr-only">Close</span>
    </button>
  )
);
CloseButton.displayName = "CloseButton";

export { CloseButton };
