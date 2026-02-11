"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const ClientsIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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

        {/* Two-person group silhouette */}
        <g fill="white" fillOpacity="0.95">
          {/* Front person - head */}
          <circle cx="21" cy="18" r="4.5" />
          {/* Front person - body */}
          <path d="M12 35 C12 27 16 24 21 24 C26 24 30 27 30 35 L12 35 Z" />

          {/* Back person - head (slightly behind and to the right) */}
          <circle cx="30" cy="16" r="3.5" />
          {/* Back person - body (partially hidden) */}
          <path d="M25 35 C25 28 27 25 30 25 C33 25 36 28 36 35 L25 35 Z" />
        </g>

        {/* Detail accents */}
        <g fill={d}>
          {/* Small plus/add indicator */}
          <circle cx="36" cy="13" r="3.5" />
          <rect x="34.75" y="12" width="2.5" height="2" rx="0.5" fill="white" />
          <rect x="35.25" y="11.5" width="1.5" height="3" rx="0.5" fill="white" />
        </g>
      </svg>
    );
  }
);
ClientsIcon.displayName = "ClientsIcon";

export { ClientsIcon };
