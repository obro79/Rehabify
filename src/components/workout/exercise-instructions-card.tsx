"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface ExerciseInstructionsCardProps {
  instructions: string[];
  commonMistakes: string[];
}

export function ExerciseInstructionsCard({
  instructions,
  commonMistakes,
}: ExerciseInstructionsCardProps): React.JSX.Element {
  return (
    <Card className="bg-white/50">
      <Collapsible defaultOpen={false} className="p-4">
        <CollapsibleTrigger className="flex items-center gap-2 w-full hover:opacity-80">
          <span className="text-base font-semibold">Exercise Instructions</span>
          <div className="h-px bg-sage-200 flex-1 ml-4" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 mt-4 pt-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                How to Perform:
              </h3>
              <ol className="space-y-3">
                {instructions.map((instruction, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-sage-100 text-sage-700 font-bold text-xs border border-sage-200">
                      {i + 1}
                    </span>
                    <span className="text-sage-700 leading-relaxed">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {commonMistakes.length > 0 && (
              <div className="mt-6 pt-4 border-t border-sage-100">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Common Mistakes:
                </h3>
                <ul className="space-y-2">
                  {commonMistakes.map((mistake, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm bg-coral-50/50 p-2 rounded-lg text-coral-800"
                    >
                      <AlertTriangle className="w-4 h-4 text-coral-500 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
