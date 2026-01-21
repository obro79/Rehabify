"use client";

import * as React from "react";
import { ScrollReveal } from "@/components/motion";
import { testimonials } from "./landing-data";

export function TestimonialsSection(): React.ReactElement {
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-section-xl text-sage-900 mb-16">What Users Say</h2>
          </ScrollReveal>

          <div className="relative">
            <div className="quote-mark absolute -top-8 left-0 md:-left-8">
              &ldquo;
            </div>

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

            <div className="quote-mark absolute -bottom-16 right-0 md:-right-8 rotate-180">
              &ldquo;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
