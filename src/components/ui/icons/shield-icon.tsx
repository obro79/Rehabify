"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const ShieldIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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

        {/* Shield shape */}
        <path
          d="M24 6 L38 12 L38 24 C38 34 30 42 24 44 C18 42 10 34 10 24 L10 12 Z"
          fill={g}
          filter={s}
        />

        {/* Shield inner border */}
        <path
          d="M24 10 L34 14.5 L34 24 C34 31.5 28 37.5 24 39.5 C20 37.5 14 31.5 14 24 L14 14.5 Z"
          fill="none"
          stroke={colors.darker}
          strokeWidth="1.5"
        />

        {/* Checkmark */}
        <path
          d="M18 24 L22 28 L30 18"
          fill="none"
          stroke={colors.darker}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Highlight */}
        <path
          d="M24 6 L10 12 L10 16 L24 10 L26 9 Z"
          fill="white"
          fillOpacity="0.3"
        />
      </svg>
    );
  }
);
ShieldIcon.displayName = "ShieldIcon";

export { ShieldIcon };
