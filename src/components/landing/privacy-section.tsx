"use client";

import * as React from "react";
import { LockIcon } from "@/components/ui/icons";
import { ScrollReveal } from "@/components/motion";

export function PrivacySection(): React.ReactElement {
  return (
    <section className="section-dark py-20 md:py-28 relative overflow-hidden">
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-5"
        aria-hidden="true"
      >
        <LockIcon size="lg" variant="sage" className="w-96 h-96" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-3xl">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 hidden sm:block">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <LockIcon size="lg" className="text-sage-100" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-section-xl text-white">
                  Your Privacy, Protected
                </h2>
                <p className="text-xl text-sage-200 leading-relaxed">
                  Your webcam feed never leaves your device. All pose analysis happens
                  locally in your browser using WebAssembly. We never see, store, or
                  transmit your video.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
