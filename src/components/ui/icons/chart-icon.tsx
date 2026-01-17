"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const ChartIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const h = `url(#${id}-h)`;
    const d = `url(#${id}-d)`;
    const s = `url(#${id}-s)`;

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
          <linearGradient id={`${id}-d`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.darker} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Base/axis */}
        <rect x="6" y="40" width="36" height="4" rx="2" fill={d} filter={s} />
        <rect x="6" y="8" width="4" height="36" rx="2" fill={d} />

        {/* Bars with 3D effect */}
        {/* Bar 1 - shortest */}
        <rect x="14" y="32" width="6" height="8" rx="2" fill={g} filter={s} />
        <rect x="14" y="32" width="3" height="8" rx="2" fill={h} />

        {/* Bar 2 - medium */}
        <rect x="23" y="24" width="6" height="16" rx="2" fill={g} filter={s} />
        <rect x="23" y="24" width="3" height="16" rx="2" fill={h} />

        {/* Bar 3 - tallest */}
        <rect x="32" y="14" width="6" height="26" rx="2" fill={g} filter={s} />
        <rect x="32" y="14" width="3" height="26" rx="2" fill={h} />

        {/* Trend line */}
        <path
          d="M17 30 L26 22 L35 12"
          stroke={colors.accent}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Arrow head on trend line */}
        <path
          d="M33 14 L35 12 L37 14"
          stroke={colors.accent}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Data points */}
        <circle cx="17" cy="30" r="2" fill="white" fillOpacity="0.8" />
        <circle cx="26" cy="22" r="2" fill="white" fillOpacity="0.8" />
        <circle cx="35" cy="12" r="2" fill="white" fillOpacity="0.8" />
      </svg>
    );
  }
);
ChartIcon.displayName = "ChartIcon";

export { ChartIcon };
