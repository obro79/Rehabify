"use client";

import type { Exercise } from "@/lib/exercises/types";
import { NumberedList } from "./numbered-list";

interface PhaseInstructionsProps {
  phase: "interview" | "movement" | "summary";
  currentExercise?: Exercise;
}

export function PhaseInstructions({ phase, currentExercise }: PhaseInstructionsProps): React.ReactElement {
  if (phase === "movement" && currentExercise) {
    return <MovementInstructions exercise={currentExercise} />;
  }
  if (phase === "summary") {
    return <SummaryInstructions />;
  }
  return <InterviewInstructions />;
}

function InterviewInstructions(): React.ReactElement {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Interview Phase</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Your coach will ask you about your symptoms, pain levels, and daily activities.
        Answer naturally - there are no wrong answers.
      </p>
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">We'll cover:</p>
        <NumberedList items={["What's bothering you", "Pain levels and triggers", "Your goals"]} />
      </div>
    </div>
  );
}

function MovementInstructions({ exercise }: { exercise: Exercise }): React.ReactElement {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Movement Screen</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Your coach will guide you through simple movement tests. Go slowly and stop if anything hurts.
      </p>
      <div className="p-3 bg-sage-50 rounded-lg mb-4">
        <p className="text-xs font-medium text-sage-600 mb-1">Current Test</p>
        <p className="text-sm font-semibold text-sage-800">{exercise.name}</p>
      </div>
      <NumberedList
        items={[
          "Forward bend (flexion)",
          "Backward bend (extension)",
          "Side bends (left and right)",
        ]}
      />
    </div>
  );
}

function SummaryInstructions(): React.ReactElement {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Summary & Plan</h3>
      <p className="text-sm text-muted-foreground">
        Your coach will summarize the findings and create a personalized exercise plan based on your assessment.
      </p>
    </div>
  );
}
