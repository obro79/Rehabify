"use client";

import React, { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

interface DemoSectionProps {
  title: string;
  children: ReactNode;
  showSeparator?: boolean;
}

export function DemoSection({
  title,
  children,
  showSeparator = true,
}: DemoSectionProps): React.JSX.Element {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
      </section>
      {showSeparator && <Separator />}
    </>
  );
}
