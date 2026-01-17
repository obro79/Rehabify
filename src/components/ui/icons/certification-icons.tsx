"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type BaseIconProps,
  ICON_COLORS,
  BASE_SVG_ATTRS,
} from "./shared";

// Extended sizes for certification badges (larger than standard icons)
const CERT_ICON_SIZES = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80,
};

type CertIconSize = keyof typeof CERT_ICON_SIZES;

interface CertIconProps extends Omit<BaseIconProps, 'size'> {
  size?: CertIconSize;
}

// ============================================================================
// NASM Protocol Shield Badge
// ============================================================================

const NASMIcon = React.forwardRef<SVGSVGElement, CertIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const s = `url(#${id}-s)`;

    return (
      <svg
        ref={ref}
        width={CERT_ICON_SIZES[size]}
        height={CERT_ICON_SIZES[size]}
        className={cn("drop-shadow-lg", className)}
        {...BASE_SVG_ATTRS}
        aria-label="NASM Protocol"
        {...props}
      >
        <defs>
          <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
          </filter>
          <filter id={`${id}-ts`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Shield shape */}
        <path
          d="M24 4 L42 12 L42 26 C42 36 32 44 24 46 C16 44 6 36 6 26 L6 12 Z"
          fill={g}
          filter={s}
        />

        {/* Shield inner border */}
        <path
          d="M24 8 L38 14 L38 26 C38 33.5 30 40 24 42 C18 40 10 33.5 10 26 L10 14 Z"
          fill="none"
          stroke="white"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Highlight */}
        <path
          d="M24 4 L6 12 L6 16 L24 8 L26 7 Z"
          fill="white"
          fillOpacity="0.4"
        />

        {/* NASM text - white */}
        <text
          x="24"
          y="24"
          textAnchor="middle"
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          fontSize="9"
          letterSpacing="0.5"
          filter={`url(#${id}-ts)`}
        >
          NASM
        </text>
        <text
          x="24"
          y="34"
          textAnchor="middle"
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
          fontSize="5"
          letterSpacing="0.5"
          opacity="0.95"
        >
          PROTOCOL
        </text>
      </svg>
    );
  }
);
NASMIcon.displayName = "NASMIcon";

// ============================================================================
// CES Methodology Shield Badge
// ============================================================================

const CESIcon = React.forwardRef<SVGSVGElement, CertIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const s = `url(#${id}-s)`;

    return (
      <svg
        ref={ref}
        width={CERT_ICON_SIZES[size]}
        height={CERT_ICON_SIZES[size]}
        className={cn("drop-shadow-lg", className)}
        {...BASE_SVG_ATTRS}
        aria-label="CES Methodology"
        {...props}
      >
        <defs>
          <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
          </filter>
          <filter id={`${id}-ts`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Shield shape */}
        <path
          d="M24 4 L42 12 L42 26 C42 36 32 44 24 46 C16 44 6 36 6 26 L6 12 Z"
          fill={g}
          filter={s}
        />

        {/* Shield inner border */}
        <path
          d="M24 8 L38 14 L38 26 C38 33.5 30 40 24 42 C18 40 10 33.5 10 26 L10 14 Z"
          fill="none"
          stroke="white"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Highlight */}
        <path
          d="M24 4 L6 12 L6 16 L24 8 L26 7 Z"
          fill="white"
          fillOpacity="0.4"
        />

        {/* CES text - white */}
        <text
          x="24"
          y="24"
          textAnchor="middle"
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          fontSize="11"
          letterSpacing="1"
          filter={`url(#${id}-ts)`}
        >
          CES
        </text>
        <text
          x="24"
          y="35"
          textAnchor="middle"
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
          fontSize="4"
          letterSpacing="0.3"
          opacity="0.95"
        >
          METHODOLOGY
        </text>
      </svg>
    );
  }
);
CESIcon.displayName = "CESIcon";

// ============================================================================
// PIPEDA Compliant Shield Badge
// ============================================================================

