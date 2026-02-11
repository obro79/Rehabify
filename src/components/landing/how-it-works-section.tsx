"use client";

import * as React from "react";
import { CameraIcon, LibraryIcon, TimerIcon } from "@/components/ui/icons";
import { ScrollReveal } from "@/components/motion";

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  colorScheme: "sage" | "terracotta";
}

const steps: Step[] = [
  {
    number: 1,
    title: "Position Your Camera",
    description:
      "Set up your webcam 2-6 feet away. Any modern browser works - no app needed.",
    icon: <CameraIcon size="sm" variant="sage" />,
    colorScheme: "sage",
  },
  {
    number: 2,
    title: "Start Your Exercise",
    description: "Choose from our library of physio-approved low back exercises.",
    icon: <LibraryIcon size="sm" variant="coral" />,
    colorScheme: "terracotta",
  },
  {
    number: 3,
    title: "Get Real-Time Feedback",
    description:
      "Our AI watches every rep and corrects your form instantly with gentle voice guidance.",
    icon: <TimerIcon size="sm" variant="sage" />,
    colorScheme: "sage",
  },
];

function StepCard({ step }: { step: Step }): React.ReactElement {
  const bgClass =
    step.colorScheme === "sage" ? "bg-sage-100" : "bg-terracotta-100";
  const textClass =
    step.colorScheme === "sage" ? "text-sage-700" : "text-terracotta-700";

  return (
    <ScrollReveal>
      <div className="relative space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 ${bgClass} rounded-xl flex items-center justify-center ${textClass} font-bold text-lg`}
          >
            {step.number}
          </div>
          <div className={`p-2 ${bgClass} rounded-xl`}>{step.icon}</div>
        </div>
        <h3 className="text-xl font-semibold text-sage-900 mb-2">{step.title}</h3>
        <p className="text-sage-600 text-sm leading-relaxed">{step.description}</p>
      </div>
    </ScrollReveal>
  );
}

export function HowItWorksSection(): React.ReactElement {
  return (
    <section
      className="py-24 md:py-32 bg-gradient-to-b from-sage-50/50 to-white relative overflow-hidden"
      id="how-it-works"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-xl mb-16">
            <h2 className="text-section-xl text-sage-900 mb-4">How It Works</h2>
            <p className="text-xl text-sage-600">
              Get started in three simple steps
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
