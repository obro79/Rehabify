"use client";

import * as React from "react";
import { AlertTriangle, Activity, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Alert } from "@/lib/mock-data/pt-data";

export interface AlertBadgeProps {
  type: Alert["type"];
  severity: Alert["severity"];
  count?: number;
  className?: string;
}

const ALERT_CONFIG = {
  missed_session: {
    icon: AlertTriangle,
    label: "Missed Session",
  },
  pain_report: {
    icon: Activity,
    label: "Pain Report",
  },
  declining_form: {
    icon: TrendingDown,
    label: "Declining Form",
  },
} as const;

const SEVERITY_VARIANT = {
  high: "error",
  medium: "warning",
  low: "info",
} as const;

export const AlertBadge = React.forwardRef<HTMLSpanElement, AlertBadgeProps>(
  ({ type, severity, count, className }, ref) => {
    const config = ALERT_CONFIG[type];
    const Icon = config.icon;
    const variant = SEVERITY_VARIANT[severity];
    const displayCount = count !== undefined && count > 1;

    const ariaLabel = `${config.label} alert, ${severity} severity${
      displayCount ? `, ${count} alerts` : ""
    }`;

    return (
      <Badge
        ref={ref}
        variant={variant}
        size="sm"
        className={cn("gap-1", className)}
        aria-label={ariaLabel}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        <span className="sr-only">{config.label}</span>
        {displayCount && <span aria-hidden="true">{count}</span>}
      </Badge>
    );
  }
);

AlertBadge.displayName = "AlertBadge";
