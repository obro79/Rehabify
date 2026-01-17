"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/lib/mock-data/pt-data";

export interface StatusBadgeProps {
  status: Plan["status"];
  className?: string;
}

const STATUS_CONFIG = {
  pending_review: {
    variant: "warning" as const,
    label: "Pending Review",
  },
  approved: {
    variant: "success" as const,
    label: "Approved",
  },
  rejected: {
    variant: "error" as const,
    label: "Rejected",
  },
  modified: {
    variant: "info" as const,
    label: "Modified",
  },
} as const;

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className }, ref) => {
    const config = STATUS_CONFIG[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        size="sm"
        className={className}
      >
        {config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = "StatusBadge";
