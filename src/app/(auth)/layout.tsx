import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth - Rehabify",
  description: "Sign in to your Rehabify account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background">
      {children}
    </div>
  );
}
