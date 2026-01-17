"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useControllableState } from "@/hooks/use-controllable-state";
import { CloseButton } from "./close-button";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | undefined>(undefined);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within a Sheet provider");
  }
  return context;
}

const SheetTitleContext = React.createContext<string | undefined>(undefined);

function useSheetTitleId() {
  return React.useContext(SheetTitleContext);
}

export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open: controlledOpen, defaultOpen = false, onOpenChange, children }: SheetProps) {
  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  return (
    <SheetContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange } = useSheetContext();

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        onOpenChange(true);
      },
    });
  }

  return (
    <button type="button" onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

function SheetPortal({ children }: { children: React.ReactNode }) {
  const { open } = useSheetContext();
  if (!open) return null;
  return <>{children}</>;
}

function SheetOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { onOpenChange } = useSheetContext();

  return (
    <div
      className={cn("modal-overlay animate-in fade-in-0", className)}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
}

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right";
}

const SIDE_STYLES = {
  top: "inset-x-0 top-0 border-b slide-in-from-top",
  bottom: "inset-x-0 bottom-0 border-t slide-in-from-bottom",
  left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r slide-in-from-left",
  right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l slide-in-from-right",
} as const;

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = "right", children, ...props }, ref) => {
    const { onOpenChange } = useSheetContext();
    const previousFocusRef = React.useRef<Element | null>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const titleId = React.useId();

    // Focus trap and escape handling
    React.useEffect(() => {
      // Store previous focus
      previousFocusRef.current = document.activeElement;

      // Focus the sheet content
      if (contentRef.current) {
        contentRef.current.focus();
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onOpenChange(false);
      };

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== "Tab" || !contentRef.current) return;

        const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      };

      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTab);

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("keydown", handleTab);

        // Restore focus to previous element
        if (previousFocusRef.current instanceof HTMLElement) {
          previousFocusRef.current.focus();
        }
      };
    }, [onOpenChange]);

    return (
      <SheetPortal>
        <SheetOverlay />
        <div
          ref={(node) => {
            contentRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            "fixed z-50 bg-background p-6 shadow-xl",
            "animate-in",
            "focus:outline-none",
            SIDE_STYLES[side],
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          <SheetTitleContext.Provider value={titleId}>
            {children}
          </SheetTitleContext.Provider>
          <CloseButton
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4"
          />
        </div>
      </SheetPortal>
    );
  }
);
SheetContent.displayName = "SheetContent";

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 mb-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const titleId = useSheetTitleId();
  return <h2 id={titleId} className={cn("text-lg font-bold text-foreground", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6", className)}
      {...props}
    />
  );
}

function SheetClose({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange } = useSheetContext();

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        onOpenChange(false);
      },
    });
  }

  return (
    <button type="button" onClick={() => onOpenChange(false)}>
      {children}
    </button>
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
};
