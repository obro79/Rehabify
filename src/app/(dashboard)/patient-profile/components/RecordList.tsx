"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

interface RecordItem {
  id: string;
  createdAt?: string;
  date?: string;
  name?: string;
  status?: string;
  completed?: boolean;
  durationSeconds?: number;
}

interface RecordListProps {
  title: string;
  icon: LucideIcon;
  items: RecordItem[] | undefined;
  emptyMessage: string;
  maxItems?: number;
  renderItem: (item: RecordItem) => { title: string; subtitle: string };
  showBorder?: boolean;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RecordList({
  title,
  icon: Icon,
  items = [],
  emptyMessage,
  maxItems = 5,
  renderItem,
  showBorder = true,
}: RecordListProps): React.ReactElement {
  const displayItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;

  return (
    <div className={showBorder ? "border-t pt-6" : ""}>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {title} ({items.length})
      </h3>
      {items.length > 0 ? (
        <div className="space-y-2">
          {displayItems.map((item) => {
            const { title: itemTitle, subtitle } = renderItem(item);
            return (
              <div key={item.id} className="record-item">
                <p className="font-medium text-sm">{itemTitle}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            );
          })}
          {remainingCount > 0 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              +{remainingCount} more
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

export function formatRecordDate(dateString: string | undefined): string {
  return dateString ? formatDate(dateString) : "Unknown date";
}
