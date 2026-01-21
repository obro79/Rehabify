"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { LabeledItem } from "./labeled-item";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function BadgeSection(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <LabeledItem label="Default Variants">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Exercises</Badge>
          <Badge variant="active">Weekly</Badge>
          <Badge variant="muted">30 minutes</Badge>
          <Badge variant="outlined">Upper Body</Badge>
        </div>
      </LabeledItem>
      <LabeledItem label="Difficulty Levels">
        <div className="flex flex-wrap items-center gap-3">
          {(["easy", "medium", "hard"] as const).map(d => <Badge key={d} variant={d}>{capitalize(d)}</Badge>)}
        </div>
      </LabeledItem>
      <LabeledItem label="Status Indicators">
        <div className="flex flex-wrap items-center gap-3">
          {(["success", "warning", "error", "info", "coral"] as const).map(v => <Badge key={v} variant={v}>{capitalize(v)}</Badge>)}
        </div>
      </LabeledItem>
      <LabeledItem label="Sizes">
        <div className="flex flex-wrap items-center gap-3">
          <Badge size="sm">Small</Badge>
          <Badge size="default">Default</Badge>
          <Badge size="lg" variant="active">Large</Badge>
        </div>
      </LabeledItem>
    </div>
  );
}
