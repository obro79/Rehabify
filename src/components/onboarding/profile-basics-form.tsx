"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export interface ProfileBasicsData {
  name: string;
  fitnessLevel: string;
  goals: string[];
}

export interface ProfileBasicsFormProps {
  value: ProfileBasicsData;
  onChange: (data: ProfileBasicsData) => void;
}

const FITNESS_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const GOALS = [
  { value: "pain_relief", label: "Pain Relief" },
  { value: "mobility", label: "Mobility" },
  { value: "strength", label: "Strength" },
  { value: "prevention", label: "Prevention" },
  { value: "post_surgery", label: "Post-Surgery Recovery" },
];

const ProfileBasicsForm = React.forwardRef<HTMLDivElement, ProfileBasicsFormProps>(
  ({ value, onChange }, ref) => {
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, name: e.target.value });
    };

    const handleFitnessLevelChange = (level: string) => {
      onChange({ ...value, fitnessLevel: level });
    };

    const handleGoalToggle = (goalValue: string, checked: boolean) => {
      const updatedGoals = checked
        ? [...value.goals, goalValue]
        : value.goals.filter(g => g !== goalValue);

      onChange({ ...value, goals: updatedGoals });
    };

    return (
      <Card ref={ref} className="surface-organic border-2 border-sage-200/60">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold text-foreground">
                Tell Us About Yourself
              </h3>
              <p className="text-sm text-muted-foreground">
                Help us personalize your experience
              </p>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" required>
                Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={value.name}
                onChange={handleNameChange}
                aria-required="true"
                autoComplete="name"
                autoFocus
              />
            </div>

            {/* Fitness Level Select */}
            <div className="space-y-2">
              <Label htmlFor="fitness-level">
                Fitness Level
              </Label>
              <Select
                value={value.fitnessLevel}
                onValueChange={handleFitnessLevelChange}
              >
                <SelectTrigger
                  id="fitness-level"
                  className="h-11"
                  placeholder="Select your fitness level"
                >
                  <SelectValue placeholder="Select your fitness level" />
                </SelectTrigger>
                <SelectContent>
                  {FITNESS_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Goals Multi-Select */}
            <div className="space-y-3">
              <Label>
                Goals (select all that apply)
              </Label>
              <div className="space-y-3">
                {GOALS.map((goal) => {
                  const isChecked = value.goals.includes(goal.value);

                  return (
                    <div
                      key={goal.value}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={`goal-${goal.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleGoalToggle(goal.value, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`goal-${goal.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {goal.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ProfileBasicsForm.displayName = "ProfileBasicsForm";

export { ProfileBasicsForm };
