"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const DatabaseIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
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
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Database cylinder - bottom */}
        <ellipse cx="24" cy="38" rx="14" ry="4" fill={colors.darker} filter={s} />

        {/* Database cylinder - body */}
        <rect x="10" y="14" width="28" height="24" fill={g} filter={s} />

        {/* Database cylinder - top */}
        <ellipse cx="24" cy="14" rx="14" ry="4" fill={colors.light} filter={s} />

        {/* Data rows */}
        <ellipse cx="24" cy="22" rx="10" ry="2.5" fill={colors.darker} fillOpacity="0.3" />
        <ellipse cx="24" cy="30" rx="10" ry="2.5" fill={colors.darker} fillOpacity="0.3" />

        {/* Highlight */}
        <path
          d="M10 14 L10 38 A14 4 0 0 0 12 38.5 L12 14 A14 4 0 0 1 10 14"
          fill="white"
          fillOpacity="0.25"
        />
      </svg>
    );
  }
);
DatabaseIcon.displayName = "DatabaseIcon";

export { DatabaseIcon };
