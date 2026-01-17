"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/motion";
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
    variant: "sage" as const,
  },
  {
    id: "ces",
    Icon: CESIcon,
    title: "CES Methodology",
    description:
      "Movement assessments based on Corrective Exercise Specialist program standards",
    variant: "coral" as const,
  },
  {
    id: "pipeda",
    Icon: PIPEDAIcon,
    title: "PIPEDA Compliant",
    description:
      "Your health data protected under Canadian federal privacy law standards",
    variant: "sage" as const,
  },
  {
    id: "hitl",
    Icon: HITLIcon,
    title: "PT Reviewed",
    description:
      "Every AI-generated plan reviewed by a licensed physical therapist before you see it",
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

        {/* Asymmetric 2x2 grid with staggered positioning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {credentials.map((cred, index) => (
            <ScrollReveal key={cred.id}>
              <div
                className={`
                  ${index === 1 ? "md:mt-12" : ""}
                  ${index === 2 ? "md:-mt-6" : ""}
                  ${index === 3 ? "md:mt-6" : ""}
                `}
              >
                <Card
                  variant="organic"
                  className={`
                    group p-8 hover-lift h-full transition-all duration-300
                    ${cred.variant === "coral" ? "bg-gradient-to-br from-white to-terracotta-50/40" : ""}
                  `}
                >
                  <div className="flex items-start gap-6">
                    {/* Shield badge */}
                    <div className="flex-shrink-0 transform group-hover:scale-105 transition-transform duration-300">
                      <cred.Icon size="xl" variant={cred.variant} />
                    </div>

                    {/* Content */}
                    <div className="space-y-2 pt-1">
                      <h3 className="text-lg font-display font-semibold text-sage-900">
                        {cred.title}
                      </h3>
                      <p className="text-sage-600 leading-relaxed">
                        {cred.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
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
