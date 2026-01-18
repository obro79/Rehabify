"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Calendar, User, Phone, MapPin, Stethoscope, Pill, FileText, AlertCircle, Heart, Activity, FileCheck, Settings } from "lucide-react";
import Link from "next/link";

interface PatientMedicalInfo {
  id?: string;
  patientId: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  primaryCondition?: string | null;
  conditionType?: string | null;
  diagnosisDate?: string | null;
  primaryPhysician?: string | null;
  physicianPhone?: string | null;
  pastMedicalHistory?: any[];
  surgeries?: any[];
  allergies?: any[];
  medications?: any[];
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  additionalNotes?: string | null;
}

interface PatientRecord {
  assessments: any[];
  plans: any[];
  sessions: any[];
}

export default function PatientProfilePage() {
  const { addToast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [medicalInfo, setMedicalInfo] = React.useState<PatientMedicalInfo | null>(null);
  const [records, setRecords] = React.useState<PatientRecord | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState<Partial<PatientMedicalInfo>>({});

  // Fetch medical info and records
  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [medicalInfoRes, recordsRes] = await Promise.all([
          fetch("/api/patient-medical-info"),
          fetch("/api/patient-records"),
        ]);

        if (medicalInfoRes.ok) {
          const { data } = await medicalInfoRes.json();
          setMedicalInfo(data);
          setFormData(data || {});
        }

        if (recordsRes.ok) {
          const { data } = await recordsRes.json();
          setRecords(data);
        }
      } catch (error) {
        console.error("Failed to fetch patient data:", error);
        addToast({
          title: "Error",
          description: "Failed to load patient information",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [addToast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/patient-medical-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const { data } = await response.json();
      setMedicalInfo(data);
      setIsEditing(false);
      addToast({
        title: "Success",
        description: "Medical information updated successfully",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to save medical information",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(medicalInfo || {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading patient profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {/* Subtle organic background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-radial from-sage-100/25 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-radial from-terracotta-100/15 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patient Profile</h1>
          <p className="text-muted-foreground mt-1">
            Your medical information and health records
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button onClick={() => setIsEditing(true)} variant="primary">
                Edit Information
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/profile">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Medical Information Section */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Medical Information
          </CardTitle>
          <CardDescription>
            Your personal and medical details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              {isEditing ? (
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {medicalInfo?.dateOfBirth
                    ? new Date(medicalInfo.dateOfBirth).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not provided"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              {isEditing ? (
                <select
                  id="gender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.gender || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value || null })
                  }
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {medicalInfo?.gender
                    ? medicalInfo.gender.charAt(0).toUpperCase() +
                      medicalInfo.gender.slice(1)
                    : "Not provided"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {medicalInfo?.phoneNumber || "Not provided"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {medicalInfo?.address || "Not provided"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              {isEditing ? (
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {medicalInfo?.city || "Not provided"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              {isEditing ? (
                <Input
                  id="state"
                  value={formData.state || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {medicalInfo?.state || "Not provided"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              {isEditing ? (
                <Input
                  id="zipCode"
                  value={formData.zipCode || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {medicalInfo?.zipCode || "Not provided"}
                </p>
              )}
            </div>
          </div>

          {/* Medical Condition */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Condition & Diagnosis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryCondition">Primary Condition</Label>
                {isEditing ? (
                  <Input
                    id="primaryCondition"
                    value={formData.primaryCondition || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primaryCondition: e.target.value,
                      })
                    }
                    placeholder="e.g., Lower back pain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {medicalInfo?.primaryCondition || "Not provided"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditionType">Condition Type</Label>
                {isEditing ? (
                  <select
                    id="conditionType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.conditionType || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditionType: e.target.value || null,
                      })
                    }
                  >
                    <option value="">Select...</option>
                    <option value="acute">Acute</option>
                    <option value="chronic">Chronic</option>
                    <option value="post_surgical">Post-Surgical</option>
                    <option value="preventive">Preventive</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {medicalInfo?.conditionType
                      ? medicalInfo.conditionType
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")
                      : "Not provided"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosisDate">Diagnosis Date</Label>
                {isEditing ? (
                  <Input
                    id="diagnosisDate"
                    type="date"
                    value={formData.diagnosisDate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, diagnosisDate: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {medicalInfo?.diagnosisDate
                      ? new Date(medicalInfo.diagnosisDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Not provided"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryPhysician">Primary Physician</Label>
                {isEditing ? (
                  <Input
                    id="primaryPhysician"
                    value={formData.primaryPhysician || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primaryPhysician: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {medicalInfo?.primaryPhysician || "Not provided"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="physicianPhone">Physician Phone</Label>
                {isEditing ? (
                  <Input
                    id="physicianPhone"
                    type="tel"
                    value={formData.physicianPhone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        physicianPhone: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {medicalInfo?.physicianPhone || "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                {isEditing ? (
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContactName: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {medicalInfo?.emergencyContactName || "Not provided"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                {isEditing ? (
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {medicalInfo?.emergencyContactPhone || "Not provided"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                {isEditing ? (
                  <Input
                    id="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContactRelationship: e.target.value,
                      })
                    }
                    placeholder="e.g., Spouse, Parent"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {medicalInfo?.emergencyContactRelationship || "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="border-t pt-6 space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            {isEditing ? (
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, additionalNotes: e.target.value })
                }
                rows={4}
                placeholder="Any additional medical information or notes..."
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {medicalInfo?.additionalNotes || "No additional notes"}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} variant="primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button onClick={handleCancel} variant="ghost">
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Records Section */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Records
          </CardTitle>
          <CardDescription>
            Your assessments, treatment plans, and session history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assessments */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Assessments ({records?.assessments?.length || 0})
            </h3>
            {records?.assessments && records.assessments.length > 0 ? (
              <div className="space-y-2">
                {records.assessments.slice(0, 5).map((assessment) => (
                  <div
                    key={assessment.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          Assessment {new Date(assessment.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {assessment.completed ? "Completed" : "In Progress"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {records.assessments.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{records.assessments.length - 5} more assessments
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No assessments yet</p>
            )}
          </div>

          {/* Treatment Plans */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Treatment Plans ({records?.plans?.length || 0})
            </h3>
            {records?.plans && records.plans.length > 0 ? (
              <div className="space-y-2">
                {records.plans.slice(0, 5).map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(plan.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })} • Status: {plan.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {records.plans.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{records.plans.length - 5} more plans
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No treatment plans yet</p>
            )}
          </div>

          {/* Sessions */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Workout Sessions ({records?.sessions?.length || 0})
            </h3>
            {records?.sessions && records.sessions.length > 0 ? (
              <div className="space-y-2">
                {records.sessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          Session {new Date(session.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Duration: {Math.floor((session.durationSeconds || 0) / 60)} min • Status: {session.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {records.sessions.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{records.sessions.length - 5} more sessions
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No workout sessions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

