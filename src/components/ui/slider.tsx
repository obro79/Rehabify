"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  showValue?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value: controlledValue,
      defaultValue = 50,
      min = 0,
      max = 100,
      step = 1,
      onValueChange,
      showValue = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;
    const percentage = ((value - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="relative flex-1 h-6 flex items-center">
          {/* Track background - raised pillowy */}
          <div
            className="absolute w-full h-2.5 rounded-full"
            style={{
              background: "linear-gradient(to bottom, var(--sage-100) 0%, var(--sage-200) 100%)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          />

          {/* Filled track - raised pillowy */}
          <div
            className="absolute h-2.5 rounded-full transition-all"
            style={{
              width: `${percentage}%`,
              background: "linear-gradient(to bottom, var(--sage-light) 0%, var(--sage-500) 100%)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          />

          {/* Native input (invisible but functional) */}
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              "absolute w-full h-6 opacity-0 cursor-pointer",
              disabled && "cursor-not-allowed"
            )}
            {...props}
          />

          {/* Custom thumb - pillowy raised */}
          <div
            className={cn(
              "absolute w-5 h-5 rounded-full",
              "pointer-events-none transition-transform",
              !disabled && "hover:scale-110",
              disabled && "opacity-50"
            )}
            style={{
              left: `calc(${percentage}% - 10px)`,
              background: "linear-gradient(145deg, #ffffff 0%, var(--sage-50) 100%)",
              boxShadow: "0 3px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 2px rgba(0,0,0,0.05)",
              border: "2px solid var(--sage-400)",
            }}
          />
        </div>

        {showValue && (
          <span className="text-sm font-medium text-muted-foreground min-w-[3ch] text-right">
            {value}
          </span>
        )}
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
