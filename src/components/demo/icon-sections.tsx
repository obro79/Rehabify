"use client";

import React from "react";
import {
  CalendarIcon,
  SpineIcon,
  PoseIcon,
  MicrophoneIcon,
  TrophyIcon,
  CameraIcon,
  TimerIcon,
  MobilityIcon,
  StabilityIcon,
  StrengthIcon,
  StretchIcon,
} from "@/components/ui/icons";
import { IconShowcase } from "./icon-showcase";

const CORE_ICONS = ["Calendar", "Spine", "Pose", "Microphone", "Trophy", "Camera", "Timer"] as const;
const CATEGORY_ICONS = ["Mobility", "Stability", "Strength", "Stretch"] as const;

const ICON_COMPONENTS = {
  Calendar: CalendarIcon,
  Spine: SpineIcon,
  Pose: PoseIcon,
  Microphone: MicrophoneIcon,
  Trophy: TrophyIcon,
  Camera: CameraIcon,
  Timer: TimerIcon,
  Mobility: MobilityIcon,
  Stability: StabilityIcon,
  Strength: StrengthIcon,
  Stretch: StretchIcon,
};

function buildIconList(names: readonly string[], variant?: "coral"): { icon: React.ReactNode; label: string }[] {
  return names.map(name => {
    const Component = ICON_COMPONENTS[name as keyof typeof ICON_COMPONENTS];
    return { icon: <Component size="lg" variant={variant} />, label: name };
  });
}

export function IconSections(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <IconShowcase title="Core App Icons (Sage)" icons={buildIconList(CORE_ICONS)} />
      <IconShowcase title="Core App Icons (Coral)" icons={buildIconList(CORE_ICONS, "coral")} />
      <IconShowcase title="Exercise Category Icons (Sage)" icons={buildIconList(CATEGORY_ICONS)} />
      <IconShowcase title="Exercise Category Icons (Coral)" icons={buildIconList(CATEGORY_ICONS, "coral")} />
      <IconShowcase
        title="Icon Sizes"
        icons={[
          { icon: <SpineIcon size="sm" />, label: "sm (24px)" },
          { icon: <SpineIcon size="md" />, label: "md (32px)" },
          { icon: <SpineIcon size="lg" />, label: "lg (48px)" },
        ]}
      />
    </div>
  );
}
