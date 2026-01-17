"use client";

import { useRouter } from "next/navigation";
import { BodyRegionCard } from "@/components/assessment/body-region-card";
import { SpineIcon } from "@/components/ui/icons/spine-icon";
import { KneeIcon } from "@/components/ui/icons/knee-icon";
import { AnkleIcon } from "@/components/ui/icons/ankle-icon";
import { ShoulderIcon } from "@/components/ui/icons/shoulder-icon";
import type { BodyRegion } from "@/lib/exercises/types";

const bodyRegions = [
  {
    region: "lower_back" as BodyRegion,
    title: "Lower Back",
    description: "Most common, lumbar focus",
    icon: <SpineIcon size="lg" variant="sage" />,
  },
  {
    region: "knee" as BodyRegion,
    title: "Knee",
    description: "Joint mobility and stability",
    icon: <KneeIcon size="lg" variant="sage" />,
  },
  {
    region: "ankle" as BodyRegion,
    title: "Ankle",
    description: "Balance and mobility",
    icon: <AnkleIcon size="lg" variant="sage" />,
  },
  {
    region: "shoulder" as BodyRegion,
    title: "Shoulder",
    description: "Upper body mobility",
    icon: <ShoulderIcon size="lg" variant="sage" />,
  },
];

export default function AssessmentPage() {
  const router = useRouter();

  const handleRegionSelect = (region: BodyRegion) => {
    router.push(`/workout/assessment?region=${region}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-sage-100/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Select Your Focus Area
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            We&apos;ll start with a quick voice assessment to understand your needs better.
            Select the body region you&apos;d like to focus on.
          </p>
        </div>

        {/* Body Region Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {bodyRegions.map((bodyRegion) => (
            <BodyRegionCard
              key={bodyRegion.region}
              region={bodyRegion.region}
              icon={bodyRegion.icon}
              title={bodyRegion.title}
              description={bodyRegion.description}
              onSelect={handleRegionSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
