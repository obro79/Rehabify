"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import {
  HomeIcon,
  DumbbellIcon,
  ActivityIcon,
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
    label: "Workout",
    href: "/workout",
    icon: <ActivityIcon size="md" variant="sage" />,
  },
  {
    label: "Progress",
    href: "/progress",
    icon: <ProgressIcon size="md" variant="sage" />,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: <ProfileIcon size="md" variant="sage" />,
  },
];

export interface FloatingSidebarProps {
  className?: string;
  items?: NavItem[];
}

export function FloatingSidebar({
  className,
  items = navItems,
}: FloatingSidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed left-4 top-1/2 -translate-y-1/2 z-40",
        "rounded-2xl",
        "w-[72px]",
        "py-4 px-2",
        className
      )}
      style={{
        background: "linear-gradient(145deg, var(--sage-light) 0%, var(--sage-600) 100%)",
        boxShadow: `
          0 8px 24px rgba(90, 108, 84, 0.35),
          0 4px 12px rgba(0, 0, 0, 0.1),
          inset 0 2px 0 rgba(255, 255, 255, 0.25),
          inset 0 -3px 8px rgba(0, 0, 0, 0.15)
        `,
      }}
      aria-label="Main navigation"
    >
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Tooltip key={item.href} content={item.label} side="right" delayMs={100}>
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center justify-center",
                  "p-2 rounded-xl",
                  "transition-all duration-200",
                  "min-h-[52px] min-w-[52px]"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {/* Active state - white pillowy button */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: "linear-gradient(145deg, #ffffff 0%, var(--sage-50) 100%)",
                      boxShadow: `
                        0 4px 12px rgba(0, 0, 0, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.9),
                        inset 0 -2px 6px rgba(0, 0, 0, 0.08)
                      `,
                    }}
                    aria-hidden="true"
                  />
                )}

                {/* Hover state - semi-transparent white */}
                {!isActive && (
                  <span
                    className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/15 transition-colors duration-200"
                    aria-hidden="true"
                  />
                )}

                {/* Icon */}
                <span className="relative z-10">{item.icon}</span>
              </Link>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
}
