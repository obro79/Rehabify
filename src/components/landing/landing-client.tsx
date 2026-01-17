"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DifficultyStars } from "@/components/ui/difficulty-stars";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  PoseIcon,
  MicrophoneIcon,
  TrophyIcon,
  CameraIcon,
  LibraryIcon,
  TimerIcon,
  LockIcon,
} from "@/components/ui/icons";
import { ArrowRight } from "lucide-react";
import exerciseData from "@/lib/exercises/data.json";
import { mapDifficultyToStars, type Exercise } from "@/lib/exercises/types";
import { FadeIn, ScrollReveal } from "@/components/motion";
import { ClinicalTrustSection } from "./clinical-trust-section";

// Get first 4 exercises for preview
const previewExercises = exerciseData.exercises.slice(0, 4) as Exercise[];

// Mock testimonial data
const testimonials = [
  {
    quote: "Finally, I can do my physio exercises with confidence that my form is correct. It's like having a physiotherapist in my living room.",
    author: "Sarah M.",
    condition: "Recovering from disc herniation",
  },
  {
    quote: "The AI coach catches mistakes I didn't even know I was making. My back pain has improved dramatically in just two weeks.",
    author: "Marcus T.",
    condition: "Chronic lower back pain",
  },
  {
    quote: "As someone who was nervous about exercising wrong and making things worse, this gives me the confidence to stay consistent with my rehab.",
    author: "Linda K.",
    condition: "Post-surgery rehabilitation",
  },
];

