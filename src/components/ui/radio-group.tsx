"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  name: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

function useRadioGroup() {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup");
  }
  return context;
}

export interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  className?: string;
  children: React.ReactNode;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, onValueChange, name = "radio-group", className, children }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
        <div ref={ref} role="radiogroup" className={cn("flex flex-col gap-2", className)}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps {
  value: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ value, id, disabled = false, className, children }, ref) => {
    const context = useRadioGroup();
    const isSelected = context.value === value;
    const itemId = id || `${context.name}-${value}`;

    return (
      <label
        htmlFor={itemId}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer",
          "bg-white border border-sage-200/60",
          "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
          "transition-all hover:border-sage-300",
          isSelected && "border-sage-400 ring-2 ring-sage-200",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <button
          ref={ref}
          type="button"
          role="radio"
          id={itemId}
          aria-checked={isSelected}
          disabled={disabled}
          onClick={() => !disabled && context.onValueChange(value)}
          className={cn(
            "h-5 w-5 rounded-full border-2 flex items-center justify-center",
            "transition-all flex-shrink-0",
            isSelected
              ? "border-sage-500 bg-sage-500"
              : "border-sage-300 bg-white hover:border-sage-400"
          )}
        >
          {isSelected && (
            <div className="h-2 w-2 rounded-full bg-white" />
          )}
        </button>
        {children && (
          <span className="text-sm text-sage-700">{children}</span>
        )}
      </label>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
