import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { SanctuaryBackground } from "@/components/ui/sanctuary-background";

export const metadata: Metadata = {
  title: "Onboarding - Rehabify",
  description: "Get started with your Rehabify journey",
};

export default function OnboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SanctuaryBackground variant="default">
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Logo Header */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </SanctuaryBackground>
  );
}
