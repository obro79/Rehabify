"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

// Extended colors for camera lens
const LENS_COLORS = {
  sage: { lens: "#4A5A44", lensDark: "#3A4A34" },
  coral: { lens: "#9A4A3E", lensDark: "#7A3A2E" },
} as const;

const CameraIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const lens = LENS_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const h = `url(#${id}-h)`;
    const d = `url(#${id}-d)`;
    const l = `url(#${id}-l)`;
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
          <linearGradient id={`${id}-h`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-d`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.darker} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
          <linearGradient id={`${id}-l`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={lens.lens} />
            <stop offset="50%" stopColor={lens.lensDark} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Body */}
        <path d="M18 12 L20 8 L28 8 L30 12" fill={d} />
        <rect x="6" y="12" width="36" height="28" rx="6" fill={g} filter={s} />
        <rect x="6" y="12" width="18" height="28" rx="6" fill={h} />

        {/* Lens */}
        <circle cx="24" cy="26" r="12" fill={d} filter={s} />
        <circle cx="24" cy="26" r="9" fill={l} />
        <circle cx="24" cy="26" r="6" fill="#2A3A24" />
        <circle cx="21" cy="23" r="2" fill="white" fillOpacity="0.6" />
        <circle cx="26" cy="28" r="1" fill="white" fillOpacity="0.3" />

        {/* Details */}
        <rect x="34" y="16" width="5" height="4" rx="1" fill="white" fillOpacity="0.8" />
        <rect x="9" y="16" width="6" height="4" rx="1" fill={d} />
      </svg>
    );
  }
);
CameraIcon.displayName = "CameraIcon";

export { CameraIcon };
