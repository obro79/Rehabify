"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, Users } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import type { MockPatient } from "@/lib/mock-data/pt-data";

export interface PTNavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface PTSidebarNavProps {
  activeHref?: string;
  className?: string;
  patients?: MockPatient[];
  onPatientClick?: (patientId: string) => void;
}

const DEFAULT_NAV_ITEMS: PTNavItem[] = [
  { label: "Dashboard", href: "/pt/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/pt/clients", icon: Users },
];

export const PTSidebarNav = React.forwardRef<HTMLElement, PTSidebarNavProps>(
  ({ activeHref = "/pt/dashboard", className, patients = [], onPatientClick }, ref) => {
    const [isClientsExpanded, setIsClientsExpanded] = React.useState(true);

    return (
      <nav
        ref={ref}
        className={cn(
          "flex flex-col gap-6 p-6 bg-white border-r border-sage-200 min-w-[260px] h-full",
          "lg:block hidden",
          className
        )}
        aria-label="PT Navigation"
      >
        {/* Logo */}
        <div className="pb-4 border-b border-sage-200">
          <Link href="/pt/dashboard" className="block">
            <Logo size="default" />
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="flex flex-col gap-1">
          {DEFAULT_NAV_ITEMS.map((item) => {
            const isActive = activeHref === item.href;
            const Icon = item.icon;
            const isClientsItem = item.label === "Clients";

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sage-100 text-sage-900"
                      : "text-sage-700 hover:bg-sage-50 hover:text-sage-900"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                  <span className="flex-1">{item.label}</span>
                  {isClientsItem && patients.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsClientsExpanded(!isClientsExpanded);
                      }}
                      className="p-1 hover:bg-sage-200 rounded transition-colors"
                      aria-label={
                        isClientsExpanded ? "Collapse clients" : "Expand clients"
                      }
                      aria-expanded={isClientsExpanded}
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isClientsExpanded && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </Link>

                {/* Nested Client List */}
                {isClientsItem && isClientsExpanded && patients.length > 0 && (
                  <div className="ml-4 mt-1 space-y-0.5" role="group" aria-label="Client list">
                    {patients.slice(0, 10).map((patient) => {
                      const patientHref = `/pt/clients/${patient.id}`;
                      const isPatientActive = activeHref === patientHref;
                      const hasAlerts = patient.alerts.length > 0;

                      return (
                        <button
                          key={patient.id}
                          onClick={() => onPatientClick?.(patient.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 text-left",
                            isPatientActive
                              ? "bg-sage-50 text-sage-900 font-medium"
                              : "text-sage-600 hover:bg-sage-50 hover:text-sage-900"
                          )}
                          aria-current={isPatientActive ? "page" : undefined}
                        >
                          <span className="flex-1 truncate">{patient.name}</span>
                          {hasAlerts && (
                            <span
                              className="flex-shrink-0 h-2 w-2 rounded-full bg-error"
                              aria-label={`${patient.alerts.length} alert${
                                patient.alerts.length > 1 ? "s" : ""
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                    {patients.length > 10 && (
                      <Link
                        href="/pt/clients"
                        className="block px-4 py-2 text-xs text-sage-500 hover:text-sage-700 transition-colors"
                      >
                        View all {patients.length} clients →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    );
  }
);

PTSidebarNav.displayName = "PTSidebarNav";
