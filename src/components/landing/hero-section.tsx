"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PoseIcon, MicrophoneIcon, TrophyIcon } from "@/components/ui/icons";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { FeatureCard } from "./feature-card";
import { carouselTexts } from "./landing-data";

interface HeroSectionProps {
  ctaHref: string;
}

export function HeroSection({ ctaHref }: HeroSectionProps): React.ReactElement {
  const [currentCarouselIndex, setCurrentCarouselIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentCarouselIndex((prev) => (prev + 1) % carouselTexts.length);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 400);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-sage-50 via-white to-terracotta-50/20">
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="text-left">
            <FadeIn direction="up" delay={0.1}>
              <div className="mb-6">
                <Logo size="lg" showText />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-sage-900 leading-[1.1] tracking-tight mb-6">
                <span className="block mb-2">Your</span>
                <span className="block relative h-[1.15em] overflow-hidden">
                  {carouselTexts.map((text, index) => {
                    const isActive = index === currentCarouselIndex;
                    const isNext =
                      index === (currentCarouselIndex + 1) % carouselTexts.length;
                    let className =
                      "absolute inset-0 bg-gradient-to-r from-sage-600 via-terracotta-500 to-coral-500 bg-clip-text text-transparent transition-all duration-500 ease-in-out ";

                    if (isActive && !isTransitioning) {
                      className += "opacity-100 translate-y-0";
                    } else if (isActive && isTransitioning) {
                      className += "opacity-0 -translate-y-4";
                    } else if (isNext && isTransitioning) {
                      className += "opacity-100 translate-y-0";
                    } else {
                      className += "opacity-0 translate-y-4";
                    }

                    return (
                      <span key={index} className={className}>
                        {text}
                      </span>
                    );
                  })}
                </span>
              </h1>
            </FadeIn>

            <FadeIn direction="up" delay={0.2}>
              <p className="text-base sm:text-lg md:text-xl text-sage-700 max-w-xl leading-relaxed mb-8">
                Real-time form correction for low back rehabilitation. Private. Precise.
                Personal.
              </p>
            </FadeIn>

            <FadeIn direction="up" delay={0.3}>
              <div className="pt-2">
                <Button
                  size="lg"
                  variant="terracotta"
                  className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow"
                  asChild
                >
                  <Link href={ctaHref}>
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </FadeIn>
          </div>

          <div className="space-y-6">
            <FeatureCard
              icon={<PoseIcon size="md" variant="sage" />}
              iconBgClass="bg-gradient-to-br from-sage-100 to-sage-200"
              title="See Your Form"
              description="Real-time pose tracking with instant corrections"
              delay={0.2}
            />
            <FeatureCard
              icon={<MicrophoneIcon size="md" variant="coral" />}
              iconBgClass="bg-gradient-to-br from-terracotta-100 to-terracotta-200"
              title="Hear Coaching"
              description="Gentle AI voice guidance like a supportive therapist"
              delay={0.3}
              cardBgClass="bg-gradient-to-b from-terracotta-50/50 to-white"
            />
            <FeatureCard
              icon={<TrophyIcon size="md" variant="sage" />}
              iconBgClass="bg-gradient-to-br from-sage-100 to-sage-200"
              title="Heal Confidently"
              description="Track progress and build correct movement habits"
              delay={0.4}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
