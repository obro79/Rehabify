"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Activity, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-6 w-6" />,
  },
  {
    label: "Exercises",
    href: "/exercises",
    icon: <Dumbbell className="h-6 w-6" />,
  },
  {
    label: "Workout",
    href: "/workout",
    icon: <Activity className="h-7 w-7" />,
    isCenter: true,
  },
  {
    label: "Progress",
    href: "/progress",
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    label: "Profile",
    href: "/patient-profile",
    icon: <User className="h-6 w-6" />,
  },
];

export interface BottomNavProps {
  className?: string;
  items?: NavItem[];
}

export function BottomNav({ className, items = navItems }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "nav-bottom",
        "fixed bottom-0 left-0 right-0 z-50",
        "h-16 pb-safe",
        "backdrop-blur-lg bg-white/80",
        "border-t border-sage-200/40",
        "safe-area-inset-bottom",
        className
      )}
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-full px-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const isCenterItem = item.isCenter;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                "min-w-[44px] min-h-[44px]",
                "px-3 py-2 rounded-2xl",
                "transition-all duration-200",
                "touch-manipulation",
                isCenterItem && "scale-110",
                isActive
                  ? "text-sage-700"
                  : "text-muted-foreground hover:text-sage-600"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active state background */}
              {isActive && (
                <span
                  className={cn(
                    "absolute inset-0 rounded-2xl",
                    "bg-gradient-to-b from-sage-100 to-sage-200/80",
                    "shadow-sm",
                    "-z-10"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Icon */}
              <span className={cn("relative z-10", isCenterItem ? "mb-0.5" : "")}>
                {item.icon}
              </span>

              {/* Label */}
              <span className="relative z-10 text-xs font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
