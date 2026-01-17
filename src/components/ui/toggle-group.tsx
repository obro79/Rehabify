"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleGroupContextValue {
  type: "single" | "multiple";
  value: string[];
  onValueChange: (value: string[]) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null);

function useToggleGroup() {
  const context = React.useContext(ToggleGroupContext);
  if (!context) {
    throw new Error("ToggleGroupItem must be used within a ToggleGroup");
  }
  return context;
}

export interface ToggleGroupProps {
  type?: "single" | "multiple";
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  defaultValue?: string | string[];
  className?: string;
  children: React.ReactNode;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ type = "single", value: controlledValue, onValueChange, defaultValue, className, children }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(() => {
      if (defaultValue) {
        return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      }
      return [];
    });

    const isControlled = controlledValue !== undefined;
    const value = isControlled
      ? Array.isArray(controlledValue) ? controlledValue : (controlledValue ? [controlledValue] : [])
      : internalValue;

    const handleValueChange = React.useCallback((newValue: string[]) => {
      if (isControlled) {
        onValueChange?.(type === "single" ? (newValue[0] || "") : newValue);
      } else {
        setInternalValue(newValue);
      }
    }, [isControlled, onValueChange, type]);

    return (
      <ToggleGroupContext.Provider value={{ type, value, onValueChange: handleValueChange }}>
        <div
          ref={ref}
          role="group"
          className={cn(
            "inline-flex items-center rounded-2xl p-1",
            "bg-white border border-sage-200/60",
            "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
            className
          )}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);
ToggleGroup.displayName = "ToggleGroup";

export interface ToggleGroupItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ value, disabled = false, className, children }, ref) => {
    const context = useToggleGroup();
    const isSelected = context.value.includes(value);

    const handleClick = () => {
      if (disabled) return;

      if (context.type === "single") {
        context.onValueChange(isSelected ? [] : [value]);
      } else {
        context.onValueChange(
          isSelected
            ? context.value.filter(v => v !== value)
            : [...context.value, value]
        );
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role={context.type === "single" ? "radio" : "checkbox"}
        aria-checked={isSelected}
        aria-pressed={context.type === "multiple" ? isSelected : undefined}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center px-4 py-2 text-sm font-medium",
          "rounded-xl transition-all",
          "focus:outline-none focus:ring-2 focus:ring-sage-300 focus:ring-offset-1",
          isSelected
            ? "bg-sage-500 text-white shadow-sm"
            : "text-sage-600 hover:bg-sage-50",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {children}
      </button>
    );
  }
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
