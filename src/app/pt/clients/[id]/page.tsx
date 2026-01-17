"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePTStore } from "@/stores/pt-store";
import { StatusBadge } from "@/components/pt/status-badge";
import { AlertBadge } from "@/components/pt/alert-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Mail,
  Edit,
  Check,
  X,
  BarChart3,
} from "lucide-react";
import { CalendarIcon } from "@/components/ui/icons";
import type { Session } from "@/lib/mock-data/pt-data";

/**
 * Helper to format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Helper to format relative date (e.g., "2 days ago")
 */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

/**
 * Get form score badge variant based on score
 */
function getFormScoreVariant(score: number): "success" | "warning" | "error" {
  if (score >= 85) return "success";
  if (score >= 70) return "warning";
  return "error";
}

/**
 * Get pain level display color class
 */
function getPainLevelClass(painLevel: number): string {
  if (painLevel <= 3) return "text-green-600";
  if (painLevel <= 6) return "text-yellow-600";
  return "text-red-600";
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const getPatientById = usePTStore((state) => state.getPatientById);
  const updatePlanStatus = usePTStore((state) => state.updatePlanStatus);

  const patient = getPatientById(patientId);

  // Get last 4-6 weeks of session history (most recent first)
  const recentSessions = useMemo(() => {
    if (!patient) return [];

    // Sort sessions by date (most recent first) and take last 28-42 days
    const sortedSessions = [...patient.sessionHistory]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20); // Limit to ~20 sessions for display

    return sortedSessions;
  }, [patient]);

  // Handle plan actions
  const handleApprove = () => {
    updatePlanStatus(patientId, "approved");
  };

  const handleModify = () => {
    router.push(`/pt/clients/${patientId}/plan`);
  };

  const handleReject = () => {
    updatePlanStatus(patientId, "rejected");
  };

  // If patient not found
  if (!patient) {
    return (
      <div className="max-w-7xl space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pt/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Patient not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-8">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pt/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Patient Profile Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sage-100 via-sage-50 to-white p-6 shadow-sm border border-sage-200/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sage-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <Avatar
            src={patient.avatarUrl}
            alt={patient.name}
            size="lg"
            fallback={patient.name.slice(0, 2)}
          />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {patient.name}
              </h1>
              <StatusBadge
                status={patient.currentPlan?.status || "pending_review"}
              />
              {patient.alerts.map((alert) => (
                <AlertBadge
                  key={alert.id}
                  type={alert.type}
                  severity={alert.severity}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {patient.email}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                Member since {formatDate(patient.memberSince)}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" asChild>
              <Link href={`/pt/clients/${patientId}/plan`}>
                <Edit className="h-4 w-4 mr-2" />
                Plan Builder
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/pt/clients/${patientId}/analytics`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Current Plan Status Card */}
      {patient.currentPlan && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>{patient.currentPlan.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge status={patient.currentPlan.status} />
                  <span className="text-sm text-muted-foreground">
                    Created {formatRelativeDate(patient.currentPlan.createdAt)}
                  </span>
                </div>
              </div>

              {/* Action Buttons for pending plans */}
              {patient.currentPlan.status === "pending_review" && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={handleApprove}>
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleModify}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modify
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Plan Exercises */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-sage-600">
                Exercises ({patient.currentPlan.exercises.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {patient.currentPlan.exercises.map((exercise) => (
                  <Badge key={exercise.id} variant="muted" size="sm">
                    {exercise.name}
                    {exercise.holdSeconds
                      ? ` - ${exercise.sets}x${exercise.holdSeconds}s`
                      : ` - ${exercise.sets}x${exercise.reps}`}
                  </Badge>
                ))}
              </div>
              {patient.currentPlan.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  {patient.currentPlan.notes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History Table */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Session History
        </h2>

        {recentSessions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead>Form Score</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Pain Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map((session: Session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {formatDate(session.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {session.exerciseName}
                      <Badge variant="muted" size="sm">
                        {session.category}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getFormScoreVariant(session.formScore)}
                      size="sm"
                    >
                      {session.formScore}%
                    </Badge>
                  </TableCell>
                  <TableCell>{session.duration}</TableCell>
                  <TableCell>{session.repCount}</TableCell>
                  <TableCell>
                    {session.painLevel !== undefined ? (
                      <span
                        className={`font-medium ${getPainLevelClass(session.painLevel)}`}
                      >
                        {session.painLevel}/10
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No session history yet</p>
          </Card>
        )}
      </section>
    </div>
  );
}
