"use client";

import React, { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface LabeledItemProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function LabeledItem({
  label,
  children,
  className = "",
}: LabeledItemProps): React.JSX.Element {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
