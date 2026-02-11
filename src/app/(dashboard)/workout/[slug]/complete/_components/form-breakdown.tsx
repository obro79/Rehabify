"use client";

import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import type { FormBreakdownItem } from "./types";

interface FormBreakdownProps {
  items: FormBreakdownItem[];
}

export function FormBreakdown({ items }: FormBreakdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex flex-1 items-center justify-between mr-2">
          <span className="text-base font-semibold">Form Analysis</span>
          <span className="text-sm text-muted-foreground">
            {isOpen ? "Hide" : "Show"} Details
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {items.map((item, index) => (
            <FormMetricItem key={index} item={item} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FormMetricItem({ item }: { item: FormBreakdownItem }) {
  const color = item.score >= 80 ? "sage" : "coral";

  return (
    <div className="space-y-2 p-4 rounded-xl bg-sage-50/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {item.metric}
        </span>
        <span className="text-sm font-bold text-sage-600">{item.score}%</span>
      </div>
      <Progress value={item.score} size="default" color={color} />
      <div className="text-xs text-muted-foreground">{item.feedback}</div>
    </div>
  );
}
