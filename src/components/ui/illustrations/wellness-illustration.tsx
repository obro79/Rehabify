"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface WellnessIllustrationProps {
  className?: string;
  variant?: "stretching" | "meditation" | "recovery";
}

export function WellnessIllustration({
  className,
  variant = "stretching",
}: WellnessIllustrationProps) {
  if (variant === "stretching") {
    return (
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-full h-auto", className)}
        aria-label="Person doing stretching exercise"
      >
        {/* Background circle */}
        <circle cx="200" cy="150" r="120" fill="#E8EDE5" opacity="0.5" />

        {/* Ground/mat */}
        <ellipse cx="200" cy="240" rx="140" ry="15" fill="#B8C9AB" opacity="0.6" />

        {/* Person doing lunge stretch */}
        {/* Head */}
        <circle cx="280" cy="100" r="22" fill="#E8A88C" />

        {/* Hair */}
        <path
          d="M258 95c0-15 10-25 22-25s22 10 22 25c0 5-2 10-5 13-3-8-10-13-17-13s-14 5-17 13c-3-3-5-8-5-13z"
          fill="#5C4033"
        />

        {/* Torso */}
        <path
          d="M280 122c0 0-5 30-15 50l-30 20 25-5 20-25c5 20 0 40 0 40l25-10c0 0 5-35-5-60-5-10-20-10-20-10z"
          fill="#7BA67D"
        />

        {/* Back leg extended */}
        <path
          d="M235 192l-90 35c-5 2-8 8-6 13 2 5 8 8 13 6l100-40-17-14z"
          fill="#4A7C59"
        />

        {/* Front leg bent */}
        <path
          d="M300 192l15 45c2 5-1 10-6 12-5 2-10-1-12-6l-20-45 23-6z"
          fill="#4A7C59"
        />

        {/* Arms reaching up */}
        <path
          d="M280 130c10-5 25-30 30-45 3-10 15-5 12 5-5 15-20 45-30 55-10 0-12-15-12-15z"
          fill="#E8A88C"
        />
        <path
          d="M275 130c-10-5-30-25-40-35-5-8 5-15 12-8 10 12 35 35 40 48-5 5-12-5-12-5z"
          fill="#E8A88C"
        />

        {/* Movement lines */}
        <path d="M320 60c10-5 20-5 25 0" stroke="#B8C9AB" strokeWidth="2" strokeLinecap="round" />
        <path d="M325 75c8-3 15-3 18 0" stroke="#B8C9AB" strokeWidth="2" strokeLinecap="round" />
        <path d="M110 210c-10 5-15 15-12 22" stroke="#B8C9AB" strokeWidth="2" strokeLinecap="round" />

        {/* Decorative elements */}
        <circle cx="80" cy="80" r="8" fill="#E4B8A4" opacity="0.6" />
        <circle cx="320" cy="200" r="6" fill="#B8C9AB" opacity="0.8" />
        <circle cx="100" cy="180" r="5" fill="#7BA67D" opacity="0.5" />
      </svg>
    );
  }

  if (variant === "recovery") {
    return (
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-full h-auto", className)}
        aria-label="Person in recovery pose"
      >
        {/* Background circle */}
        <circle cx="200" cy="150" r="120" fill="#F5E6DF" opacity="0.5" />

        {/* Yoga mat */}
        <rect x="60" y="200" width="280" height="20" rx="10" fill="#B8C9AB" opacity="0.7" />

        {/* Person in child's pose */}
        {/* Back/torso curved */}
        <ellipse cx="200" cy="170" rx="60" ry="35" fill="#7BA67D" />

        {/* Head resting */}
        <circle cx="140" cy="180" r="20" fill="#E8A88C" />

        {/* Hair */}
        <path
          d="M120 175c0-12 9-20 20-20s20 8 20 20c0 4-2 8-4 11-3-6-9-11-16-11s-13 5-16 11c-2-3-4-7-4-11z"
          fill="#5C4033"
        />

        {/* Arms extended forward */}
        <path
          d="M130 190c-20 5-50 10-70 8-8-1-8-12 0-12 25 0 55-5 75-8l-5 12z"
          fill="#E8A88C"
        />

        {/* Legs folded */}
        <path
          d="M260 170c20 10 40 25 50 35 5 5-2 12-8 8-15-12-35-30-52-38l10-5z"
          fill="#4A7C59"
        />

        {/* Breathing/zen circles */}
        <circle cx="100" cy="120" r="15" stroke="#B8C9AB" strokeWidth="2" fill="none" opacity="0.5" />
        <circle cx="100" cy="120" r="25" stroke="#B8C9AB" strokeWidth="1.5" fill="none" opacity="0.3" />
        <circle cx="100" cy="120" r="35" stroke="#B8C9AB" strokeWidth="1" fill="none" opacity="0.2" />

        {/* Decorative elements */}
        <circle cx="320" cy="100" r="8" fill="#E4B8A4" opacity="0.6" />
        <circle cx="300" cy="140" r="5" fill="#B8C9AB" opacity="0.8" />
        <circle cx="80" cy="220" r="4" fill="#7BA67D" opacity="0.5" />

        {/* Peaceful plant */}
        <path d="M340 180c0-15-8-25-8-25s-8 10-8 25c0 10 8 15 8 15s8-5 8-15z" fill="#7BA67D" opacity="0.7" />
        <path d="M332 200v30" stroke="#5C8A5C" strokeWidth="2" />
      </svg>
    );
  }

  // meditation variant
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-auto", className)}
      aria-label="Person meditating"
    >
      {/* Background circle */}
      <circle cx="200" cy="150" r="110" fill="#E8EDE5" opacity="0.4" />

      {/* Cushion */}
      <ellipse cx="200" cy="230" rx="50" ry="15" fill="#E4B8A4" opacity="0.8" />

      {/* Person sitting cross-legged */}
      {/* Torso */}
      <path
        d="M200 130c-15 0-25 10-25 25v35c0 5 3 10 8 12h34c5-2 8-7 8-12v-35c0-15-10-25-25-25z"
        fill="#7BA67D"
      />

      {/* Head */}
      <circle cx="200" cy="105" r="25" fill="#E8A88C" />

      {/* Hair */}
      <path
        d="M175 100c0-15 11-25 25-25s25 10 25 25c0 5-2 10-5 14-4-9-12-15-20-15s-16 6-20 15c-3-4-5-9-5-14z"
        fill="#5C4033"
      />

      {/* Closed eyes - peaceful */}
      <path d="M190 105c3-2 7-2 10 0" stroke="#5C4033" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M200 105c3-2 7-2 10 0" stroke="#5C4033" strokeWidth="1.5" strokeLinecap="round" />

      {/* Slight smile */}
      <path d="M195 115c3 3 7 3 10 0" stroke="#D4917A" strokeWidth="1.5" strokeLinecap="round" />

      {/* Arms in meditation pose */}
      <path
        d="M175 160c-15 5-30 20-35 30 5 5 15 0 20-10 5 0 15-15 15-20z"
        fill="#E8A88C"
      />
      <path
        d="M225 160c15 5 30 20 35 30-5 5-15 0-20-10-5 0-15-15-15-20z"
        fill="#E8A88C"
      />

      {/* Legs crossed */}
      <path
        d="M175 200c-20 5-40 15-50 20 0 8 10 10 15 5 15-10 35-20 45-25h-10z"
        fill="#4A7C59"
      />
      <path
        d="M225 200c20 5 40 15 50 20 0 8-10 10-15 5-15-10-35-20-45-25h10z"
        fill="#4A7C59"
      />

      {/* Aura/energy rings */}
      <circle cx="200" cy="140" r="70" stroke="#B8C9AB" strokeWidth="1" fill="none" opacity="0.3" />
      <circle cx="200" cy="140" r="90" stroke="#B8C9AB" strokeWidth="0.5" fill="none" opacity="0.2" />

      {/* Floating elements */}
      <circle cx="100" cy="100" r="6" fill="#E4B8A4" opacity="0.5" />
      <circle cx="300" cy="120" r="8" fill="#B8C9AB" opacity="0.6" />
      <circle cx="120" cy="200" r="4" fill="#7BA67D" opacity="0.4" />
      <circle cx="280" cy="80" r="5" fill="#E4B8A4" opacity="0.4" />
    </svg>
  );
}
