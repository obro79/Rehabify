"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, Menu, Heart, Bell, X } from "lucide-react";
import { Avatar } from "./avatar";

export interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showActions?: boolean;
  avatarSrc?: string;
  avatarFallback?: string;
  hasNotification?: boolean;
  onSearch?: (value: string) => void;
  collapsible?: boolean;
}

const SearchBar = React.forwardRef<HTMLDivElement, SearchBarProps>(
  (
    {
      placeholder = "Search...",
      className,
      showActions = true,
      avatarSrc,
      avatarFallback,
      hasNotification = true,
      onSearch,
      collapsible = false,
    },
    ref
  ) => {
    const [value, setValue] = React.useState("");
    const [isExpanded, setIsExpanded] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      onSearch?.(e.target.value);
    };

    const handleExpand = () => {
      setIsExpanded(true);
      // Focus the input after expansion
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };

    const handleCollapse = () => {
      setIsExpanded(false);
      setValue("");
      onSearch?.("");
    };

    // Mobile collapsed state - only show search icon
    if (collapsible && !isExpanded) {
      return (
        <button
          type="button"
          onClick={handleExpand}
          className={cn(
            "sm:hidden",
            "p-2.5 rounded-full",
            "bg-white",
            "border border-sage-200/60",
            "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
            "hover:bg-sage-50 transition-colors",
            "text-muted-foreground hover:text-foreground",
            className
          )}
          aria-label="Open search"
        >
          <Search className="h-5 w-5" />
        </button>
      );
    }

    // Expanded state (mobile) or default state (desktop)
    return (
      <>
        {/* Backdrop for mobile expanded state */}
        {collapsible && isExpanded && (
          <div
            className="sm:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={handleCollapse}
          />
        )}

        {/* Search Bar */}
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-3 px-5 py-2.5 rounded-2xl",
            "bg-white",
            "border border-sage-200/60",
            "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
            // Mobile expanded state positioning
            collapsible && isExpanded && [
              "sm:hidden",
              "fixed top-4 left-4 right-4 z-50",
              "animate-in slide-in-from-top-2 duration-200",
            ],
            // Desktop state
            collapsible && "hidden sm:flex",
            className
          )}
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={handleChange}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>

          {/* Close button for mobile expanded state */}
          {collapsible && isExpanded && (
            <button
              type="button"
              onClick={handleCollapse}
              className="sm:hidden p-1.5 rounded-full hover:bg-sage-100 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Action Icons - hidden on mobile when expanded and collapsible */}
          {showActions && !(collapsible && isExpanded) && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-sage-100 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-sage-100 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Heart className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-sage-100 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
              </button>

              {/* Avatar with notification dot */}
              <div className="relative ml-1">
                <Avatar size="sm" src={avatarSrc} fallback={avatarFallback} />
                {hasNotification && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-coral-400 border-2 border-white" />
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
