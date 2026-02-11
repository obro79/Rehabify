"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeIn } from "@/components/motion";
import { CATEGORIES } from "./constants";

interface CategoryTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  categoryCounts: Record<string, number>;
  children: React.ReactNode;
}

export function CategoryTabs({
  value,
  onValueChange,
  categoryCounts,
  children,
}: CategoryTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <FadeIn delay={0.15}>
        <TabsList className="rounded-full">
          {CATEGORIES.map((category) => (
            <TabsTrigger
              key={category.value}
              value={category.value}
              className="rounded-full data-[state=active]:bg-sage-500 data-[state=active]:text-white"
            >
              {category.label}
              <span className="ml-1.5 text-xs opacity-70">
                ({categoryCounts[category.value] || 0})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </FadeIn>
      {children}
    </Tabs>
  );
}
