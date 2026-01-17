"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  onNavigate?: (item: BreadcrumbItem, index: number) => void;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, className, showHome = true, onNavigate }, ref) => {
    const allItems = showHome
      ? [{ label: "Home", icon: <Home className="h-4 w-4" /> }, ...items]
      : items;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn(
          "flex items-center gap-1 px-4 py-2 rounded-2xl",
          "bg-white border border-sage-200/60",
          "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
          className
        )}
      >
        <ol className="flex items-center gap-1">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;

            return (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-sage-400 flex-shrink-0" />
                )}
                {isLast ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-sage-700">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onNavigate?.(item, index)}
                    className={cn(
                      "flex items-center gap-1.5 text-sm text-sage-500",
                      "hover:text-sage-700 transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-sage-300 rounded-lg px-1"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);
Breadcrumb.displayName = "Breadcrumb";

export { Breadcrumb };