const PIPEDAIcon = React.forwardRef<SVGSVGElement, CertIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const s = `url(#${id}-s)`;

    return (
      <svg
        ref={ref}
        width={CERT_ICON_SIZES[size]}
        height={CERT_ICON_SIZES[size]}
        className={cn("drop-shadow-lg", className)}
        {...BASE_SVG_ATTRS}
        aria-label="PIPEDA Compliant"
        {...props}
      >
        <defs>
          <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
          </filter>
          <filter id={`${id}-ts`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Shield shape */}
        <path
          d="M24 4 L42 12 L42 26 C42 36 32 44 24 46 C16 44 6 36 6 26 L6 12 Z"
          fill={g}
          filter={s}
        />

        {/* Shield inner border */}
        <path
          d="M24 8 L38 14 L38 26 C38 33.5 30 40 24 42 C18 40 10 33.5 10 26 L10 14 Z"
          fill="none"
          stroke="white"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Highlight */}
        <path
          d="M24 4 L6 12 L6 16 L24 8 L26 7 Z"
          fill="white"
          fillOpacity="0.4"
        />

        {/* Small maple leaf accent - white */}
        <path
          d="M24 12 L25 14 L27 14 L25.5 15.5 L26 17 L24 16 L22 17 L22.5 15.5 L21 14 L23 14 Z"
          fill="white"
          opacity="0.7"
        />

        {/* PIPEDA text - white */}
        <text
          x="24"
          y="27"
          textAnchor="middle"
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          fontSize="7"
          letterSpacing="0.3"
          filter={`url(#${id}-ts)`}
        >
          PIPEDA
        </text>
        <text
          x="24"
          y="36"
          textAnchor="middle"
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
          fontSize="4.5"
          letterSpacing="0.3"
          opacity="0.95"
        >
          COMPLIANT
        </text>
      </svg>
    );
  }
);
PIPEDAIcon.displayName = "PIPEDAIcon";

// ============================================================================
// HITL (Human-in-the-Loop) PT Reviewed Shield Badge
// ============================================================================

const HITLIcon = React.forwardRef<SVGSVGElement, CertIconProps>(
  ({ size = "md", variant = "sage", className, ...props }, ref) => {
    const colors = ICON_COLORS[variant];
    const id = React.useId();
    const g = `url(#${id}-g)`;
    const s = `url(#${id}-s)`;

    return (
      <svg
        ref={ref}
        width={CERT_ICON_SIZES[size]}
        height={CERT_ICON_SIZES[size]}
        className={cn("drop-shadow-lg", className)}
        {...BASE_SVG_ATTRS}
        aria-label="Human-in-the-Loop PT Review"
        {...props}
      >
        <defs>
          <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
          <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
          </filter>
          <filter id={`${id}-ts`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Shield shape */}
        <path
          d="M24 4 L42 12 L42 26 C42 36 32 44 24 46 C16 44 6 36 6 26 L6 12 Z"
          fill={g}
          filter={s}
        />

        {/* Shield inner border */}
        <path
          d="M24 8 L38 14 L38 26 C38 33.5 30 40 24 42 C18 40 10 33.5 10 26 L10 14 Z"
          fill="none"
          stroke="white"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Highlight */}
        <path
          d="M24 4 L6 12 L6 16 L24 8 L26 7 Z"
          fill="white"
          fillOpacity="0.4"
        />

        {/* Person icon accent - head (white) */}
        <circle cx="24" cy="13" r="2.5" fill="white" opacity="0.8" />
        {/* Person icon accent - shoulders (white) */}
        <path
          d="M19 19 Q24 17 29 19"
          stroke="white"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
          strokeLinecap="round"
        />

        {/* HITL text - white */}
        <text
          x="24"
          y="30"
          textAnchor="middle"
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          fontSize="9"
          letterSpacing="0.5"
          filter={`url(#${id}-ts)`}
        >
          HITL
        </text>
        <text
          x="24"
          y="39"
          textAnchor="middle"
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
          fontSize="4"
          letterSpacing="0.3"
          opacity="0.95"
        >
          PT REVIEWED
        </text>
      </svg>
    );
  }
);
HITLIcon.displayName = "HITLIcon";

export { NASMIcon, CESIcon, PIPEDAIcon, HITLIcon };
