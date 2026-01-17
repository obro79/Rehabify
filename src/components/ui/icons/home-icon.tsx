"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const HomeIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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

        {/* House shape */}
        <g fill="white" fillOpacity="0.95">
          {/* Roof */}
          <path d="M24 12 L35 22 L33 22 L33 34 L15 34 L15 22 L13 22 Z" />
        </g>

        {/* Door and window details */}
        <g fill={d}>
          {/* Door */}
          <rect x="21" y="26" width="6" height="8" rx="1" />
          {/* Window */}
          <rect x="18" y="19" width="5" height="5" rx="1" />
          <rect x="25" y="19" width="5" height="5" rx="1" />
        </g>
      </svg>
    );
  }
);
HomeIcon.displayName = "HomeIcon";

export { HomeIcon };
