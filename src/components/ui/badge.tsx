"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all",
  {
    variants: {
      variant: {
        // Default soft badge
        default: "surface-soft text-foreground",
        // Active/selected state
        active: "surface-sage",
        // Muted/subtle badge (minimal styling, no 3D effect)
        muted: "bg-sage-50 text-muted-foreground border border-sage-200 rounded-full shadow-pillowy-sm",
        // Outlined badge
        outlined: "surface-outlined text-foreground",
        // Difficulty levels
        easy: "bg-gradient-to-b from-emerald-100 to-emerald-200 text-emerald-700 border border-emerald-300/60 shadow-[0_2px_8px_rgba(16,185,129,0.15),0_1px_2px_rgba(0,0,0,0.04)]",
        medium: "bg-gradient-to-b from-amber-100 to-amber-200 text-amber-700 border border-amber-300/60 shadow-[0_2px_8px_rgba(245,158,11,0.15),0_1px_2px_rgba(0,0,0,0.04)]",
        hard: "bg-gradient-to-b from-rose-100 to-rose-200 text-rose-700 border border-rose-300/60 shadow-[0_2px_8px_rgba(244,63,94,0.15),0_1px_2px_rgba(0,0,0,0.04)]",
        // Status indicators
        success: "bg-gradient-to-b from-green-100 to-green-200 text-green-700 border border-green-300/60 shadow-[0_2px_8px_rgba(34,197,94,0.15),0_1px_2px_rgba(0,0,0,0.04)]",
        warning: "bg-gradient-to-b from-yellow-100 to-yellow-200 text-yellow-700 border border-yellow-300/60 shadow-[0_2px_8px_rgba(234,179,8,0.15),0_1px_2px_rgba(0,0,0,0.04)]",
        error: "bg-gradient-to-b from-red-100 to-red-200 text-red-700 border border-red-300/60 shadow-[0_2px_8px_rgba(239,68,68,0.15),0_1px_2px_rgba(0,0,0,0.04)]",
        info: "bg-gradient-to-b from-blue-100 to-blue-200 text-blue-700 border border-blue-300/60 shadow-[0_2px_8px_rgba(59,130,246,0.15),0_1px_2px_rgba(0,0,0,0.04)]",
        // Coral variant for accent
        coral: "bg-gradient-to-b from-coral-100 to-coral-200 text-coral-700 border border-coral-300/60 shadow-[0_2px_8px_rgba(232,153,141,0.15),0_1px_2px_rgba(0,0,0,0.04)]",
      },
      size: {
        sm: "h-6 px-2 text-xs rounded-full",
        default: "h-8 px-3 text-sm rounded-full",
        lg: "h-9 px-4 text-sm rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        className={cn(badgeVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
