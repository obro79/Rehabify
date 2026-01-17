"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricPillProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  color?: "sage" | "coral" | "neutral";
  size?: "sm" | "default" | "lg";
  animate?: boolean;
  className?: string;
}

export function MetricPill({
  label,
  value,
  subValue,
  icon,
  color = "neutral",
  size = "default",
  animate = true,
  className,
}: MetricPillProps) {
  const [shouldPulse, setShouldPulse] = React.useState(false);
  const prevValueRef = React.useRef(value);

  // Trigger pulse animation on value change
  React.useEffect(() => {
    if (animate && prevValueRef.current !== value) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 300);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value, animate]);

  const sizeClasses = {
    sm: "px-3 py-1.5 gap-1.5",
    default: "px-4 py-2.5 gap-2",
    lg: "px-5 py-3 gap-3",
  };

  const valueSizeClasses = {
    sm: "text-lg",
    default: "text-2xl",
    lg: "text-3xl",
  };

  const labelSizeClasses = {
    sm: "text-[10px]",
    default: "text-xs",
    lg: "text-sm",
  };

  const colorClasses = {
    sage: "border-sage-300 bg-gradient-to-b from-sage-50 to-sage-100/50",
    coral: "border-coral-300 bg-gradient-to-b from-coral-50 to-coral-100/50",
    neutral: "border-sage-200 bg-gradient-to-b from-white to-sage-50/50",
  };

  const accentColorClasses = {
    sage: "text-sage-700",
    coral: "text-coral-600",
    neutral: "text-foreground",
  };

  return (
    <motion.div
      animate={shouldPulse ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "metric-pill",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    >
      {icon && (
        <div className={cn("flex-shrink-0", accentColorClasses[color])}>
          {icon}
        </div>
      )}

      <div className="flex flex-col items-center min-w-0">
        <span className={cn(
          "uppercase tracking-wider font-medium text-muted-foreground",
          labelSizeClasses[size]
        )}>
          {label}
        </span>

        <AnimatePresence mode="popLayout">
          <motion.span
            key={String(value)}
            initial={animate ? { y: -10, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "font-bold tabular-nums leading-none",
              valueSizeClasses[size],
              accentColorClasses[color]
            )}
          >
            {value}
          </motion.span>
        </AnimatePresence>

        {subValue && (
          <span className={cn(
            "text-muted-foreground mt-0.5",
            labelSizeClasses[size]
          )}>
            {subValue}
          </span>
        )}
      </div>
    </motion.div>
  );
}
