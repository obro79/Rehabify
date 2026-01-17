"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { PermissionCard } from "./permission-card";
import { TutorialCarousel } from "./tutorial-carousel";
import { ProfileBasicsForm, type ProfileBasicsData } from "./profile-basics-form";

export interface OnboardingWizardProps {
  onComplete: (data: ProfileBasicsData) => void;
}

const TOTAL_STEPS = 5;

const OnboardingWizard = React.forwardRef<HTMLDivElement, OnboardingWizardProps>(
  ({ onComplete }, ref) => {
    const [currentStep, setCurrentStep] = React.useState(1);
    const [profileData, setProfileData] = React.useState<ProfileBasicsData>({
      name: "",
      fitnessLevel: "",
      goals: [],
    });

    // Determine if current step is valid
    const isStepValid = React.useMemo(() => {
      switch (currentStep) {
        case 1: // Welcome
          return true;
        case 2: // Camera permission - handled by PermissionCard auto-advance
        case 3: // Mic permission - handled by PermissionCard auto-advance
        case 4: // Tutorial - handled by TutorialCarousel auto-advance
          return false; // These steps auto-advance, button not needed
        case 5: // Profile basics
          return profileData.name.trim().length > 0;
        default:
          return false;
      }
    }, [currentStep, profileData.name]);

    const handleNext = () => {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      } else if (currentStep === TOTAL_STEPS && isStepValid) {
        onComplete(profileData);
      }
    };

    const handleBack = () => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    };

    const handleCameraGranted = () => {
      setCurrentStep(3); // Advance to mic permission
    };

    const handleCameraSkip = () => {
      setCurrentStep(3); // Advance to mic permission
    };

    const handleMicGranted = () => {
      setCurrentStep(4); // Advance to tutorial
    };

    const handleMicSkip = () => {
      setCurrentStep(4); // Advance to tutorial
    };

    const handleTutorialComplete = () => {
      setCurrentStep(5); // Advance to profile basics
    };

    return (
      <div ref={ref} className="w-full space-y-6">
        {/* Step Indicator - Organic pill shapes with breathing animation */}
        <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div
                key={stepNumber}
                className={cn(
                  "h-3 rounded-full transition-all duration-300",
                  isActive && "w-16 bg-sage-600 animate-sanctuary-breathe",
                  isCompleted && "w-10 bg-sage-400",
                  !isActive && !isCompleted && "w-3 bg-sage-200"
                )}
                aria-label={`Step ${stepNumber} of ${TOTAL_STEPS}${isActive ? " (current)" : ""}${isCompleted ? " (completed)" : ""}`}
              />
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <Card className="surface-organic border-2 border-sage-200/60 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300">
              <CardContent className="p-12 text-center space-y-6">
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-foreground">
                    Welcome to Rehabify
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Let&apos;s get you set up with AI-powered physical therapy coaching. This will only take a minute.
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleNext}
                    className="min-w-[200px]"
                  >
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Camera Permission */}
          {currentStep === 2 && (
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-5 motion-safe:duration-300">
              <PermissionCard
                type="camera"
                onGranted={handleCameraGranted}
                onSkip={handleCameraSkip}
              />
            </div>
          )}

          {/* Step 3: Microphone Permission */}
          {currentStep === 3 && (
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-5 motion-safe:duration-300">
              <PermissionCard
                type="microphone"
                onGranted={handleMicGranted}
                onSkip={handleMicSkip}
              />
            </div>
          )}

          {/* Step 4: Tutorial */}
          {currentStep === 4 && (
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-5 motion-safe:duration-300">
              <TutorialCarousel onComplete={handleTutorialComplete} />
            </div>
          )}

          {/* Step 5: Profile Basics */}
          {currentStep === 5 && (
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-5 motion-safe:duration-300">
              <ProfileBasicsForm
                value={profileData}
                onChange={setProfileData}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={cn(
              "gap-2",
              currentStep === 1 && "invisible"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Continue Button (only shown on steps that need manual advancement) */}
          {currentStep === 5 && (
            <Button
              variant="secondary"
              onClick={handleNext}
              disabled={!isStepValid}
              className="min-w-[140px]"
            >
              Complete Setup
            </Button>
          )}

          {/* Spacer for other steps */}
          {currentStep !== 5 && <div />}
        </div>

        {/* Screen reader announcements */}
        <div className="sr-only" role="status" aria-live="polite">
          Step {currentStep} of {TOTAL_STEPS}
        </div>
      </div>
    );
  }
);

OnboardingWizard.displayName = "OnboardingWizard";

export { OnboardingWizard };
