"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SearchBar } from "@/components/ui/search-bar";
import { FloatingDock } from "@/components/layout/floating-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Floating Dock - visible on desktop (>= 1024px) */}
      <div className="hidden lg:block">
        <FloatingDock />
      </div>

      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="Rehabify home">
                <Logo size="default" />
              </Link>
            </div>

            {/* Search bar - collapsible icon on mobile, full bar on desktop */}
            <SearchBar
              collapsible
              placeholder="Search exercises..."
              avatarFallback="SF"
              hasNotification={true}
              className="sm:w-64 md:w-96"
            />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 pb-20 lg:pb-24">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - visible on mobile (< 1024px) */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
