"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const UsersIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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

        {/* Back Person - Head */}
        <circle cx="32" cy="14" r="6" fill={d} filter={s} />
        <ellipse cx="30" cy="13" rx="2" ry="2.5" fill={h} />

        {/* Back Person - Body */}
        <path
          d="M24 42 C24 32, 26 26, 32 26 C38 26, 40 32, 40 42 L24 42 Z"
          fill={d}
          filter={s}
        />
        <path
          d="M24 42 C24 32, 26 26, 32 26 C32 26, 28 32, 28 42 L24 42 Z"
          fill={h}
        />

        {/* Front Person - Head */}
        <circle cx="18" cy="16" r="7" fill={g} filter={s} />
        <ellipse cx="16" cy="15" rx="2.5" ry="3" fill={h} />

        {/* Front Person - Body */}
        <path
          d="M8 44 C8 32, 11 24, 18 24 C25 24, 28 32, 28 44 L8 44 Z"
          fill={g}
          filter={s}
        />
        <path
          d="M8 44 C8 32, 11 24, 18 24 C18 24, 13 32, 13 44 L8 44 Z"
          fill={h}
        />
      </svg>
    );
  }
);
UsersIcon.displayName = "UsersIcon";

export { UsersIcon };
