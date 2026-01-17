"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, id, ...props }, ref) => {
    const inputId = React.useId();
    const errorId = React.useId();
    const finalId = id ?? inputId;
    const hasError = !!error;

    return (
      <div className="relative">
        {icon && (
          <div className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          id={finalId}
          type={type}
          className={cn(
            "flex h-11 w-full rounded-3xl px-4 py-2 text-base",
            "bg-white",
            "border border-sage-200/60",
            "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-300",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all",
            icon && "ps-10",
            hasError && "border-red-500 focus:ring-red-300 focus:border-red-300",
            className
          )}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
