"use client";

import { cn } from "@/lib/utils";

interface GradientMeshProps {
  /**
   * Color variant for the gradient mesh
   */
  variant?: "sage" | "terracotta" | "mixed";
  /**
   * Intensity of the gradient (0-1, default 0.5)
   */
  intensity?: number;
  /**
   * Position of the gradient mesh
   */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * GradientMesh Component
 *
 * Creates decorative gradient mesh backgrounds using radial and conic gradients.
 * Positioned absolutely behind content with proper z-index layering.
 *
 * @example
 * ```tsx
 * <GradientMesh
 *   variant="sage"
 *   intensity={0.6}
 *   position="top-left"
 * />
 * ```
 */
export function GradientMesh({
  variant = "sage",
  intensity = 0.5,
  position = "center",
  className,
}: GradientMeshProps) {
  // Calculate opacity based on intensity
  const opacity = Math.max(0, Math.min(1, intensity));

  // Position styles
  const getPositionStyles = () => {
    switch (position) {
      case "top-left":
        return {
          top: "-20%",
          left: "-20%",
        };
      case "top-right":
        return {
          top: "-20%",
          right: "-20%",
        };
      case "bottom-left":
        return {
          bottom: "-20%",
          left: "-20%",
        };
      case "bottom-right":
        return {
          bottom: "-20%",
          right: "-20%",
        };
      case "center":
      default:
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
    }
  };

  // Generate gradient based on variant
  const getGradient = () => {
    switch (variant) {
      case "sage":
        return {
          background: `
            radial-gradient(circle at 30% 30%, rgba(168, 185, 160, ${opacity * 0.6}), transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(197, 207, 192, ${opacity * 0.4}), transparent 60%),
            conic-gradient(from 0deg at 50% 50%,
              rgba(240, 244, 238, ${opacity * 0.3}),
              rgba(168, 185, 160, ${opacity * 0.5}),
              rgba(197, 207, 192, ${opacity * 0.4}),
              rgba(240, 244, 238, ${opacity * 0.3})
            )
          `,
        };

      case "terracotta":
        return {
          background: `
            radial-gradient(circle at 30% 30%, rgba(232, 184, 168, ${opacity * 0.6}), transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(245, 212, 200, ${opacity * 0.4}), transparent 60%),
            conic-gradient(from 0deg at 50% 50%,
              rgba(253, 248, 246, ${opacity * 0.3}),
              rgba(232, 184, 168, ${opacity * 0.5}),
              rgba(245, 212, 200, ${opacity * 0.4}),
              rgba(253, 248, 246, ${opacity * 0.3})
            )
          `,
        };

      case "mixed":
        return {
          background: `
            radial-gradient(circle at 20% 30%, rgba(168, 185, 160, ${opacity * 0.5}), transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(232, 184, 168, ${opacity * 0.5}), transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(245, 212, 200, ${opacity * 0.3}), transparent 60%),
            conic-gradient(from 45deg at 50% 50%,
              rgba(240, 244, 238, ${opacity * 0.3}),
              rgba(168, 185, 160, ${opacity * 0.4}),
              rgba(232, 184, 168, ${opacity * 0.4}),
              rgba(197, 207, 192, ${opacity * 0.3}),
              rgba(240, 244, 238, ${opacity * 0.3})
            )
          `,
        };

      default:
        return {
          background: `
            radial-gradient(circle at 30% 30%, rgba(168, 185, 160, ${opacity * 0.6}), transparent 60%)
          `,
        };
    }
  };

  const positionStyles = getPositionStyles();
  const gradientStyles = getGradient();

  return (
    <div
      className={cn(
        "absolute pointer-events-none -z-10",
        "w-[800px] h-[800px]",
        className
      )}
      style={{
        ...positionStyles,
        ...gradientStyles,
        filter: "blur(80px)",
      }}
      aria-hidden="true"
    />
  );
}
