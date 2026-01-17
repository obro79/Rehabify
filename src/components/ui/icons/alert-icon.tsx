"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const AlertIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "coral", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const h = `url(#${id}-h)`;
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
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Triangle body */}
        <path
          d="M24 6 L42 40 C43 42, 42 44, 40 44 L8 44 C6 44, 5 42, 6 40 L24 6 Z"
          fill={g}
          filter={s}
        />

        {/* Highlight on left side */}
        <path
          d="M24 6 L24 6 L14 30 L8 44 C6 44, 5 42, 6 40 L24 6 Z"
          fill={h}
        />

        {/* Exclamation mark - stem */}
        <rect x="21" y="16" width="6" height="14" rx="3" fill="white" fillOpacity="0.95" />

        {/* Exclamation mark - dot */}
        <circle cx="24" cy="37" r="3" fill="white" fillOpacity="0.95" />
      </svg>
    );
  }
);
AlertIcon.displayName = "AlertIcon";

export { AlertIcon };
