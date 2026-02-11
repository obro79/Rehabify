"use client";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SettingsSection } from "./SettingsSection";
import { SwitchRow } from "./SettingsRow";
import { VERBOSITY_OPTIONS, SPEECH_SPEED_OPTIONS } from "./types";

interface ToggleSettingProps {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string | string[]) => void;
}

function ToggleSetting({
  label,
  description,
  value,
  options,
  onValueChange,
}: ToggleSettingProps): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <ToggleGroup type="single" value={value} onValueChange={onValueChange}>
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

interface VoiceCoachSectionProps {
  verbosity: string;
  speechSpeed: string;
  muteCoach: boolean;
  onVerbosityChange: (value: string | string[]) => void;
  onSpeechSpeedChange: (value: string | string[]) => void;
  onMuteCoachChange: (checked: boolean) => void;
}

export function VoiceCoachSection({
  verbosity,
  speechSpeed,
  muteCoach,
  onVerbosityChange,
  onSpeechSpeedChange,
  onMuteCoachChange,
}: VoiceCoachSectionProps): React.ReactElement {
  return (
    <SettingsSection
      title="Voice Coach Preferences"
      description="Customize how your AI coach communicates with you"
    >
      <div className="space-y-6">
        <ToggleSetting
          label="Verbosity Level"
          description="Control how detailed the coaching feedback is"
          value={verbosity}
          options={VERBOSITY_OPTIONS}
          onValueChange={onVerbosityChange}
        />
        <ToggleSetting
          label="Speech Speed"
          description="Adjust the speed of voice coaching"
          value={speechSpeed}
          options={SPEECH_SPEED_OPTIONS}
          onValueChange={onSpeechSpeedChange}
        />
        <div className="pt-2">
          <SwitchRow
            label="Mute Coach"
            description="Disable all voice coaching during exercises"
            checked={muteCoach}
            onCheckedChange={onMuteCoachChange}
          />
        </div>
      </div>
    </SettingsSection>
  );
}
