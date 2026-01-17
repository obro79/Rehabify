import type { Metadata } from "next";
import { LandingClient } from "@/components/landing/landing-client";

export const metadata: Metadata = {
  title: "Rehabify - Your AI Physical Therapy Coach",
  description: "Real-time form correction for low back rehabilitation. AI-powered computer vision provides instant feedback during your exercises. No credit card required.",
  keywords: ["physical therapy", "AI coach", "form correction", "back pain", "rehabilitation", "exercise guidance"],
  openGraph: {
    title: "Rehabify - Your AI Physical Therapy Coach",
    description: "Real-time form correction for low back rehabilitation with AI-powered computer vision.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rehabify - AI Physical Therapy Coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rehabify - Your AI Physical Therapy Coach",
    description: "Real-time form correction for low back rehabilitation with AI-powered computer vision.",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  return <LandingClient />;
}
