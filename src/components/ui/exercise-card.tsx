"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ExerciseCardProps {
  name: string;
  category?: string;
  duration?: string;
  image?: string;
  onClick?: () => void;
  className?: string;
}

// Map category to gradient border accent
const getCategoryGradient = (category: string): string => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("mobility")) {
    return "border-l-4 border-l-transparent bg-gradient-to-r from-sage-400 to-transparent bg-clip-border";
  }
  if (categoryLower.includes("strength")) {
    return "border-l-4 border-l-transparent bg-gradient-to-r from-coral-400 to-transparent bg-clip-border";
  }
  if (categoryLower.includes("stability")) {
    return "border-l-4 border-l-sage-300";
  }
  if (categoryLower.includes("stretch")) {
    return "border-l-4 border-l-sage-400";
  }
  return "";
};

const ExerciseCard = React.forwardRef<HTMLDivElement, ExerciseCardProps>(
  ({ name, category = "Exercise", duration, image, onClick, className }, ref) => {
    const gradientClass = getCategoryGradient(category);

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "surface-pillowy rounded-3xl p-2 pb-3 w-[130px] cursor-pointer relative",
          "hover:scale-[1.02] transition-transform",
          gradientClass,
          className
        )}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Image area - distinct background */}
        <div className="bg-sage-100 rounded-2xl aspect-square mb-2 flex items-center justify-center overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={name}
              width={110}
              height={110}
              className="object-contain"
            />
          ) : (
            <div className="text-sage-300 text-4xl">🏃</div>
          )}
        </div>

        {/* Content - name and category grouped */}
        <div className="px-1">
          <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground">{category}</p>
          {duration && (
            <p className="text-xs text-muted-foreground mt-1">{duration}</p>
          )}
        </div>
      </div>
    );
  }
);
ExerciseCard.displayName = "ExerciseCard";

export { ExerciseCard };
