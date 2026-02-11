"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SearchBar } from "@/components/ui/search-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar - visible on desktop (>= 1024px) */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar className="w-64" />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - customized to remove Logo on desktop since it's in sidebar */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-sage-100 lg:border-none">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <div className="flex items-center gap-3 lg:hidden">
              <Link href="/" aria-label="Rehabify home">
                <Logo size="default" />
              </Link>
            </div>

            {/* Spacer for desktop alignment if needed, or just SearchBar */}
            <div className="hidden lg:block" />

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
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - visible on mobile (< 1024px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}
