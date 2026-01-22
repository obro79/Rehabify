"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  variant?: "default" | "danger";
}

export function SettingsSection({
  title,
  description,
  children,
  variant = "default",
}: SettingsSectionProps): React.ReactElement {
  const isDanger = variant === "danger";

  return (
    <Card
      className={cn(
        "rounded-3xl",
        isDanger && "border-terracotta-300 bg-terracotta-50/50"
      )}
    >
      <CardHeader>
        <CardTitle className={cn(isDanger && "text-terracotta-600")}>
          {title}
        </CardTitle>
        <CardDescription className={cn(isDanger && "text-terracotta-500")}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(isDanger ? "space-y-3" : "space-y-4")}>
        {children}
      </CardContent>
    </Card>
  );
}
