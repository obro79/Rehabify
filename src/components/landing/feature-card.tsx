"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";

interface FeatureCardProps {
  icon: React.ReactNode;
  iconBgClass: string;
  title: string;
  description: string;
  delay: number;
  cardBgClass?: string;
}

export function FeatureCard({
  icon,
  iconBgClass,
  title,
  description,
  delay,
  cardBgClass = "",
}: FeatureCardProps): React.ReactElement {
  return (
    <FadeIn direction="up" delay={delay}>
      <Card variant="organic" className={`p-6 hover-lift ${cardBgClass}`}>
        <div className="space-y-3">
          <div
            className={`w-12 h-12 ${iconBgClass} rounded-2xl flex items-center justify-center`}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-sage-900 mb-1">{title}</h3>
            <p className="text-sage-600 text-sm leading-relaxed">{description}</p>
          </div>
        </div>
      </Card>
    </FadeIn>
  );
}
