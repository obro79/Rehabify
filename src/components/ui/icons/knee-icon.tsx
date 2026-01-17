"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const KneeIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();

    return (
      <svg
        ref={ref}
        width={ICON_SIZES[size]}
        height={ICON_SIZES[size]}
        className={cn("drop-shadow-md", className)}
        {...BASE_SVG_ATTRS}
        {...props}
      >
        <defs>
          <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
          <linearGradient id={`${id}-h`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Upper leg (femur) */}
        <rect
          x="18"
          y="4"
          width="12"
          height="18"
          rx="6"
          fill={`url(#${id}-g)`}
          filter={`url(#${id}-s)`}
        />
        <rect
          x="18"
          y="4"
          width="6"
          height="18"
          rx="6"
          fill={`url(#${id}-h)`}
        />

        {/* Knee joint (patella) */}
        <circle
          cx="24"
          cy="24"
          r="8"
          fill={`url(#${id}-g)`}
          filter={`url(#${id}-s)`}
        />
        <ellipse
          cx="24"
          cy="24"
          rx="4"
          ry="6"
          fill={`url(#${id}-h)`}
        />

        {/* Lower leg (tibia) */}
        <rect
          x="19"
          y="28"
          width="10"
          height="16"
          rx="5"
          fill={`url(#${id}-g)`}
          filter={`url(#${id}-s)`}
        />
        <rect
          x="19"
          y="28"
          width="5"
          height="16"
          rx="5"
          fill={`url(#${id}-h)`}
        />

        {/* Joint highlights */}
        <circle
          cx="24"
          cy="24"
          r="2.5"
          fill={colors.accent}
          fillOpacity="0.6"
        />
      </svg>
    );
  }
);
KneeIcon.displayName = "KneeIcon";

export { KneeIcon };
