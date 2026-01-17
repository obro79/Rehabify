"use client";

import { cn } from "@/lib/utils";

interface OrganicBlobProps {
  /**
   * Size of the blob in pixels
   */
  size?: number;
  /**
   * Color variant for the blob
   */
  color?: "sage" | "terracotta" | "mixed";
  /**
   * Position of the blob (CSS positioning values)
   */
  position?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  /**
   * Whether to animate the blob (breathing + float)
   */
  animate?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Shape variant (0-3)
   */
  variant?: 0 | 1 | 2 | 3;
}

/**
 * OrganicBlob Component
 *
 * Generates soft SVG blob shapes with bezier curves for decorative backgrounds.
 * Supports breathing and float animations, with 4 different shape variants.
 *
 * @example
 * ```tsx
 * <OrganicBlob
 *   size={300}
 *   color="sage"
 *   position={{ top: "10%", left: "5%" }}
 *   animate={true}
 * />
 * ```
 */
export function OrganicBlob({
  size = 200,
  color = "sage",
  position = {},
  animate = true,
  className,
  variant = 0,
}: OrganicBlobProps) {
  // Generate color based on variant
  const getColor = () => {
    switch (color) {
      case "sage":
        return "rgba(168, 185, 160, 0.4)"; // sage-300 with opacity
      case "terracotta":
        return "rgba(232, 184, 168, 0.4)"; // terracotta-300 with opacity
      case "mixed":
        return "rgba(200, 180, 160, 0.4)"; // blend
      default:
        return "rgba(168, 185, 160, 0.4)";
    }
  };

  // Define 4 different blob shapes using SVG paths
  const getBlobPath = () => {
    const paths = [
      // Variant 0: Round organic blob
      "M30,-35.2C39.6,-30.1,48.5,-21.4,52.1,-10.6C55.7,0.2,54,13.1,48.3,23.8C42.6,34.5,32.9,42.9,21.8,47.9C10.7,52.9,-1.8,54.5,-13.5,51.8C-25.2,49.1,-36.1,42.1,-43.3,32.2C-50.5,22.3,-54,9.5,-53.1,-2.9C-52.2,-15.3,-46.9,-27.3,-38.4,-32.2C-29.9,-37.1,-18.2,-34.9,-7.3,-35.8C3.6,-36.7,20.4,-40.3,30,-35.2Z",

      // Variant 1: Elongated blob
      "M35.2,-45.8C44.8,-36.4,50.6,-23.9,52.3,-11.1C54,1.7,51.6,14.8,45.6,26.3C39.6,37.8,30,47.7,18.5,51.9C7,56.1,-6.4,54.6,-18.7,50.1C-31,45.6,-42.2,38.1,-48.7,27.3C-55.2,16.5,-57,2.4,-54.1,-10.5C-51.2,-23.4,-43.6,-35.1,-33.2,-44.3C-22.8,-53.5,-9.6,-60.2,2.3,-63C14.2,-65.8,25.6,-55.2,35.2,-45.8Z",

      // Variant 2: Irregular organic shape
      "M38.7,-50.3C48.7,-42.1,54.3,-28.4,56.8,-14.3C59.3,-0.2,58.7,14.3,53.2,27.1C47.7,39.9,37.3,51,24.8,56.3C12.3,61.6,-2.3,61.1,-16.1,57.1C-29.9,53.1,-42.9,45.6,-50.5,34.3C-58.1,23,-60.3,7.9,-58.2,-6.3C-56.1,-20.5,-49.7,-33.8,-40.1,-41.7C-30.5,-49.6,-17.7,-52.1,-3.9,-47.4C9.9,-42.7,28.7,-58.5,38.7,-50.3Z",

      // Variant 3: Soft rounded blob
      "M33.5,-41.2C42.6,-33.8,48.4,-22.3,50.9,-10.1C53.4,2.1,52.6,15,47.3,26.2C42,37.4,32.2,47,20.4,51.8C8.6,56.6,-5.2,56.6,-17.9,52.5C-30.6,48.4,-42.2,40.2,-48.5,29.1C-54.8,18,-55.8,4,-52.5,-8.7C-49.2,-21.4,-41.6,-32.8,-31.8,-40C-22,-47.2,-10,-50.2,1.5,-52C13,-53.8,24.4,-48.6,33.5,-41.2Z",
    ];

    return paths[variant];
  };

  const positionStyles = {
    top: position.top,
    bottom: position.bottom,
    left: position.left,
    right: position.right,
  };

  return (
    <div
      className={cn(
        "sanctuary-blob",
        animate && "animate-sanctuary-breathe animate-blob-float",
        className
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        ...positionStyles,
      }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="-60 -60 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(0,0)">
          <path
            d={getBlobPath()}
            fill={getColor()}
            style={{
              filter: "blur(20px)",
            }}
          />
        </g>
      </svg>
    </div>
  );
}
