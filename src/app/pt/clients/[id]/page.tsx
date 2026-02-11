"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import {
  ArrowLeft,
  Mail,
  Edit,
  Check,
  X,
  BarChart3,
  Activity,
  Flame,
  TrendingUp,
  AlertTriangle,
  ClipboardCheck,
  Calendar,
} from "lucide-react";
import { CalendarIcon } from "@/components/ui/icons";
import type { Alert } from "@/lib/mock-data/pt-data";

interface ClientAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
}

interface ClientPlan {
  id: string;
  name: string;
  status: "pending_review" | "approved" | "modified" | "rejected";
  exercises: Array<Record<string, unknown>>;
  createdAt: string;
  reviewedAt?: string;
  notes?: string;
  structure?: unknown;
}

interface ClientSession {
  id: string;
  date: string;
  formScore: number;
  duration: string;
  painLevel?: number;
  status: string;
  exercises: unknown;
}

interface ClientData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: string;
  memberSince: string;
  lastSession: string | null;
  currentPlan: ClientPlan | null;
  alerts: ClientAlert[];
  sessionHistory: ClientSession[];
}

/** Map DB alert types to display alert types */
function mapAlertType(dbType: string): Alert["type"] {
  const mapping: Record<string, Alert["type"]> = {
    high_pain: "pain_report",
    missed_sessions: "missed_session",
    declining_form: "declining_form",
    patient_concern: "pain_report",
  };
  return mapping[dbType] ?? "pain_report";
}

/**
 * Helper to format date for display
 */
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Helper to format relative date (e.g., "2 days ago")
 */
function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
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

/**
 * Get alert severity badge variant
 */
