"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

export interface NumberInputProps {
  value?: number;
  onChange?: (value: number) => void;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  suffix?: string;
  id?: string;
}

const NumberInput = React.forwardRef<HTMLDivElement, NumberInputProps>(
  ({
    value: controlledValue,
    onChange,
    defaultValue = 0,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    className,
    label,
    suffix,
    id: providedId,
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;
    const generatedId = React.useId();
    const inputId = providedId || generatedId;

    const updateValue = React.useCallback((newValue: number) => {
      const clampedValue = Math.min(Math.max(newValue, min), max);
      if (isControlled) {
        onChange?.(clampedValue);
      } else {
        setInternalValue(clampedValue);
        onChange?.(clampedValue);
      }
    }, [min, max, isControlled, onChange]);

    const increment = () => updateValue(value + step);
    const decrement = () => updateValue(value - step);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value);
      if (!isNaN(parsed)) {
        updateValue(parsed);
      }
    };

    return (
      <div ref={ref} className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-sage-700">
            {label}
          </label>
        )}
        <div
          className={cn(
            "inline-flex items-center rounded-2xl",
            "bg-white border border-sage-200/60",
            "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
            disabled && "opacity-50"
          )}
        >
          <button
            type="button"
            onClick={decrement}
            disabled={disabled || value <= min}
            aria-label={`Decrease${label ? ` ${label}` : ""}`}
            aria-controls={inputId}
            className={cn(
              "flex items-center justify-center h-11 w-11 rounded-l-2xl",
              "text-sage-500 hover:bg-sage-50 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-sage-300 focus:ring-inset",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex items-center justify-center min-w-[60px] px-2">
            <input
              id={inputId}
              type="number"
              role="spinbutton"
              value={value}
              onChange={handleInputChange}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={value}
              aria-label={label}
              className={cn(
                "w-full text-center text-sm font-medium text-sage-700",
                "bg-transparent border-none outline-none",
                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              )}
            />
            {suffix && (
              <span className="text-sm text-sage-500 ml-0.5" aria-hidden="true">
                {suffix}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={increment}
            disabled={disabled || value >= max}
            aria-label={`Increase${label ? ` ${label}` : ""}`}
            aria-controls={inputId}
            className={cn(
              "flex items-center justify-center h-11 w-11 rounded-r-2xl",
              "text-sage-500 hover:bg-sage-50 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-sage-300 focus:ring-inset",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
