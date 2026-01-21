"use client";

import React, { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface IconItem {
  icon: ReactNode;
  label: string;
}

interface IconShowcaseProps {
  title: string;
  icons: IconItem[];
}

export function IconShowcase({ title, icons }: IconShowcaseProps): React.JSX.Element {
  return (
    <div>
      <Label className="mb-3 block">{title}</Label>
      <div className="flex flex-wrap items-end gap-6">
        {icons.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            {item.icon}
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
