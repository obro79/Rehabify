"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { clientEnv } from "@/lib/env";

export interface HeaderProps {
  showCTA?: boolean;
  className?: string;
}

export function Header({ showCTA = true, className }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const isDemoMode = clientEnv.NEXT_PUBLIC_DEMO_MODE;

  const navLinks = [
    { label: "Exercises", href: "/exercises" },
    { label: "How It Works", href: "#how-it-works" },
  ];

  // In demo mode, link directly to dashboard
  const signupHref = isDemoMode ? "/dashboard" : "/signup";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Logo size="sm" showText />
        </Link>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {showCTA && (
            <Button variant="secondary" size="sm" asChild>
              <Link href={signupHref}>Get Started</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-6 mt-6">
              {/* Mobile CTA Buttons */}
              <div className="flex flex-col gap-3">
                {showCTA && (
                  <Button variant="secondary" asChild>
                    <Link href={signupHref} onClick={() => setOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
