"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error";
  dismissible?: boolean;
  onDismiss?: () => void;
}

const VARIANT_CONFIG = {
  default: {
    icon: Info,
    iconColor: "text-sage-600",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-sage-600",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-red-600",
  },
} as const;

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", dismissible, onDismiss, children, ...props }, ref) => {
    const config = VARIANT_CONFIG[variant];
    const Icon = config.icon;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative flex gap-3 rounded-xl p-4",
          `alert-pillowy alert-pillowy-${variant}`,
          className
        )}
        {...props}
      >
        <div className={cn("shrink-0 mt-0.5 alert-icon-wrapper", config.iconColor)}>
          <Icon size={20} />
        </div>
        <div className="flex-1 text-foreground">{children}</div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="close-btn"
          >
            <X size={16} />
            <span className="sr-only">Dismiss</span>
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("font-semibold leading-none mb-1", className)} {...props} />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
