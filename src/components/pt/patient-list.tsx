"use client";

import * as React from "react";
import { PatientCard } from "./patient-card";
import { cn } from "@/lib/utils";
import type { MockPatient } from "@/lib/mock-data/pt-data";

export interface PatientListProps {
  patients: MockPatient[];
  onPatientClick?: (patientId: string) => void;
  className?: string;
}

export const PatientList = React.forwardRef<HTMLDivElement, PatientListProps>(
  ({ patients, onPatientClick, className }, ref) => {
    if (patients.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center p-12 text-center",
            className
          )}
        >
          <p className="text-muted-foreground">No patients found</p>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-4",
          "grid-cols-1",
          "sm:grid-cols-2",
          "lg:grid-cols-3",
          className
        )}
      >
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onClick={onPatientClick}
          />
        ))}
      </div>
    );
  }
);

PatientList.displayName = "PatientList";
