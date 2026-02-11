"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const PTDashboardIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
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
          <linearGradient id={`${id}-d`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.darker} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Circular background */}
        <circle cx="24" cy="24" r="20" fill={g} filter={s} />
        <path
          d="M24 4 A20 20 0 0 0 6 18"
          stroke="white"
          strokeWidth="6"
          strokeOpacity="0.3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Dashboard grid - 4 tiles */}
        <g fill="white" fillOpacity="0.95">
          {/* Top-left (large) */}
          <rect x="13" y="13" width="10" height="10" rx="2.5" />
          {/* Top-right */}
          <rect x="25" y="13" width="10" height="10" rx="2.5" />
          {/* Bottom-left */}
          <rect x="13" y="25" width="10" height="10" rx="2.5" />
          {/* Bottom-right */}
          <rect x="25" y="25" width="10" height="10" rx="2.5" />
        </g>

        {/* Inner detail lines on tiles */}
        <g fill={d}>
          <rect x="15" y="17" width="6" height="1.5" rx="0.75" />
          <rect x="27" y="17" width="6" height="1.5" rx="0.75" />
          <rect x="15" y="29" width="6" height="1.5" rx="0.75" />
          <rect x="27" y="29" width="6" height="1.5" rx="0.75" />
        </g>
      </svg>
    );
  }
);
PTDashboardIcon.displayName = "PTDashboardIcon";

export { PTDashboardIcon };
