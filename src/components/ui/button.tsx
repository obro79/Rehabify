"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-safe:active:scale-[0.98] motion-safe:active:brightness-95",
  {
    variants: {
      variant: {
        // Outlined button (like "Start Session")
        primary: "surface-outlined text-foreground hover:bg-gradient-to-b hover:to-sage-100",
        // Sage green button (like "Earn Session")
        secondary: "surface-sage hover:from-sage-400 hover:to-sage-600",
        // Coral button (like "End Session")
        destructive: "surface-coral hover:from-coral-400 hover:to-coral-500",
        // Terracotta button (wellness sanctuary accent)
        terracotta: "surface-terracotta hover:from-terracotta-400 hover:to-terracotta-600",
        // Muted button (like "Pause")
        ghost: "surface-soft text-foreground hover:from-sage-50 hover:to-sage-100",
        // Circular icon button
        icon: "surface-sage !rounded-full hover:from-sage-400 hover:to-sage-600",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
