"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface SelectOption {
  value: string;
  label: string;
}

interface FormFieldProps {
  id: string;
  label: string;
  value: string | null | undefined;
  isEditing: boolean;
  onChange: (value: string | null) => void;
  type?: "text" | "date" | "tel" | "select" | "textarea";
  placeholder?: string;
  options?: SelectOption[];
  rows?: number;
  formatDisplay?: (value: string) => string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function capitalizeWords(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function FormField({
  id,
  label,
  value,
  isEditing,
  onChange,
  type = "text",
  placeholder,
  options = [],
  rows = 4,
  formatDisplay,
}: FormFieldProps): React.ReactElement {
  const displayValue = value || "";
  const displayText = (() => {
    if (!value) {
      return type === "textarea" ? "No additional notes" : "Not provided";
    }
    if (formatDisplay) {
      return formatDisplay(value);
    }
    if (type === "date") {
      return formatDate(value);
    }
    if (type === "select") {
      const option = options.find((opt) => opt.value === value);
      return option?.label || capitalizeWords(value);
    }
    return value;
  })();

  if (!isEditing) {
    return (
      <div className="field-stack">
        <Label htmlFor={id}>{label}</Label>
        <p className={`text-sm text-muted-foreground ${type === "textarea" ? "whitespace-pre-wrap" : ""}`}>
          {displayText}
        </p>
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="field-stack">
        <Label htmlFor={id}>{label}</Label>
        <Textarea
          id={id}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
        />
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className="field-stack">
        <Label htmlFor={id}>{label}</Label>
        <Select
          value={displayValue}
          onValueChange={(val) => onChange(val || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="field-stack">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
