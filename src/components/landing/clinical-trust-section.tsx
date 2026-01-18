"use client";

import * as React from "react";
import { ScrollReveal } from "@/components/motion";
import { Tooltip } from "@/components/ui/tooltip-card";
import {
  NASMIcon,
  CESIcon,
  PIPEDAIcon,
  HITLIcon,
} from "@/components/ui/icons";

const credentials = [
  {
    id: "nasm",
    Icon: NASMIcon,
    title: "NASM Protocol",
    description:
      "Exercises sourced from National Academy of Sports Medicine corrective exercise protocols",
    detailedInfo: (
      <div>
        <p className="text-lg font-bold text-sage-900 mb-2">NASM Protocol</p>
        <p className="text-sm text-sage-600 mb-3">
          Our exercise library is built on the National Academy of Sports Medicine's
          Corrective Exercise Continuum (CEx), a systematic approach to addressing
          movement compensations and muscle imbalances.
        </p>
        <p className="text-xs text-sage-500">
          All exercises follow NASM's evidence-based protocols for injury prevention
          and rehabilitation, ensuring safe and effective movement patterns.
        </p>
      </div>
    ),
    variant: "sage" as const,
  },
  {
    id: "ces",
    Icon: CESIcon,
    title: "CES Methodology",
    description:
      "Movement assessments based on Corrective Exercise Specialist program standards",
    detailedInfo: (
      <div>
        <p className="text-lg font-bold text-sage-900 mb-2">CES Methodology</p>
        <p className="text-sm text-sage-600 mb-3">
          Our movement assessments are designed using Corrective Exercise Specialist
          (CES) principles, focusing on identifying and addressing muscle imbalances,
          movement dysfunctions, and postural deviations.
        </p>
        <p className="text-xs text-sage-500">
          This systematic approach helps create personalized exercise programs that
          address root causes rather than just symptoms.
        </p>
      </div>
    ),
    variant: "coral" as const,
  },
  {
    id: "pipeda",
    Icon: PIPEDAIcon,
    title: "PIPEDA Compliant",
    description:
      "Your health data protected under Canadian federal privacy law standards",
    detailedInfo: (
      <div>
        <p className="text-lg font-bold text-sage-900 mb-2">PIPEDA Compliant</p>
        <p className="text-sm text-sage-600 mb-3">
          We comply with the Personal Information Protection and Electronic Documents
          Act (PIPEDA), Canada's federal privacy law. Your health data is processed
          locally in your browser and never leaves your device without your explicit consent.
        </p>
        <p className="text-xs text-sage-500">
          All data transmission is encrypted, and we follow strict data minimization
          principles - we only collect what's necessary for your rehabilitation journey.
        </p>
      </div>
    ),
    variant: "sage" as const,
  },
  {
    id: "hitl",
    Icon: HITLIcon,
    title: "PT Reviewed",
    description:
      "Every AI-generated plan reviewed by a licensed physical therapist before you see it",
    detailedInfo: (
      <div>
        <p className="text-lg font-bold text-sage-900 mb-2">PT Reviewed</p>
        <p className="text-sm text-sage-600 mb-3">
          Every AI-generated rehabilitation plan undergoes review by our Clinical Advisory
          Board of licensed physical therapists. This human-in-the-loop (HITL) approach
          ensures clinical accuracy and safety.
        </p>
        <p className="text-xs text-sage-500">
          Our PTs verify exercise selection, progression, and form cues before any plan
          reaches you, combining AI efficiency with clinical expertise.
        </p>
      </div>
    ),
    variant: "coral" as const,
  },
];

export function ClinicalTrustSection() {
  return (
    <section className="relative py-24 md:py-32 bg-gradient-to-b from-white via-sage-50/30 to-white overflow-hidden">
      {/* Large watermark seal in background */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[700px] opacity-[0.03] pointer-events-none"
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M50 2 L98 20 L98 55 C98 75 80 92 50 98 C20 92 2 75 2 55 L2 20 Z"
            fill="currentColor"
            className="text-sage-900"
          />
        </svg>
      </div>

      {/* Subtle organic accents */}
      <div
        className="absolute top-20 -left-20 w-80 h-80 bg-gradient-to-br from-sage-200/20 to-transparent rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-20 -right-20 w-64 h-64 bg-gradient-to-tl from-terracotta-200/15 to-transparent rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial header with asymmetric layout */}
        <ScrollReveal>
          <div className="max-w-3xl mb-16 md:mb-20">
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-terracotta-500 mb-4">
              Clinical Standards
            </p>
            <h2 className="text-section-xl text-sage-900 mb-6">
              Clinically Validated,
              <span className="block text-sage-600">Professionally Reviewed</span>
            </h2>
            <p className="text-xl text-sage-600 leading-relaxed max-w-2xl">
              Built on established exercise science protocols with human oversight
              at every step. Your rehabilitation backed by real credentials.
            </p>
          </div>
        </ScrollReveal>

        {/* Shield icons with tooltips */}
        <div className="flex items-center justify-center gap-6 md:gap-8 lg:gap-10 max-w-6xl mx-auto">
          {credentials.map((cred) => (
            <ScrollReveal key={cred.id}>
              <Tooltip
                content={cred.detailedInfo}
                containerClassName="cursor-pointer"
                side="top"
              >
                <div className="transform hover:scale-110 transition-transform duration-300">
                  <div className="w-28 h-28 md:w-36 md:h-36 lg:w-44 lg:h-44">
                    <cred.Icon size="xl" variant={cred.variant} className="w-full h-full" />
                  </div>
                </div>
              </Tooltip>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom trust statement */}
        <ScrollReveal>
          <div className="mt-16 text-center">
            <p className="text-sm text-sage-500 max-w-lg mx-auto">
              All exercises reviewed by our Clinical Advisory Board before
              inclusion in the library
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
