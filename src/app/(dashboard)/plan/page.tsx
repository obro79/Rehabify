"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { ArrowRight, ClipboardList } from "lucide-react";
import type { PlanStructure, PlanWeek, Recommendation } from "@/lib/gemini/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDifficultyBadgeVariant(difficulty: string): "easy" | "medium" | "hard" {
  switch (difficulty) {
    case "beginner":
      return "easy";
    case "intermediate":
      return "medium";
    case "advanced":
      return "hard";
    default:
      return "medium";
  }
}

interface PlanData {
  name: string;
  summary: string;
  recommendations: Recommendation[];
  structure: PlanStructure;
}

export default function PlanPage() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch("/api/patient-records");
        if (!res.ok) throw new Error("Failed to fetch records");

        const result = await res.json();
        const data = result.data || result;
        const plans = data?.plans || [];

        if (plans.length > 0) {
          const activePlan =
            plans.find((p: { status: string }) => p.status === "approved") ||
            plans[0];

          if (activePlan?.structure) {
            let structure: PlanStructure;
            if (typeof activePlan.structure === "string") {
              structure = JSON.parse(activePlan.structure);
            } else {
              structure = activePlan.structure as PlanStructure;
            }

            setPlan({
              name: activePlan.name || "My Rehab Plan",
              summary: activePlan.summary || "",
              recommendations: activePlan.recommendations || [],
              structure,
            });
          }
        }
      } catch (err) {
        console.error("[Plan] Failed to load plan:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-24 rounded-3xl bg-sage-50 animate-pulse" />
        <div className="h-12 rounded-xl bg-sage-50 animate-pulse w-full max-w-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-sage-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <Card variant="organic" className="p-12 text-center space-y-4">
            <ClipboardList className="h-12 w-12 text-sage-400 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">
              No Plan Yet
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Complete an assessment to generate your personalized 12-week rehab
              plan.
            </p>
            <Button variant="primary" asChild>
              <Link href="/assessment/lower-back">Take Assessment</Link>
            </Button>
          </Card>
        </FadeIn>
      </div>
    );
  }

  const currentWeek: PlanWeek | undefined = plan.structure.weeks.find(
    (w) => String(w.weekNumber) === selectedWeek
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Plan Header */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-100 via-sage-50 to-white p-6 shadow-sm">
          <div
            className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sage-200/30 to-terracotta-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
            aria-hidden="true"
          />
          <div className="relative space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{plan.name}</h1>
            {plan.summary && (
              <p className="text-muted-foreground max-w-2xl text-sm">
                {plan.summary}
              </p>
            )}
            {plan.recommendations.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {plan.recommendations.map((rec, i) => (
                  <Badge
                    key={i}
                    variant={
                      rec.type === "warning" || rec.type === "contraindication"
                        ? "warning"
                        : rec.type === "encouragement"
                        ? "success"
                        : "info"
                    }
                    size="sm"
                  >
                    {rec.message}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </section>
      </FadeIn>

      {/* Week Selector */}
      <FadeIn delay={0.1}>
        <Tabs value={selectedWeek} onValueChange={setSelectedWeek}>
          <TabsList className="w-full flex flex-wrap gap-1">
            {plan.structure.weeks.map((week) => (
              <TabsTrigger
                key={week.weekNumber}
                value={String(week.weekNumber)}
                className="min-w-[3rem]"
              >
                W{week.weekNumber}
              </TabsTrigger>
            ))}
          </TabsList>

          {plan.structure.weeks.map((week) => (
            <TabsContent
              key={week.weekNumber}
              value={String(week.weekNumber)}
            >
              {/* Week Info */}
              <div className="mb-4 space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Week {week.weekNumber}: {week.focus}
                </h2>
                <p className="text-sm text-muted-foreground">{week.notes}</p>
              </div>

              {/* Exercise Cards */}
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...week.exercises]
                  .sort((a, b) => a.order - b.order)
                  .map((exercise) => (
                    <StaggerItem key={exercise.exerciseId || exercise.exerciseSlug}>
                      <Card
                        variant="organic"
                        className="p-5 space-y-3 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground">
                            {exercise.name}
                          </h3>
                          <Badge variant="muted" size="sm">
                            {exercise.sets} x {exercise.reps}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                          {exercise.holdSeconds && exercise.holdSeconds > 0 && (
                            <Badge variant="info" size="sm">
                              Hold {exercise.holdSeconds}s
                            </Badge>
                          )}
                          <Badge variant="default" size="sm">
                            {exercise.days
                              .map((d) => DAY_NAMES[d])
                              .join(", ")}
                          </Badge>
                        </div>

                        {exercise.notes && (
                          <p className="text-xs text-muted-foreground">
                            {exercise.notes}
                          </p>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1 h-8 text-xs"
                          asChild
                        >
                          <Link href={`/workout/${exercise.exerciseSlug}`}>
                            Start Exercise
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </Card>
                    </StaggerItem>
                  ))}
              </StaggerContainer>
            </TabsContent>
          ))}
        </Tabs>
      </FadeIn>
    </div>
  );
}
