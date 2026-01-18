"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DifficultyStars } from "@/components/ui/difficulty-stars";
import { Logo } from "@/components/ui/logo";
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
import { clientEnv } from "@/lib/env";

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

const carouselTexts = [
  "Physical Therapy Coach",
  "Companion",
  "Cheerleader",
  "Greatest Supporter",
];

export function LandingClient() {
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);
  const [currentCarouselIndex, setCurrentCarouselIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const ctaHref = clientEnv.NEXT_PUBLIC_DEMO_MODE ? "/dashboard" : "/register";

  // Auto-rotate testimonials
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate carousel text
  React.useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentCarouselIndex((prev) => (prev + 1) % carouselTexts.length);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 400); // Transition out duration
    }, 3500); // Change every 3.5 seconds
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
      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-sage-50 via-white to-terracotta-50/20">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
            {/* Two-column layout: carousel left, cards right */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Left: Carousel content */}
              <div className="text-left">
                <FadeIn direction="up" delay={0.1}>
                  {/* Rehabify logo */}
                  <div className="mb-6">
                    <Logo size="lg" showText />
                  </div>
                  {/* Headline with carousel */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-sage-900 leading-[1.1] tracking-tight mb-6">
                    <span className="block mb-2">Your</span>
                    <span className="block relative h-[1.15em] overflow-hidden">
                      {carouselTexts.map((text, index) => {
                        const isActive = index === currentCarouselIndex;
                        const isNext = index === (currentCarouselIndex + 1) % carouselTexts.length;

                        return (
                          <span
                            key={index}
                            className={`absolute inset-0 bg-gradient-to-r from-sage-600 via-terracotta-500 to-coral-500 bg-clip-text text-transparent transition-all duration-500 ease-in-out ${
                              isActive && !isTransitioning
                                ? "opacity-100 translate-y-0"
                                : isActive && isTransitioning
                                ? "opacity-0 -translate-y-4"
                                : isNext && isTransitioning
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-4"
                            }`}
                          >
                            {text}
                          </span>
                        );
                      })}
                    </span>
                  </h1>
                </FadeIn>

                <FadeIn direction="up" delay={0.2}>
                  <p className="text-base sm:text-lg md:text-xl text-sage-700 max-w-xl leading-relaxed mb-8">
                    Real-time form correction for low back rehabilitation.
                    Private. Precise. Personal.
                  </p>
                </FadeIn>

                <FadeIn direction="up" delay={0.3}>
                  <div className="pt-2">
                    <Button size="lg" variant="terracotta" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow" asChild>
                      <Link href={ctaHref}>
                        Get Started
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </FadeIn>
              </div>

              {/* Right: Three feature cards */}
              <div className="space-y-6">
                {/* See Your Form */}
                <FadeIn direction="up" delay={0.2}>
                  <Card variant="organic" className="p-6 hover-lift">
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-sage-100 to-sage-200 rounded-2xl flex items-center justify-center">
                        <PoseIcon size="md" variant="sage" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-sage-900 mb-1">
                          See Your Form
                        </h3>
                        <p className="text-sage-600 text-sm leading-relaxed">
                          Real-time pose tracking with instant corrections
                        </p>
                      </div>
                    </div>
                  </Card>
                </FadeIn>

                {/* Hear Coaching */}
                <FadeIn direction="up" delay={0.3}>
                  <Card variant="organic" className="p-6 hover-lift bg-gradient-to-b from-terracotta-50/50 to-white">
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-terracotta-100 to-terracotta-200 rounded-2xl flex items-center justify-center">
                        <MicrophoneIcon size="md" variant="coral" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-sage-900 mb-1">
                          Hear Coaching
                        </h3>
                        <p className="text-sage-600 text-sm leading-relaxed">
                          Gentle AI voice guidance like a supportive therapist
                        </p>
                      </div>
                    </div>
                  </Card>
                </FadeIn>

                {/* Heal Confidently */}
                <FadeIn direction="up" delay={0.4}>
                  <Card variant="organic" className="p-6 hover-lift">
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-sage-100 to-sage-200 rounded-2xl flex items-center justify-center">
                        <TrophyIcon size="md" variant="sage" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-sage-900 mb-1">
                          Heal Confidently
                        </h3>
                        <p className="text-sage-600 text-sm leading-relaxed">
                          Track progress and build correct movement habits
                        </p>
                      </div>
                    </div>
                  </Card>
                </FadeIn>
              </div>
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

            <div className="max-w-6xl mx-auto">
              {/* Steps in horizontal layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <ScrollReveal>
                  <div className="relative space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center text-sage-700 font-bold text-lg">
                        1
                      </div>
                      <div className="p-2 bg-sage-100 rounded-xl">
                        <CameraIcon size="sm" variant="sage" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-sage-900 mb-2">Position Your Camera</h3>
                    <p className="text-sage-600 text-sm leading-relaxed">
                      Set up your webcam 2-6 feet away. Any modern browser works - no app needed.
                    </p>
                  </div>
                </ScrollReveal>

                {/* Step 2 */}
                <ScrollReveal>
                  <div className="relative space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-terracotta-100 rounded-xl flex items-center justify-center text-terracotta-700 font-bold text-lg">
                        2
                      </div>
                      <div className="p-2 bg-terracotta-100 rounded-xl">
                        <LibraryIcon size="sm" variant="coral" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-sage-900 mb-2">Start Your Exercise</h3>
                    <p className="text-sage-600 text-sm leading-relaxed">
                      Choose from our library of physio-approved low back exercises.
                    </p>
                  </div>
                </ScrollReveal>

                {/* Step 3 */}
                <ScrollReveal>
                  <div className="relative space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center text-sage-700 font-bold text-lg">
                        3
                      </div>
                      <div className="p-2 bg-sage-100 rounded-xl">
                        <TimerIcon size="sm" variant="sage" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-sage-900 mb-2">Get Real-Time Feedback</h3>
                    <p className="text-sage-600 text-sm leading-relaxed">
                      Our AI watches every rep and corrects your form instantly with gentle voice guidance.
                    </p>
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

      </main>

      <Footer />
    </div>
  );
}
