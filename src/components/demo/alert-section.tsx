"use client";

import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const ALERTS = [
  { variant: undefined, title: "Information", desc: "This is a default informational alert." },
  { variant: "success" as const, title: "Success!", desc: "Your exercise session was saved successfully." },
  { variant: "warning" as const, title: "Warning", desc: "Your streak is at risk! Exercise today to keep it.", dismissible: true },
  { variant: "error" as const, title: "Error", desc: "Camera access was denied. Please enable it in settings." },
];

export function AlertSection(): React.JSX.Element {
  return (
    <div className="space-y-3 max-w-lg">
      {ALERTS.map(a => (
        <Alert key={a.title} variant={a.variant} dismissible={a.dismissible} onDismiss={a.dismissible ? () => {} : undefined}>
          <AlertTitle>{a.title}</AlertTitle>
          <AlertDescription>{a.desc}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
