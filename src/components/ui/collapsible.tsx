"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface CollapsibleContextValue {
  open: boolean;
  toggle: () => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

function useCollapsible() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible components must be used within a Collapsible");
  }
  return context;
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open: controlledOpen, onOpenChange, defaultOpen = false, className, children }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const toggle = React.useCallback(() => {
      if (isControlled) {
        onOpenChange?.(!open);
      } else {
        setInternalOpen(!open);
      }
    }, [isControlled, open, onOpenChange]);

    return (
      <CollapsibleContext.Provider value={{ open, toggle }}>
        <div
          ref={ref}
          className={cn(
            "rounded-2xl overflow-hidden",
            "bg-white border border-sage-200/60",
            "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
            className
          )}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = "Collapsible";

export interface CollapsibleTriggerProps {
  className?: string;
  children: React.ReactNode;
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, children }, ref) => {
    const { open, toggle } = useCollapsible();

    return (
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3",
          "text-left text-sm font-medium text-sage-700",
          "hover:bg-sage-50/50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-sage-300 focus:ring-inset",
          className
        )}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-sage-500 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
    );
  }
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export interface CollapsibleContentProps {
  className?: string;
  children: React.ReactNode;
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children }, ref) => {
    const { open } = useCollapsible();

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn("px-4 pb-4 pt-0 text-sm text-sage-600", className)}>
          {children}
        </div>
      </div>
    );
  }
);
CollapsibleContent.displayName = "CollapsibleContent";

// Accordion (multiple collapsibles)
export interface AccordionProps {
  type?: "single" | "multiple";
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  defaultValue?: string | string[];
  className?: string;
  children: React.ReactNode;
}

interface AccordionContextValue {
  type: "single" | "multiple";
  value: string[];
  toggle: (itemValue: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("AccordionItem must be used within an Accordion");
  }
  return context;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", value: controlledValue, onValueChange, defaultValue, className, children }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(() => {
      if (defaultValue) {
        return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      }
      return [];
    });

    const isControlled = controlledValue !== undefined;
    const value = React.useMemo(() => {
      if (isControlled) {
        return Array.isArray(controlledValue) ? controlledValue : [controlledValue];
      }
      return internalValue;
    }, [isControlled, controlledValue, internalValue]);

    const toggle = React.useCallback((itemValue: string) => {
      let newValue: string[];
      if (type === "single") {
        newValue = value.includes(itemValue) ? [] : [itemValue];
      } else {
        newValue = value.includes(itemValue)
          ? value.filter(v => v !== itemValue)
          : [...value, itemValue];
      }

      if (isControlled) {
        onValueChange?.(type === "single" ? (newValue[0] || "") : newValue);
      } else {
        setInternalValue(newValue);
      }
    }, [type, value, isControlled, onValueChange]);

    return (
      <AccordionContext.Provider value={{ type, value, toggle }}>
        <div ref={ref} className={cn("flex flex-col gap-2", className)}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

export interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

function useAccordionItem() {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error("AccordionTrigger/Content must be used within an AccordionItem");
  }
  return context;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children }, ref) => {
    const accordion = useAccordion();
    const isOpen = accordion.value.includes(value);

    return (
      <AccordionItemContext.Provider value={{ value, isOpen }}>
        <div
          ref={ref}
          className={cn(
            "rounded-2xl overflow-hidden",
            "bg-white border border-sage-200/60",
            "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
            className
          )}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps {
  className?: string;
  children: React.ReactNode;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children }, ref) => {
    const accordion = useAccordion();
    const { value, isOpen } = useAccordionItem();

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => accordion.toggle(value)}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3",
          "text-left text-sm font-medium text-sage-700",
          "hover:bg-sage-50/50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-sage-300 focus:ring-inset",
          className
        )}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-sage-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps {
  className?: string;
  children: React.ReactNode;
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children }, ref) => {
    const { isOpen } = useAccordionItem();

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn("px-4 pb-4 pt-0 text-sm text-sage-600", className)}>
          {children}
        </div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};
