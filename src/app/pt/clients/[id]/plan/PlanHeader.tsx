"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanHeaderProps {
  clientId: string;
  patientName: string;
  isGenerating: boolean;
  hasAssessment: boolean;
  canSave: boolean;
  onGenerate: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function PlanHeader({
  clientId,
  patientName,
  isGenerating,
  hasAssessment,
  canSave,
  onGenerate,
  onCancel,
  onSave,
}: PlanHeaderProps): React.JSX.Element {
  const generateTitle = hasAssessment
    ? "Generate plan from assessment"
    : "Generate sample plan (no assessment found)";
  const generateLabel = hasAssessment
    ? "AI Generate from Assessment"
    : "AI Generate (Sample)";

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-sage-200/60 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/pt/clients/${clientId}`}
            className="flex items-center gap-2 text-sage-600 hover:text-sage-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Client</span>
          </Link>
          <div className="h-6 w-px bg-sage-200" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Plan Builder</h1>
            <p className="text-sm text-muted-foreground">{patientName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
            className="text-sage-600 hover:text-sage-800"
            title={generateTitle}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? "Generating..." : generateLabel}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onSave}
            disabled={!canSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Plan
          </Button>
        </div>
      </div>
    </header>
  );
}
