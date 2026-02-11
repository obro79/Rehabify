"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PatientList } from "@/components/pt/patient-list";
import { getTimeOfDayGreeting } from "@/lib/date-utils";
import { UsersIcon, ChartIcon, GuideIcon, AlertIcon } from "@/components/ui/icons";
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

  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const pendingReviews = patients.filter(
      (p) => p.currentPlan?.status === "pending_review"
    ).length;
    const patientsWithAlerts = patients.filter((p) => p.alerts.length > 0).length;
    const activePlans = patients.filter((p) => p.currentPlan != null).length;

    return {
      totalPatients,
      pendingReviews,
      patientsWithAlerts,
      activePlans,
    };
  }, [patients]);

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      const aHasAlerts = a.alerts.length > 0;
      const bHasAlerts = b.alerts.length > 0;

      if (aHasAlerts && !bHasAlerts) return -1;
      if (!aHasAlerts && bHasAlerts) return 1;

      const aDate = a.lastSession?.getTime() ?? 0;
      const bDate = b.lastSession?.getTime() ?? 0;

      return bDate - aDate;
    });
  }, [patients]);

  const handlePatientClick = (patientId: string) => {
    router.push(`/pt/clients/${patientId}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header - clean, no gradient */}
      <div className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sage-500 mb-1">
          PT Dashboard
        </p>
        <h1 className="text-2xl font-bold text-sage-900 tracking-tight">
          {greeting}, {ptName}
        </h1>
        <p className="text-sm text-sage-500 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatTile
          icon={<UsersIcon size="sm" variant="sage" />}
          label="Patients"
          value={stats.totalPatients}
        />
        <StatTile
          icon={<ChartIcon size="sm" variant="sage" />}
          label="Active Plans"
          value={stats.activePlans}
        />
        <StatTile
          icon={<GuideIcon size="sm" />}
          label="Pending Reviews"
          value={stats.pendingReviews}
          badge={stats.pendingReviews > 0 ? "Action needed" : undefined}
          badgeVariant={stats.pendingReviews > 0 ? "amber" : undefined}
        />
        <StatTile
          icon={<AlertIcon size="sm" variant="coral" />}
          label="Alerts"
          value={stats.patientsWithAlerts}
          badge={stats.patientsWithAlerts > 0 ? `${stats.patientsWithAlerts} patient${stats.patientsWithAlerts > 1 ? "s" : ""}` : undefined}
          badgeVariant={stats.patientsWithAlerts > 0 ? "coral" : undefined}
        />
      </div>

      {/* Patient List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-sage-900">
              Your Patients
            </h2>
            <p className="text-xs text-sage-500 mt-0.5">
              {loading
                ? "Loading..."
                : stats.patientsWithAlerts > 0
                  ? `${stats.patientsWithAlerts} patient${stats.patientsWithAlerts > 1 ? "s" : ""} with alerts shown first`
                  : patients.length > 0
                    ? "All patients progressing well"
                    : "No patients assigned yet"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-sage-50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <PatientList patients={sortedPatients} onPatientClick={handlePatientClick} />
        )}
      </div>
    </div>
  );
}

/* ─── Inline stat tile (pillowy, matches patient cards) ─── */

function StatTile({
  icon,
  label,
  value,
  badge,
  badgeVariant,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  badge?: string;
  badgeVariant?: "amber" | "coral";
}) {
  return (
    <div className="surface-organic p-5 transition-transform duration-200 hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-sage-900 tracking-tight">{value}</span>
        {badge && (
          <span className={`
            text-[10px] font-medium px-2 py-0.5 rounded-full
            ${badgeVariant === "coral" ? "bg-coral-50 text-coral-600" : ""}
            ${badgeVariant === "amber" ? "bg-amber-50 text-amber-600" : ""}
            ${!badgeVariant ? "bg-sage-50 text-sage-600" : ""}
          `}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
