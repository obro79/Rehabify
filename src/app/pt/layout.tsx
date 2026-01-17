"use client";

import { Menu } from "lucide-react";
import { PTSidebarNav } from "@/components/pt/pt-sidebar-nav";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { usePTStore } from "@/stores/pt-store";
import { useRouter } from "next/navigation";

export default function PTLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const patients = usePTStore((state) => state.patients);

  const handlePatientClick = (patientId: string) => {
    router.push(`/pt/clients/${patientId}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <PTSidebarNav
          activeHref="/pt/dashboard"
          patients={patients}
          onPatientClick={handlePatientClick}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-sage-200/40">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger menu - visible below md breakpoint */}
              <div className="md:hidden">
                <MobileNav
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Open navigation menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  }
                />
              </div>
              <Logo size="default" />
            </div>

          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
