import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Page Not Found - Rehabify",
  description: "The page you are looking for could not be found. Return to the Rehabify home page to continue your rehabilitation journey.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sage-50 via-white to-sage-100/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pt-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            We couldn&apos;t find the page you&apos;re looking for. It may have been moved or doesn&apos;t exist.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          <Button variant="secondary" asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
