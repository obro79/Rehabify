"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "default" | "lg";
  fallback?: string;
  className?: string;
  "aria-label"?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  default: "h-10 w-10",
  lg: "h-14 w-14",
};

const iconSizeMap = {
  sm: "h-4 w-4",
  default: "h-5 w-5",
  lg: "h-7 w-7",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt = "Avatar", size = "default", fallback, className, "aria-label": ariaLabel, ...props }, ref) => {
    const [error, setError] = React.useState(false);
    const showFallback = !src || error;

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-full overflow-hidden bg-sage-100 flex items-center justify-center",
          "shadow-pillowy-sm",
          sizeMap[size],
          className
        )}
        role={showFallback ? "img" : undefined}
        aria-label={showFallback ? ariaLabel ?? alt : undefined}
        {...props}
      >
        {src && !error ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            onError={() => setError(true)}
          />
        ) : fallback ? (
          <span className="text-sage-600 font-medium text-sm" aria-hidden="true">
            {fallback.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <User className={cn("text-sage-400", iconSizeMap[size])} aria-hidden="true" />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