function getAlertBadgeVariant(
  severity: string
): "error" | "warning" | "info" {
  if (severity === "high" || severity === "critical") return "error";
  if (severity === "medium") return "warning";
  return "info";
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/pt/clients/${patientId}`, {
          headers: { "x-demo-role": "pt" },
        });
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const { data } = await response.json();
        setClient(data);
      } catch (err) {
        console.error("Error fetching client:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [patientId]);

  // Get session history
  const recentSessions = useMemo(() => {
    if (!client) return [];
    return client.sessionHistory.slice(0, 20);
  }, [client]);

  // Compute patient stats
  const stats = useMemo(() => {
    if (!client) return { totalSessions: 0, avgFormScore: 0, streak: 0 };

    const sessions = client.sessionHistory;
    const totalSessions = sessions.length;

    const scoredSessions = sessions.filter((s) => s.formScore > 0);
    const avgFormScore =
      scoredSessions.length > 0
        ? Math.round(
            scoredSessions.reduce((sum, s) => sum + s.formScore, 0) /
              scoredSessions.length
          )
        : 0;

    // Calculate streak: consecutive days with sessions from most recent
    let streak = 0;
    if (sessions.length > 0) {
      const sorted = [...sessions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = today;

      for (const session of sorted) {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round(
          (checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays <= 1) {
          streak++;
          checkDate = sessionDate;
        } else {
          break;
        }
      }
    }

    return { totalSessions, avgFormScore, streak };
  }, [client]);

  // Handle plan actions
  const handleApprove = async () => {
    if (!client?.currentPlan) return;
    try {
      const response = await fetch(`/api/plans/${client.currentPlan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-role": "pt",
        },
        body: JSON.stringify({ status: "approved" }),
      });
      if (response.ok) {
        setClient((prev) =>
          prev && prev.currentPlan
            ? {
                ...prev,
                currentPlan: { ...prev.currentPlan, status: "approved" },
              }
            : prev
        );
      }
    } catch (err) {
      console.error("Error approving plan:", err);
    }
  };

  const handleModify = () => {
    router.push(`/pt/clients/${patientId}/plan`);
  };

  const handleReject = async () => {
    if (!client?.currentPlan) return;
    try {
      const response = await fetch(`/api/plans/${client.currentPlan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-role": "pt",
        },
        body: JSON.stringify({ status: "modified" }),
      });
      if (response.ok) {
        setClient((prev) =>
          prev && prev.currentPlan
            ? {
                ...prev,
                currentPlan: { ...prev.currentPlan, status: "modified" },
              }
            : prev
        );
      }
    } catch (err) {
      console.error("Error rejecting plan:", err);
    }
  };

  // Loading state
  if (loading) {
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
        <div className="h-44 rounded-3xl bg-sage-100/50 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-3xl bg-sage-100/50 animate-pulse" />
          ))}
        </div>
        <div className="h-60 rounded-3xl bg-sage-100/50 animate-pulse" />
      </div>
    );
  }

  // If patient not found
  if (!client) {
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
        <Card variant="organic" className="p-8 text-center">
          <p className="text-muted-foreground">Patient not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-8">
      {/* Back Navigation */}
      <FadeIn>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pt/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </FadeIn>

      {/* Patient Profile Header */}
      <FadeIn delay={0.05}>
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-100 via-sage-50 to-white p-8 shadow-sm border border-sage-200/50">
          <div
            className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-sage-200/30 to-terracotta-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-sage-200/20 to-transparent rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"
            aria-hidden="true"
          />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <Avatar
              src={client.avatarUrl}
              alt={client.name}
              size="lg"
              fallback={client.name.slice(0, 2)}
            />
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {client.name}
                </h1>
                {client.currentPlan && (
                  <StatusBadge
                    status={client.currentPlan.status === "rejected" ? "modified" : client.currentPlan.status}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  Member since {formatDate(client.memberSince)}
                </span>
                {client.lastSession && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Last session {formatRelativeDate(client.lastSession)}
                  </span>
                )}
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
      </FadeIn>

      {/* Patient Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <Card variant="organic" className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-100 to-sage-200 shadow-pillowy-sm">
                <Activity className="h-5 w-5 text-sage-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalSessions}
                </p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card variant="organic" className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-pillowy-sm">
                <TrendingUp className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Form Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.avgFormScore > 0 ? `${stats.avgFormScore}%` : "--"}
                </p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card variant="organic" className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-terracotta-100 to-coral-200 shadow-pillowy-sm">
                <Flame className="h-5 w-5 text-terracotta-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.streak > 0 ? `${stats.streak} day${stats.streak !== 1 ? "s" : ""}` : "--"}
                </p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Active Alerts */}
      {client.alerts.length > 0 && (
        <FadeIn delay={0.15}>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-terracotta-500" />
              Active Alerts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {client.alerts.map((alert) => (
                <Card
                  key={alert.id}
                  variant="organic"
                  className="p-4 border-l-4"
                  style={{
                    borderLeftColor:
                      alert.severity === "high" || alert.severity === "critical"
                        ? "var(--color-red-400, #f87171)"
                        : alert.severity === "medium"
                        ? "var(--color-yellow-400, #facc15)"
                        : "var(--color-blue-400, #60a5fa)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <AlertBadge
                      type={mapAlertType(alert.type)}
                      severity={alert.severity as Alert["severity"]}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={getAlertBadgeVariant(alert.severity)}
                          size="sm"
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(alert.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Current Plan Status Card */}
      {client.currentPlan && (
        <FadeIn delay={0.2}>
          <Card variant="organic" className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="h-5 w-5 text-sage-600" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Current Plan
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-lg">
                    {client.currentPlan.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={client.currentPlan.status === "rejected" ? "modified" : client.currentPlan.status}
                    />
                    <span className="text-sm text-muted-foreground">
                      Created {formatRelativeDate(client.currentPlan.createdAt)}
                    </span>
                    {client.currentPlan.exercises.length > 0 && (
                      <Badge variant="muted" size="sm">
                        {client.currentPlan.exercises.length} exercises
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons for pending plans */}
                {client.currentPlan.status === "pending_review" && (
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

                {/* View plan button for approved/modified plans */}
                {(client.currentPlan.status === "approved" ||
                  client.currentPlan.status === "modified") && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/pt/clients/${patientId}/plan`}>
                      <Edit className="h-4 w-4 mr-2" />
                      View Plan
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {client.currentPlan.notes && (
                <div className="rounded-2xl bg-sage-50/60 p-4 border border-sage-100">
                  <p className="text-sm text-muted-foreground italic">
                    {client.currentPlan.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Session History Table */}
      <FadeIn delay={0.25}>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-sage-600" />
            Session History
          </h2>

          {recentSessions.length > 0 ? (
            <Card variant="organic" className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-sage-50/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Form Score</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Pain Level</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSessions.map((session) => (
                      <TableRow
                        key={session.id}
                        className="hover:bg-sage-50/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {formatDate(session.date)}
                        </TableCell>
                        <TableCell>
                          {session.formScore > 0 ? (
                            <Badge
                              variant={getFormScoreVariant(session.formScore)}
                              size="sm"
                            >
                              {session.formScore}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell>{session.duration}</TableCell>
                        <TableCell>
                          {session.painLevel !== undefined ? (
                            <span
                              className={`font-medium ${getPainLevelClass(session.painLevel)}`}
                            >
                              {session.painLevel}/10
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="muted" size="sm">
                            {session.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <Card variant="organic" className="p-8 text-center">
              <p className="text-muted-foreground">No session history yet</p>
            </Card>
          )}
        </section>
      </FadeIn>
    </div>
  );
}
