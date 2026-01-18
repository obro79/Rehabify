"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  DumbbellIcon,
  ProgressIcon,
  ProfileIcon,
} from "@/components/ui/icons";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <HomeIcon size="md" variant="sage" />,
  },
  {
    label: "Exercises",
    href: "/exercises",
    icon: <DumbbellIcon size="md" variant="sage" />,
  },
  {
    label: "Progress",
    href: "/progress",
    icon: <ProgressIcon size="md" variant="sage" />,
  },
  {
    label: "Profile",
    href: "/patient-profile",
    icon: <ProfileIcon size="md" variant="sage" />,
  },
];

export interface FloatingDockProps {
  className?: string;
  items?: NavItem[];
}

export function FloatingDock({
  className,
  items = navItems,
}: FloatingDockProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-40",
        "bg-white/70 backdrop-blur-xl",
        "rounded-3xl",
        "px-4 py-2",
        "shadow-lg shadow-sage-900/10",
        className
      )}
      aria-label="Main navigation"
    >
      <div className="relative flex items-center gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-center",
                "p-3 rounded-2xl",
                "transition-all duration-200",
                "min-h-[48px] min-w-[48px]",
                isActive
                  ? "bg-sage-100 text-sage-700"
                  : "text-sage-500 hover:bg-sage-50 hover:text-sage-700"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              {/* Icon with dock-style scale effect */}
              <span className="relative z-10 transition-transform duration-200 group-hover:scale-125">
                {item.icon}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
