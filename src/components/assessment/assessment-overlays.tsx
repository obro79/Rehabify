"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RedFlagOverlayProps {
  visible: boolean;
}

export function RedFlagOverlay({ visible }: RedFlagOverlayProps): React.ReactElement | null {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 bg-destructive/10 backdrop-blur-sm flex items-center justify-center z-10">
      <Card className="p-6 max-w-sm border-destructive/50 bg-white">
        <h2 className="text-lg font-semibold text-destructive mb-2">Medical Evaluation Recommended</h2>
        <p className="text-sm text-muted-foreground">
          Based on your responses, we recommend seeing a healthcare provider before starting exercises.
          Your safety is our priority.
        </p>
      </Card>
    </div>
  );
}

interface CompletionOverlayProps {
  visible: boolean;
  isSaving: boolean;
  saveError: string | null;
  onRetry: () => void;
  onNavigate: () => void;
}

export function CompletionOverlay({
  visible,
  isSaving,
  saveError,
  onRetry,
  onNavigate,
}: CompletionOverlayProps): React.ReactElement | null {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 bg-sage-50/90 backdrop-blur-sm flex items-center justify-center z-10">
      <Card className="p-6 max-w-sm border-sage-300">
        <h2 className="text-lg font-semibold text-sage-700 mb-2">Assessment Complete</h2>
        {isSaving ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating your personalized recovery plan...
            </div>
            <p className="text-xs text-muted-foreground/70">This may take up to a minute</p>
          </div>
        ) : saveError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{saveError}</p>
            <Button onClick={onRetry} variant="ghost" size="sm">
              Retry Save
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">Great job! Your personalized plan is ready.</p>
            <Button onClick={onNavigate}>Go to Dashboard</Button>
          </>
        )}
      </Card>
    </div>
  );
}
