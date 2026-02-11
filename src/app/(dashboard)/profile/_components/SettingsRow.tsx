"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsRowProps {
  label: string;
  description: string;
  variant?: "default" | "danger";
}

interface SwitchRowProps extends SettingsRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

interface ActionRowProps extends SettingsRowProps {
  actionLabel: string;
  actionVariant?: "primary" | "ghost" | "destructive";
  onAction: () => void;
}

export function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
  variant = "default",
}: SwitchRowProps): React.ReactElement {
  const isDanger = variant === "danger";

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className={cn(isDanger && "text-terracotta-600")}>{label}</Label>
        <p className={cn("text-xs", isDanger ? "text-terracotta-500" : "text-muted-foreground")}>
          {description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function ActionRow({
  label,
  description,
  actionLabel,
  actionVariant = "primary",
  onAction,
  variant = "default",
}: ActionRowProps): React.ReactElement {
  const isDanger = variant === "danger";

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className={cn(isDanger && "text-terracotta-600")}>{label}</Label>
        <p className={cn("text-xs", isDanger ? "text-terracotta-500" : "text-muted-foreground")}>
          {description}
        </p>
      </div>
      <Button
        onClick={onAction}
        variant={actionVariant}
        className={cn(
          isDanger && actionVariant === "destructive" && "bg-terracotta-500 hover:bg-terracotta-600"
        )}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
