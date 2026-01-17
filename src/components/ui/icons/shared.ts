import type { SVGAttributes } from "react";

// ============================================================================
// Types
// ============================================================================

export type IconSize = "sm" | "md" | "lg";
export type IconVariant = "sage" | "coral";

export interface BaseIconProps extends SVGAttributes<SVGElement> {
  size?: IconSize;
  variant?: IconVariant;
  title?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

// ============================================================================
// Size Configuration
// ============================================================================

export const ICON_SIZES: Record<IconSize, number> = {
  sm: 24,
  md: 32,
  lg: 48,
};

// ============================================================================
// Color Palettes
// ============================================================================

export interface IconColors {
  light: string;
  dark: string;
  accent: string;
  darker: string;
}

export const ICON_COLORS: Record<IconVariant, IconColors> = {
  sage: {
    light: "#9AAF91",
    dark: "#7A8E72",
    accent: "#5A6C54",
    darker: "#6A7D63",
  },
  coral: {
    light: "#E8998D",
    dark: "#D4776A",
    accent: "#B85C4F",
    darker: "#C4685B",
  },
};

// ============================================================================
// SVG Helpers
// ============================================================================

// Common SVG attributes for all icons
export const BASE_SVG_ATTRS = {
  viewBox: "0 0 48 48",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
} as const;
