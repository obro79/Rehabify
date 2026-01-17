"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const LibraryIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const p = `url(#${id}-p)`;
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
          <linearGradient id={`${id}-p`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.95" />
            <stop offset="100%" stopColor="white" stopOpacity="0.85" />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Book spine */}
        <rect x="6" y="8" width="6" height="32" rx="2" fill={colors.darker} filter={s} />

        {/* Left page (back) */}
        <path
          d="M10 8 L10 40 Q18 38 24 40 L24 8 Q18 10 10 8 Z"
          fill={g}
          filter={s}
        />

        {/* Right page (front) */}
        <path
          d="M24 8 L24 40 Q30 38 38 40 L38 8 Q30 10 24 8 Z"
          fill={p}
          filter={s}
        />

        {/* Page lines */}
        <line x1="28" y1="14" x2="34" y2="13" stroke={colors.light} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="28" y1="20" x2="34" y2="19" stroke={colors.light} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="28" y1="26" x2="34" y2="25" stroke={colors.light} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="28" y1="32" x2="32" y2="31.5" stroke={colors.light} strokeWidth="1.5" strokeLinecap="round" />

        {/* Highlight on spine */}
        <rect x="6" y="8" width="2" height="32" rx="1" fill="white" fillOpacity="0.3" />
      </svg>
    );
  }
);
LibraryIcon.displayName = "LibraryIcon";

export { LibraryIcon };
