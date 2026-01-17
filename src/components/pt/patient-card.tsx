"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertBadge } from "./alert-badge";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";
import type { MockPatient } from "@/lib/mock-data/pt-data";

export interface PatientCardProps {
  patient: MockPatient;
  onClick?: (patientId: string) => void;
  className?: string;
}

const formatLastSession = (date: Date | null): string => {
  if (!date) return "No sessions";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

export const PatientCard = React.forwardRef<HTMLDivElement, PatientCardProps>(
  ({ patient, onClick, className }, ref) => {
    const hasAlerts = patient.alerts.length > 0;
    const highSeverityAlert = patient.alerts.find(
      (alert) => alert.severity === "high"
    );
    const displayAlert = highSeverityAlert || patient.alerts[0];

    const handleClick = () => {
      onClick?.(patient.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.(patient.id);
      }
    };

    return (
      <Card
        ref={ref}
        className={cn(
          "surface-organic cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:scale-[1.02]",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${patient.name}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{patient.name}</CardTitle>
            {patient.currentPlan && (
              <StatusBadge status={patient.currentPlan.status} />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last session:</span>
            <span className="font-medium">
              {formatLastSession(patient.lastSession)}
            </span>
          </div>

          {patient.currentPlan && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current plan:</span>
              <span className="font-medium truncate ml-2" title={patient.currentPlan.name}>
                {patient.currentPlan.name}
              </span>
            </div>
          )}

          {hasAlerts && displayAlert && (
            <div className="pt-2 border-t border-sage-200">
              <div className="flex items-center gap-2">
                <AlertBadge
                  type={displayAlert.type}
                  severity={displayAlert.severity}
                  count={patient.alerts.length}
                />
                <span className="text-xs text-muted-foreground truncate">
                  {displayAlert.message}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

PatientCard.displayName = "PatientCard";
