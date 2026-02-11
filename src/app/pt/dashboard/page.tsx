"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatsCard } from "@/components/ui/stats-card";
import { PatientList } from "@/components/pt/patient-list";
import { GuideIcon, UsersIcon, AlertIcon } from "@/components/ui/icons";
import { SanctuaryBackground } from "@/components/ui/sanctuary-background";
import { getTimeOfDayGreeting } from "@/lib/date-utils";
import type { MockPatient, Alert } from "@/lib/mock-data/pt-data";

/** Map DB alert types to MockPatient alert types */
function mapAlertType(dbType: string): Alert["type"] {
  const mapping: Record<string, Alert["type"]> = {
    high_pain: "pain_report",
    missed_sessions: "missed_session",
    declining_form: "declining_form",
    patient_concern: "pain_report",
  };
  return mapping[dbType] ?? "pain_report";
}

/** Map API response to MockPatient format */
function mapToMockPatient(client: Record<string, unknown>): MockPatient {
  const alerts = (client.alerts as Array<Record<string, unknown>>) ?? [];
  const plan = client.currentPlan as Record<string, unknown> | null;

  return {
    id: client.id as string,
    name: client.name as string,
    email: client.email as string,
    avatarUrl: (client.avatarUrl as string) || undefined,
    status: (client.status as MockPatient["status"]) ?? "active",
    memberSince: client.memberSince ? new Date(client.memberSince as string) : new Date(),
    lastSession: client.lastSession ? new Date(client.lastSession as string) : null,
    alerts: alerts.map((a) => ({
      id: a.id as string,
      type: mapAlertType(a.type as string),
      severity: (a.severity as Alert["severity"]) ?? "low",
      message: a.message as string,
      createdAt: new Date(a.createdAt as string),
    })),
    currentPlan: plan
      ? {
          id: plan.id as string,
          name: plan.name as string,
          status: (plan.status as "pending_review" | "approved" | "rejected" | "modified") ?? "approved",
          exercises: [],
          createdAt: new Date(plan.createdAt as string),
          reviewedAt: plan.reviewedAt ? new Date(plan.reviewedAt as string) : undefined,
          notes: (plan.notes as string) || undefined,
        }
      : null,
    sessionHistory: [],
  };
}

export default function PTDashboardPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<MockPatient[]>([]);
  const [ptName, setPtName] = useState("Doctor");
  const [loading, setLoading] = useState(true);
  const greeting = getTimeOfDayGreeting();

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch("/api/pt/clients", {
          headers: { "x-demo-role": "pt" },
        });
        if (!response.ok) {
          console.error("Failed to fetch clients:", response.status);
          setLoading(false);
          return;
        }
        const { data } = await response.json();
        const mapped = (data as Array<Record<string, unknown>>).map(mapToMockPatient);
        setPatients(mapped);

        // Try to get PT name from profile
        const profileResponse = await fetch("/api/profile", {
          headers: { "x-demo-role": "pt" },
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData?.data?.displayName) {
            setPtName(profileData.data.displayName);
          }
        }
      } catch (err) {
        console.error("Error fetching PT clients:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  // Calculate stats from patient data
  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const pendingReviews = patients.filter(
      (p) => p.currentPlan?.status === "pending_review"
    ).length;
    const patientsWithAlerts = patients.filter((p) => p.alerts.length > 0).length;

    return {
      totalPatients,
      pendingReviews,
      patientsWithAlerts,
    };
  }, [patients]);

  // Sort patients: alerts first, then by last session date
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      // Patients with alerts first
      const aHasAlerts = a.alerts.length > 0;
      const bHasAlerts = b.alerts.length > 0;

      if (aHasAlerts && !bHasAlerts) return -1;
      if (!aHasAlerts && bHasAlerts) return 1;

      // Then sort by last session date (most recent first)
      const aDate = a.lastSession?.getTime() ?? 0;
      const bDate = b.lastSession?.getTime() ?? 0;

      return bDate - aDate;
    });
  }, [patients]);

  const handlePatientClick = (patientId: string) => {
    router.push(`/pt/clients/${patientId}`);
  };

  return (
    <SanctuaryBackground variant="default">
      <div className="max-w-7xl space-y-8">
        {/* Welcome Section - Full Width Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-100 via-sage-50 to-white p-8 shadow-sm border border-sage-200/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sage-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h1 className="text-2xl font-bold text-foreground">
              {greeting}, {ptName}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Here&apos;s an overview of your patients today
            </p>
          </div>
        </section>

      {/* Quick Stats Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Patients"
            value={stats.totalPatients}
            customIcon={<UsersIcon className="w-5 h-5" />}
            variant="sage"
          />
          <StatsCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            customIcon={<GuideIcon className="w-5 h-5" />}
            trend={
              stats.pendingReviews > 0
                ? { direction: "neutral", value: "Requires attention" }
                : undefined
            }
          />
          <StatsCard
            title="Patients with Alerts"
            value={stats.patientsWithAlerts}
            customIcon={<AlertIcon className="w-5 h-5" />}
            variant={stats.patientsWithAlerts > 0 ? "coral" : "default"}
            trend={
              stats.patientsWithAlerts > 0
                ? { direction: "up", value: `${stats.patientsWithAlerts} need review` }
                : { direction: "neutral", value: "All clear" }
            }
          />
        </div>
      </section>

      {/* Patient List Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Your Patients
            </h2>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading patients..."
                : stats.patientsWithAlerts > 0
                  ? `${stats.patientsWithAlerts} patient${stats.patientsWithAlerts > 1 ? "s" : ""} with alerts shown first`
                  : patients.length > 0
                    ? "All patients are progressing well"
                    : "No patients assigned yet"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-sage-100/50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <PatientList patients={sortedPatients} onPatientClick={handlePatientClick} />
        )}
      </section>
      </div>
    </SanctuaryBackground>
  );
}
