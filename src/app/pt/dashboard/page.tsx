"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatsCard } from "@/components/ui/stats-card";
import { PatientList } from "@/components/pt/patient-list";
import { usePTStore } from "@/stores/pt-store";
import { GuideIcon, UsersIcon, AlertIcon } from "@/components/ui/icons";
import { Copy } from "lucide-react";
import { SanctuaryBackground } from "@/components/ui/sanctuary-background";
import { Button } from "@/components/ui/button";
import { getPTProfile, getPTPatients } from "../actions";

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function PTDashboardPage() {
  const router = useRouter();
  const mockPatients = usePTStore((state) => state.patients);
  const [patients, setPatients] = useState<any[]>(mockPatients);
  const [ptName, setPtName] = useState("Dr. Anderson");
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const greeting = getTimeOfDayGreeting();

  useEffect(() => {
    // Fetch PT Profile
    getPTProfile().then((profile) => {
      if (profile) {
        setPtName(profile.displayName || "Physical Therapist");
        setJoinCode(profile.joinCode);
      }
    }).catch(console.error);

    // Fetch Patients
    getPTPatients().then((fetchedPatients) => {
      if (fetchedPatients && fetchedPatients.length > 0) {
        setPatients(fetchedPatients);
      }
    }).catch(console.error);
  }, []);

  // Calculate stats from patient data
  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const pendingReviews = patients.filter(
      (p) => p.currentPlan?.status === "pending_review"
    ).length;
    const patientsWithAlerts = patients.filter((p) => p.alerts && p.alerts.length > 0).length;

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
      const aHasAlerts = a.alerts && a.alerts.length > 0;
      const bHasAlerts = b.alerts && b.alerts.length > 0;

      if (aHasAlerts && !bHasAlerts) return -1;
      if (!aHasAlerts && bHasAlerts) return 1;

      // Then sort by last session date (most recent first)
      const aDate = a.lastSession ? new Date(a.lastSession).getTime() : 0;
      const bDate = b.lastSession ? new Date(b.lastSession).getTime() : 0;

      return bDate - aDate;
    });
  }, [patients]);

  const handlePatientClick = (patientId: string) => {
    router.push(`/pt/clients/${patientId}`);
  };

  const handleCopyCode = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinCode);
      // toast.success("Join code copied to clipboard");
      alert("Join code copied to clipboard"); // Fallback
    }
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

        {/* Join Code Section */}
        {joinCode && (
          <section className="bg-white/80 p-6 rounded-2xl border border-sage-200 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-sage-900 mb-1">Invite Patients</h2>
                <p className="text-sage-600 text-sm">
                  Share this unique code with your patients to connect them to your practice.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-sage-50 px-6 py-3 rounded-xl font-mono text-2xl font-bold tracking-wider text-sage-800 border-2 border-dashed border-sage-300 min-w-[140px] text-center">
                  {joinCode}
                </div>
                <Button variant="primary" size="icon" onClick={handleCopyCode} className="h-14 w-14 rounded-xl border-sage-200 hover:bg-sage-50 text-sage-700">
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </section>
        )}

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
              {stats.patientsWithAlerts > 0
                ? `${stats.patientsWithAlerts} patient${stats.patientsWithAlerts > 1 ? "s" : ""} with alerts shown first`
                : "All patients are progressing well"}
            </p>
          </div>
        </div>

        <PatientList patients={sortedPatients} onPatientClick={handlePatientClick} />
      </section>
      </div>
    </SanctuaryBackground>
  );
}