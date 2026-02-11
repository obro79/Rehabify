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
    PlanIcon,
} from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
        label: "My Plan",
        href: "/plan",
        icon: <PlanIcon size="md" variant="sage" />,
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

export interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                "flex flex-col border-r border-sage-200 bg-white/50 backdrop-blur-xl h-screen sticky top-0",
                className
            )}
        >
            <div className="p-6">
                <Link href="/" aria-label="Rehabify home">
                    <Logo size="default" showText />
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-sage-100 text-sage-900 font-semibold"
                                    : "text-sage-600 hover:bg-sage-50 hover:text-sage-900"
                            )}
                        >
                            <span className="relative z-10 transition-transform duration-200 group-hover:scale-110">
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User / Footer Area */}
            <div className="p-4 border-t border-sage-200">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-sage-600 hover:text-coral-600 hover:bg-coral-50"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}
