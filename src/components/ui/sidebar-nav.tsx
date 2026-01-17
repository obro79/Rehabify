"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
}

export interface SidebarNavProps {
  activeHref?: string;
  className?: string;
  items?: NavItem[];
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Exercise", href: "/exercise" },
  { label: "Plans", href: "/plans" },
  { label: "History", href: "/history" },
  { label: "Progress", href: "/progress" },
  { label: "Settings", href: "/settings" },
];

const SidebarNav = React.forwardRef<HTMLElement, SidebarNavProps>(
  ({ activeHref = "/dashboard", className, items = DEFAULT_NAV_ITEMS }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          "sidebar-nav relative flex flex-col gap-1 p-3 rounded-2xl min-w-[140px]",
          className
        )}
      >
        {/* Texture overlay */}
        <div className="sidebar-nav-texture" aria-hidden="true" />

        {/* Nav items */}
        <div className="relative flex flex-col gap-1">
          {items.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive ? "text-foreground" : "text-white/80 hover:text-foreground"
                )}
              >
                {/* Active state */}
                {isActive && <span className="nav-item-active" />}

                {/* Hover state */}
                {!isActive && (
                  <span className="nav-item-hover opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100" />
                )}

                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }
);
SidebarNav.displayName = "SidebarNav";

export { SidebarNav, DEFAULT_NAV_ITEMS as defaultNavItems };
