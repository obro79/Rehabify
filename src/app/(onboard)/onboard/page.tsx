"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import type { ProfileBasicsData } from "@/components/onboarding/profile-basics-form";

export default function OnboardPage() {
  const router = useRouter();

  const handleComplete = (data: ProfileBasicsData) => {
    // Log the profile data (in production, this would save to database)
    console.log("Onboarding completed with data:", data);

    // TODO: Replace with server-side session storage
    // Security note: localStorage should not be used for sensitive user data
    // This is a temporary implementation for development only
    if (typeof window !== "undefined") {
      localStorage.setItem("userProfile", JSON.stringify(data));
      localStorage.setItem("onboardingCompleted", "true");
    }

    // Redirect to assessment page
    router.push("/assessment");
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}
