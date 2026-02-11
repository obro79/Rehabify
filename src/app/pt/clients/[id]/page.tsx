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
import {
  ArrowLeft,
  Mail,
  Edit,
  Check,
  X,
  BarChart3,
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
        <div className="h-40 rounded-2xl bg-sage-100/50 animate-pulse" />
        <div className="h-60 rounded-2xl bg-sage-100/50 animate-pulse" />
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
            src={client.avatarUrl}
            alt={client.name}
            size="lg"
            fallback={client.name.slice(0, 2)}
          />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {client.name}
              </h1>
              {client.currentPlan && (
                <StatusBadge
                  status={client.currentPlan.status === "rejected" ? "modified" : client.currentPlan.status}
                />
              )}
              {client.alerts.map((alert) => (
                <AlertBadge
                  key={alert.id}
                  type={mapAlertType(alert.type)}
                  severity={alert.severity as Alert["severity"]}
                />
              ))}
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
      {client.currentPlan && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>{client.currentPlan.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={client.currentPlan.status === "rejected" ? "modified" : client.currentPlan.status}
                  />
                  <span className="text-sm text-muted-foreground">
                    Created {formatRelativeDate(client.currentPlan.createdAt)}
                  </span>
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
            </div>
          </CardHeader>
          <CardContent>
            {/* Plan Notes */}
            <div className="space-y-2">
              {client.currentPlan.notes && (
                <p className="text-sm text-muted-foreground italic">
                  {client.currentPlan.notes}
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
                <TableHead>Form Score</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Pain Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map((session) => (
                <TableRow key={session.id}>
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
                      <span className="text-muted-foreground">-</span>
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
                      <span className="text-muted-foreground">-</span>
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
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No session history yet</p>
          </Card>
        )}
      </section>
    </div>
  );
}
