"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "default";
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, size = "default", disabled, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled) {
        onCheckedChange?.(!checked);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          size === "default" && "h-6 w-11",
          size === "sm" && "h-5 w-9",
          checked
            ? "bg-gradient-to-b from-sage-light to-sage-500"
            : "bg-gradient-to-b from-muted to-muted-dark",
          "shadow-inner",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "switch-thumb mt-0.5",
            size === "default" && "h-5 w-5",
            size === "sm" && "h-4 w-4",
            checked
              ? size === "default"
                ? "translate-x-[22px]"
                : "translate-x-[18px]"
              : "translate-x-0.5"
          )}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
