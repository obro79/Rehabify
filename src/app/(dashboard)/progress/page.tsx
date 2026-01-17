"use client";

import * as React from "react";
import { FormScoreChart } from "@/components/progress/form-score-chart";
import { ActivityHeatmap } from "@/components/progress/activity-heatmap";
import { ExerciseBreakdownChart } from "@/components/progress/exercise-breakdown-chart";
import { SessionFrequencyChart } from "@/components/progress/session-frequency-chart";
import { PersonalRecordsSection } from "@/components/progress/personal-records";
import { FadeIn, ScrollReveal, StaggerContainer, StaggerItem } from "@/components/motion";

export default function ProgressPage() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 relative">
      {/* Subtle organic background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-radial from-sage-100/30 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-radial from-terracotta-100/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Page Header */}
      <FadeIn direction="up">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
          <p className="text-muted-foreground">
            Track your improvement and stay motivated with detailed analytics
          </p>
        </div>
      </FadeIn>

      {/* Personal Records Section */}
      <FadeIn delay={0.1}>
        <section aria-labelledby="personal-records-heading">
          <h2 id="personal-records-heading" className="sr-only">
            Personal Records
          </h2>
          <PersonalRecordsSection />
        </section>
      </FadeIn>

      {/* Form Score Trend Section */}
      <ScrollReveal>
        <section aria-labelledby="form-score-heading">
          <h2 id="form-score-heading" className="sr-only">
            Form Score Trend
          </h2>
          <FormScoreChart />
        </section>
      </ScrollReveal>

      {/* Two-column layout for desktop */}
      <StaggerContainer className="grid gap-6 lg:grid-cols-2">
        {/* Activity Heatmap Section */}
        <StaggerItem className="lg:col-span-2">
          <ScrollReveal>
            <section aria-labelledby="activity-heatmap-heading">
              <h2 id="activity-heatmap-heading" className="sr-only">
                Activity Heatmap
              </h2>
              <ActivityHeatmap />
            </section>
          </ScrollReveal>
        </StaggerItem>

        {/* Exercise Breakdown Section */}
        <StaggerItem>
          <ScrollReveal>
            <section aria-labelledby="exercise-breakdown-heading">
              <h2 id="exercise-breakdown-heading" className="sr-only">
                Exercise Breakdown
              </h2>
              <ExerciseBreakdownChart />
            </section>
          </ScrollReveal>
        </StaggerItem>

        {/* Session Frequency Section */}
        <StaggerItem>
          <ScrollReveal>
            <section aria-labelledby="session-frequency-heading">
              <h2 id="session-frequency-heading" className="sr-only">
                Session Frequency
              </h2>
              <SessionFrequencyChart weeklyGoal={4} />
            </section>
          </ScrollReveal>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