export function LandingClient() {
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);

  // Auto-rotate testimonials
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const getCategoryBadgeVariant = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === "mobility") return "info";
    if (lowerCategory === "extension" || lowerCategory === "strength") return "coral";
    if (lowerCategory === "stability") return "success";
    return "muted";
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header showCTA />

      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-sage-50 via-white to-terracotta-50/20">
          {/* Large organic blobs - editorial scale */}
          <div
            className="blob-hero w-[600px] h-[600px] bg-gradient-to-br from-sage-200/60 to-sage-300/40 rounded-full top-[-10%] right-[-10%]"
            style={{ animationDelay: '0s' }}
            aria-hidden="true"
          />
          <div
            className="blob-hero w-[500px] h-[500px] bg-gradient-to-tr from-terracotta-200/40 to-coral-200/30 rounded-full bottom-[-15%] left-[-5%]"
            style={{ animationDelay: '4s' }}
            aria-hidden="true"
          />
          <div
            className="blob-hero w-[300px] h-[300px] bg-sage-100/40 rounded-full top-[40%] left-[30%]"
            style={{ animationDelay: '2s' }}
            aria-hidden="true"
          />

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            {/* Asymmetric layout - text heavy left, visual accent right */}
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left: Editorial Typography */}
              <div className="lg:col-span-7 space-y-8">
                <FadeIn direction="up" delay={0.1}>
                  {/* Oversized stacked headline */}
                  <h1 className="text-hero-xl text-sage-900">
                    <span className="block">Your AI</span>
                    <span className="block bg-gradient-to-r from-sage-600 via-terracotta-500 to-coral-500 bg-clip-text text-transparent">
                      Physical Therapy
                    </span>
                    <span className="block">Coach</span>
                  </h1>
                </FadeIn>

                <FadeIn direction="up" delay={0.2}>
                  <p className="text-xl md:text-2xl text-sage-700 max-w-xl leading-relaxed">
                    Real-time form correction for low back rehabilitation.
                    Private. Precise. Personal.
                  </p>
                </FadeIn>

                <FadeIn direction="up" delay={0.3}>
                  <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                    <Button size="lg" variant="terracotta" className="text-lg px-8 py-6" asChild>
                      <Link href="/register">
                        Start Free Session
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <p className="text-sm text-sage-600 self-center">
                      No credit card required
                    </p>
                  </div>
                </FadeIn>
              </div>

              {/* Right: Abstract visual element */}
              <div className="lg:col-span-5 relative">
                <FadeIn direction="up" delay={0.4}>
                  <div className="relative asymmetric-right">
                    {/* Stacked cards creating depth */}
                    <div className="relative">
                      {/* Back card - offset */}
                      <div className="absolute -top-4 -left-4 w-full h-full bg-sage-200/30 rounded-3xl transform rotate-3" />
                      {/* Middle card */}
                      <div className="absolute -top-2 -left-2 w-full h-full bg-sage-100/50 rounded-3xl transform rotate-1" />
                      {/* Front card with content */}
                      <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-sage-100">
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-sage-100 rounded-2xl">
                              <PoseIcon size="md" variant="sage" />
                            </div>
                            <div>
                              <p className="font-display font-semibold text-sage-900">Form Score</p>
                              <p className="text-3xl font-display font-bold text-terracotta-500">94%</p>
                            </div>
                          </div>
                          <div className="h-2 bg-sage-100 rounded-full overflow-hidden">
                            <div className="h-full w-[94%] bg-gradient-to-r from-sage-400 to-terracotta-400 rounded-full" />
                          </div>
                          <p className="text-sage-600 text-sm">Great form! Keep your core engaged.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* ===== VALUE PROPOSITIONS ===== */}
        <section className="relative py-24 md:py-32 bg-white overflow-hidden">
          {/* Subtle gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-sage-100/40 to-transparent rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tr from-terracotta-100/30 to-transparent rounded-full blur-3xl" aria-hidden="true" />

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            {/* Staggered card layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 max-w-6xl mx-auto">
              {/* See Your Form - offset up */}
              <ScrollReveal>
                <div className="md:offset-up">
                  <Card variant="organic" className="p-8 hover-lift h-full">
                    <div className="space-y-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-sage-100 to-sage-200 rounded-2xl flex items-center justify-center">
                        <PoseIcon size="md" variant="sage" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-display-lg text-sage-900">
                          See Your Form
                        </h3>
                        <p className="text-sage-600 text-lg leading-relaxed">
                          Real-time pose tracking shows your skeleton overlay and highlights corrections as you move
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </ScrollReveal>

              {/* Hear Gentle Coaching - center, taller */}
              <ScrollReveal>
                <div className="md:mt-8">
                  <Card variant="organic" className="p-8 hover-lift h-full bg-gradient-to-b from-terracotta-50/50 to-white">
                    <div className="space-y-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-terracotta-100 to-terracotta-200 rounded-2xl flex items-center justify-center">
                        <MicrophoneIcon size="md" variant="coral" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-display-lg text-sage-900">
                          Hear Coaching
                        </h3>
                        <p className="text-sage-600 text-lg leading-relaxed">
                          Calm AI voice guides you like a supportive physiotherapist - never rushed, always patient and encouraging
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </ScrollReveal>

              {/* Heal With Confidence - offset down */}
              <ScrollReveal>
                <div className="md:offset-down">
                  <Card variant="organic" className="p-8 hover-lift h-full">
                    <div className="space-y-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-sage-100 to-sage-200 rounded-2xl flex items-center justify-center">
                        <TrophyIcon size="md" variant="sage" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-display-lg text-sage-900">
                          Heal Confidently
                        </h3>
                        <p className="text-sage-600 text-lg leading-relaxed">
                          Build correct movement habits and track your progress with form scores over time
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ===== CLINICAL CREDENTIALS ===== */}
        <ClinicalTrustSection />

        {/* ===== HOW IT WORKS ===== */}
        <section className="py-24 md:py-32 bg-gradient-to-b from-sage-50/50 to-white relative overflow-hidden" id="how-it-works">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="max-w-xl mb-16">
                <h2 className="text-section-xl text-sage-900 mb-4">
                  How It Works
                </h2>
                <p className="text-xl text-sage-600">
                  Get started in three simple steps
                </p>
              </div>
            </ScrollReveal>

            <div className="max-w-5xl mx-auto relative">
              {/* Steps with giant background numbers */}
              <div className="space-y-16 md:space-y-24">
                {/* Step 1 */}
                <ScrollReveal>
                  <div className="relative grid md:grid-cols-2 gap-8 items-center">
                    <div className="step-number-giant -left-8 md:-left-16 top-0">1</div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-sage-100 rounded-2xl">
                          <CameraIcon size="md" variant="sage" />
                        </div>
                        <h3 className="text-display-lg text-sage-900">Position Your Camera</h3>
                      </div>
                      <p className="text-lg text-sage-600 pl-[72px]">
                        Set up your webcam 2-6 feet away on a stable surface. Any modern browser works - no app needed.
                      </p>
                    </div>
                    <div className="hidden md:block" />
                  </div>
                </ScrollReveal>

                {/* Step 2 */}
                <ScrollReveal>
                  <div className="relative grid md:grid-cols-2 gap-8 items-center">
                    <div className="hidden md:block" />
                    <div className="step-number-giant right-0 md:-right-16 top-0">2</div>
                    <div className="relative z-10 space-y-4 md:col-start-2">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-terracotta-100 rounded-2xl">
                          <LibraryIcon size="md" variant="coral" />
                        </div>
                        <h3 className="text-display-lg text-sage-900">Start Your Exercise</h3>
                      </div>
                      <p className="text-lg text-sage-600 pl-[72px]">
                        Choose from our library of physio-approved low back exercises designed for rehabilitation.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Step 3 */}
                <ScrollReveal>
                  <div className="relative grid md:grid-cols-2 gap-8 items-center">
                    <div className="step-number-giant -left-8 md:-left-16 top-0">3</div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-sage-100 rounded-2xl">
                          <TimerIcon size="md" variant="sage" />
                        </div>
                        <h3 className="text-display-lg text-sage-900">Get Real-Time Feedback</h3>
                      </div>
                      <p className="text-lg text-sage-600 pl-[72px]">
                        Our AI watches every rep and corrects your form instantly with gentle voice guidance.
                      </p>
                    </div>
                    <div className="hidden md:block" />
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* ===== EXERCISE PREVIEW ===== */}
        <section className="py-24 md:py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <ScrollReveal>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                  <div>
                    <h2 className="text-section-xl text-sage-900 mb-4">
                      Exercise Library
                    </h2>
                    <p className="text-xl text-sage-600">
                      Gentle movements designed by physiotherapists
                    </p>
                  </div>
                  <Button variant="secondary" size="lg" asChild>
                    <Link href="/exercises">
                      See All {exerciseData.exercises.length}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </ScrollReveal>

              {/* Masonry-style offset grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {previewExercises.map((exercise, index) => (
                  <ScrollReveal key={exercise.id}>
                    <div className={index === 1 ? "lg:-mt-8" : index === 2 ? "lg:mt-4" : ""}>
                      <Card
                        variant="organic"
                        className={`group p-6 hover-lift h-full ${
                          index === 0 ? "lg:row-span-2 lg:p-8" : ""
                        }`}
                      >
                        {/* Icon area */}
                        <div className={`flex items-center justify-center bg-sage-50 rounded-2xl mb-5 group-hover:bg-sage-100 transition-colors ${
                          index === 0 ? "h-40" : "h-28"
                        }`}>
                          <LibraryIcon size={index === 0 ? "lg" : "md"} variant="sage" />
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <h3 className={`font-display font-semibold text-sage-900 ${
                            index === 0 ? "text-xl" : "text-lg"
                          }`}>
                            {exercise.name}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={getCategoryBadgeVariant(exercise.category)} size="sm">
                              {exercise.category}
                            </Badge>
                            {exercise.tier === 1 && (
                              <Badge variant="success" size="sm">
                                AI-Powered
                              </Badge>
                            )}
                          </div>

                          <p className={`text-sage-600 line-clamp-2 ${
                            index === 0 ? "text-base" : "text-sm"
                          }`}>
                            {exercise.description}
                          </p>

                          <div className="pt-2">
                            <DifficultyStars level={mapDifficultyToStars(exercise.difficulty)} />
                          </div>
                        </div>
                      </Card>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== PRIVACY CALLOUT - DARK BREAK ===== */}
        <section className="section-dark py-20 md:py-28 relative overflow-hidden">
          {/* Watermark lock icon */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-5" aria-hidden="true">
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
                      Your webcam feed never leaves your device. All pose analysis happens locally in your browser using WebAssembly. We never see, store, or transmit your video.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="py-24 md:py-32 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollReveal>
                <h2 className="text-section-xl text-sage-900 mb-16">
                  What Users Say
                </h2>
              </ScrollReveal>

              {/* Single large testimonial with decorative quotes */}
              <div className="relative">
                {/* Opening quote mark */}
                <div className="quote-mark absolute -top-8 left-0 md:-left-8">
                  &ldquo;
                </div>

                {/* Testimonial content */}
                <div className="relative z-10 space-y-8 px-8 md:px-16">
                  <blockquote
                    className="font-display text-2xl md:text-4xl text-sage-800 leading-relaxed transition-opacity duration-500"
                    key={currentTestimonial}
                  >
                    {testimonials[currentTestimonial].quote}
                  </blockquote>

                  <div className="space-y-1">
                    <p className="font-display font-semibold text-lg text-sage-900">
                      {testimonials[currentTestimonial].author}
                    </p>
                    <p className="text-sage-600">
                      {testimonials[currentTestimonial].condition}
                    </p>
                  </div>

                  {/* Indicators */}
                  <div className="flex justify-center gap-3 pt-4">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTestimonial(index)}
                        aria-label={`Go to testimonial ${index + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentTestimonial
                            ? "w-12 bg-terracotta-400"
                            : "w-2 bg-sage-200 hover:bg-sage-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Closing quote mark */}
                <div className="quote-mark absolute -bottom-16 right-0 md:-right-8 rotate-180">
                  &ldquo;
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="py-24 md:py-32 bg-gradient-to-br from-sage-100 via-sage-50 to-terracotta-50/30 relative overflow-hidden">
          {/* Organic shapes */}
          <div className="blob-hero w-[400px] h-[400px] bg-sage-200/40 rounded-full -top-20 -right-20" aria-hidden="true" />
          <div className="blob-hero w-[300px] h-[300px] bg-terracotta-200/30 rounded-full -bottom-10 -left-10" aria-hidden="true" />

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="max-w-3xl mx-auto text-center space-y-10">
                <h2 className="text-section-xl text-sage-900">
                  Ready to Rehabilitate
                  <span className="block bg-gradient-to-r from-terracotta-500 to-coral-500 bg-clip-text text-transparent">
                    the Right Way?
                  </span>
                </h2>

                <div className="flex flex-col items-center gap-6">
                  <Button size="lg" variant="terracotta" className="text-lg px-10 py-7" asChild>
                    <Link href="/register">
                      Start Your Free Session
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>

                  <div className="flex flex-wrap justify-center gap-6 text-sm text-sage-600">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sage-400 rounded-full" />
                      Chrome, Firefox, Edge, Safari
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-sage-400 rounded-full" />
                      Webcam + Microphone
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
