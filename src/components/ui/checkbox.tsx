"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      label,
      disabled,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : uncontrolledChecked;
    const generatedId = React.useId();
    const id = providedId ?? generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      if (!isControlled) {
        setUncontrolledChecked(newChecked);
      }
      onCheckedChange?.(newChecked);
    };

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative">
          {/* Hidden native checkbox */}
          <input
            ref={ref}
            type="checkbox"
            id={id}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />

          {/* Custom checkbox */}
          <label
            htmlFor={id}
            className={cn(
              "flex items-center justify-center w-5 h-5 rounded-md",
              "border-2 transition-all cursor-pointer",
              checked
                ? "bg-sage-500 border-sage-500"
                : "bg-white border-sage-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-sage-400 peer-focus-visible:ring-offset-2",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {checked && (
              <Check size={14} className="text-white" strokeWidth={3} />
            )}
          </label>
        </div>

        {label && (
          <label
            htmlFor={id}
            className={cn(
              "text-sm text-foreground cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
