"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  customIcon?: React.ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  variant?: "default" | "sage" | "coral";
}

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: "text-sage-600" },
  down: { icon: TrendingDown, color: "text-coral-500" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
} as const;

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ className, title, value, icon: Icon, customIcon, trend, variant = "default", ...props }, ref) => {
    const TrendIcon = trend ? TREND_CONFIG[trend.direction].icon : null;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl p-4",
          variant === "default" && "surface-card",
          variant === "sage" && "surface-sage",
          variant === "coral" && "surface-coral",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "text-xs font-medium",
                variant === "default" ? "text-muted-foreground" : "text-white/80"
              )}
            >
              {title}
            </span>
            <span
              className={cn(
                "text-2xl font-bold",
                variant === "default" ? "text-foreground" : "text-white"
              )}
            >
              {value}
            </span>
            {trend && (
              <div className={cn("flex items-center gap-1 mt-1", TREND_CONFIG[trend.direction].color)}>
                {TrendIcon && <TrendIcon size={14} />}
                <span className="text-xs font-medium">{trend.value}</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl p-2",
              variant === "default"
                ? "bg-sage-100 text-sage-600"
                : "bg-white/20 text-white"
            )}
          >
            {customIcon ? customIcon : Icon && <Icon size={20} />}
          </div>
        </div>
      </div>
    );
  }
);
StatsCard.displayName = "StatsCard";

export { StatsCard };
