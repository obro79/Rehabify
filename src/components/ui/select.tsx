"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select provider");
  }
  return context;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

function Select({ value: controlledValue, defaultValue = "", onValueChange, children }: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
      setOpen(false);
    },
    [isControlled, onValueChange]
  );

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  placeholder?: string;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, placeholder = "Select...", children, ...props }, ref) => {
    const { value, open, setOpen } = useSelectContext();

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl px-3 py-2",
          "bg-white border border-sage-200 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {children || (value ? value : placeholder)}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext();
  return <span className={cn(!value && "text-muted-foreground")}>{value || placeholder}</span>;
}

interface SelectContentContextValue {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
}

const SelectContentContext = React.createContext<SelectContentContextValue | undefined>(undefined);

function useSelectContentContext() {
  return React.useContext(SelectContentContext);
}

function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen, onValueChange } = useSelectContext();
  const ref = React.useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  // Get all option values from children
  const optionValues = React.useMemo(() => {
    const values: string[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === SelectItem) {
        const props = child.props as { value: string };
        values.push(props.value);
      }
    });
    return values;
  }, [children]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case "Escape":
          setOpen(false);
          e.preventDefault();
          break;
        case "ArrowDown":
          setFocusedIndex((prev) => Math.min(prev + 1, optionValues.length - 1));
          e.preventDefault();
          break;
        case "ArrowUp":
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          e.preventDefault();
          break;
        case "Enter":
        case " ":
          if (optionValues[focusedIndex]) {
            onValueChange(optionValues[focusedIndex]);
          }
          e.preventDefault();
          break;
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, setOpen, focusedIndex, optionValues, onValueChange]);

  if (!open) return null;

  return (
    <SelectContentContext.Provider value={{ focusedIndex, setFocusedIndex }}>
      <div
        ref={ref}
        role="listbox"
        className={cn(
          "absolute z-50 mt-1 w-full min-w-[8rem]",
          "rounded-xl border border-sage-200 bg-white p-1",
          "shadow-lg",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
      >
        {children}
      </div>
    </SelectContentContext.Provider>
  );
}

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useSelectContext();
    const contentContext = useSelectContentContext();
    const isSelected = selectedValue === value;
    const itemRef = React.useRef<HTMLDivElement>(null);
    const [itemIndex, setItemIndex] = React.useState(-1);

    // Register this item's index
    React.useEffect(() => {
      if (!itemRef.current) return;
      const parent = itemRef.current.parentElement;
      if (!parent) return;
      const items = Array.from(parent.querySelectorAll('[role="option"]'));
      const index = items.indexOf(itemRef.current);
      setItemIndex(index);
    }, []);

    const isFocused = contentContext && itemIndex >= 0 && contentContext.focusedIndex === itemIndex;

    // Scroll into view when focused
    React.useEffect(() => {
      if (isFocused && itemRef.current) {
        itemRef.current.scrollIntoView({ block: "nearest" });
      }
    }, [isFocused]);

    return (
      <div
        ref={(node) => {
          itemRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        role="option"
        aria-selected={isSelected}
        aria-disabled={disabled}
        onClick={() => !disabled && onValueChange(value)}
        onMouseEnter={() => contentContext?.setFocusedIndex(itemIndex)}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5",
          "text-sm outline-none transition-colors",
          isSelected && "bg-sage-100 text-sage-900",
          !isSelected && isFocused && "bg-sage-50",
          !isSelected && !isFocused && "hover:bg-sage-50",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        {...props}
      >
        <span className="flex-1">{children}</span>
        {isSelected && <Check size={16} className="text-sage-600" />}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

function SelectGroup({ children }: { children: React.ReactNode }) {
  return <div className="py-1">{children}</div>;
}

function SelectLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-sage-100", className)} />;
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
};
