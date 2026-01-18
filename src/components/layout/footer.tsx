"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <footer
      className={cn(
        "border-t border-sage-200/40 bg-background",
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo and tagline */}
          <div className="space-y-3">
            <Logo size="sm" showText />
            <p className="text-sm text-muted-foreground max-w-xs">
              AI-powered physical therapy coaching with real-time form correction.
            </p>
          </div>

          {/* Footer links */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom section: Copyright */}
        <div className="pt-8 border-t border-sage-200/40">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {currentYear} Rehabify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
