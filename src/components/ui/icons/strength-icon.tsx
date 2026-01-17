"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_SIZES,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

const StrengthIcon = React.forwardRef<SVGSVGElement, BaseIconProps>(
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

        {/* Bar */}
        <rect x="14" y="21" width="20" height="6" rx="3" fill={d} filter={s} />

        {/* Weights */}
        {[
          { x: 4, w: 6, h: 24, y: 12, hx: 4, hw: 3 },
          { x: 10, w: 5, h: 16, y: 16, hx: 10, hw: 2.5 },
          { x: 38, w: 6, h: 24, y: 12, hx: 38, hw: 3 },
          { x: 33, w: 5, h: 16, y: 16, hx: 33, hw: 2.5 },
        ].map((w, i) => (
          <React.Fragment key={i}>
            <rect x={w.x} y={w.y} width={w.w} height={w.h} rx="2" fill={g} filter={s} />
            <rect x={w.hx} y={w.y} width={w.hw} height={w.h} rx="2" fill={h} />
          </React.Fragment>
        ))}

        {/* Grip texture */}
        {[18, 21, 24, 27, 30].map(x => (
          <line key={x} x1={x} y1="22" x2={x} y2="26" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
        ))}
      </svg>
    );
  }
);
StrengthIcon.displayName = "StrengthIcon";

export { StrengthIcon };
