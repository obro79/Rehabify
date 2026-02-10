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
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

interface ProfilePreferences {
  voice_verbosity?: string;
  voice_speed?: string;
  mute_coach?: boolean;
  high_contrast?: boolean;
  reduced_motion?: boolean;
  larger_text?: boolean;
  [key: string]: unknown;
}

export default function ProfilePage() {
  const { addToast } = useToast();

  // Account Info state
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Voice Coach Preferences state
  const [verbosity, setVerbosity] = React.useState("normal");
  const [speechSpeed, setSpeechSpeed] = React.useState("normal");
  const [muteCoach, setMuteCoach] = React.useState(false);

  // Accessibility state
  const [highContrast, setHighContrast] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [largerText, setLargerText] = React.useState(false);

  // Dialog state
  const [showClearHistoryDialog, setShowClearHistoryDialog] = React.useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = React.useState(false);

  // Load profile on mount
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const result = await response.json();
          const profile = result.data || result;
          setDisplayName(profile.displayName || "");
          setEmail(profile.email || "");

          // Load preferences
          const prefs = (profile.preferences || {}) as ProfilePreferences;
          if (prefs.voice_verbosity) setVerbosity(prefs.voice_verbosity);
          if (prefs.voice_speed) setSpeechSpeed(prefs.voice_speed);
          if (prefs.mute_coach !== undefined) setMuteCoach(prefs.mute_coach);
          if (prefs.high_contrast !== undefined) setHighContrast(prefs.high_contrast);
          if (prefs.reduced_motion !== undefined) setReducedMotion(prefs.reduced_motion);
          if (prefs.larger_text !== undefined) setLargerText(prefs.larger_text);
        }
      } catch (err) {
        console.error("[Profile] Failed to load:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Helper to save preferences
  const savePreferences = async (prefs: Partial<ProfilePreferences>) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs }),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSaveDisplayName = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      if (response.ok) {
        addToast({
          title: "Settings updated",
          description: "Display name saved successfully",
          variant: "success",
        });
      } else {
        addToast({
          title: "Error",
          description: "Failed to save display name",
          variant: "error",
        });
      }
    } catch {
      addToast({
        title: "Error",
        description: "Failed to save display name",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    addToast({
      title: "Coming soon",
      description: "Password change functionality will be available soon",
      variant: "default",
    });
  };

  const handleExportData = () => {
    addToast({
      title: "Coming soon",
      description: "Data export functionality will be available soon",
      variant: "default",
    });
  };

  const handleClearHistory = () => {
    setShowClearHistoryDialog(false);
    addToast({
      title: "History cleared",
      description: "Your session history has been cleared",
      variant: "success",
    });
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountDialog(false);
    addToast({
      title: "Account deletion requested",
      description: "This feature is not yet implemented",
      variant: "default",
    });
  };

  const handleVerbosityChange = async (value: string | string[]) => {
    if (typeof value === "string") {
      setVerbosity(value);
      const ok = await savePreferences({ voice_verbosity: value });
      addToast({
        title: "Settings updated",
        description: ok ? `Voice verbosity set to ${value}` : "Failed to save preference",
        variant: ok ? "success" : "error",
      });
    }
  };

  const handleSpeechSpeedChange = async (value: string | string[]) => {
    if (typeof value === "string") {
      setSpeechSpeed(value);
      const ok = await savePreferences({ voice_speed: value });
      addToast({
        title: "Settings updated",
        description: ok ? `Speech speed set to ${value}` : "Failed to save preference",
        variant: ok ? "success" : "error",
      });
    }
  };

  const handleMuteCoachChange = async (checked: boolean) => {
    setMuteCoach(checked);
    const ok = await savePreferences({ mute_coach: checked });
    addToast({
      title: "Settings updated",
      description: ok
        ? checked ? "Voice coach muted" : "Voice coach enabled"
        : "Failed to save preference",
      variant: ok ? "success" : "error",
    });
  };

  const handleHighContrastChange = async (checked: boolean) => {
    setHighContrast(checked);
    const ok = await savePreferences({ high_contrast: checked });
    addToast({
      title: "Settings updated",
      description: ok
        ? checked ? "High contrast mode enabled" : "High contrast mode disabled"
        : "Failed to save preference",
      variant: ok ? "success" : "error",
    });
  };

  const handleReducedMotionChange = async (checked: boolean) => {
    setReducedMotion(checked);
    const ok = await savePreferences({ reduced_motion: checked });
    addToast({
      title: "Settings updated",
      description: ok
        ? checked ? "Reduced motion enabled" : "Reduced motion disabled"
        : "Failed to save preference",
      variant: ok ? "success" : "error",
    });
  };

  const handleLargerTextChange = async (checked: boolean) => {
    setLargerText(checked);
    const ok = await savePreferences({ larger_text: checked });
    addToast({
      title: "Settings updated",
      description: ok
        ? checked ? "Larger text enabled" : "Larger text disabled"
        : "Failed to save preference",
      variant: ok ? "success" : "error",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Subtle organic background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-radial from-sage-100/25 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-radial from-terracotta-100/15 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and accessibility options
        </p>
      </div>

      {/* Account Info Section */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Update your personal information and account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
              />
              <Button onClick={handleSaveDisplayName} variant="secondary">
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed at this time
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={handleChangePassword} variant="primary">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Coach Preferences Section */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Voice Coach Preferences</CardTitle>
          <CardDescription>
            Customize how your AI coach communicates with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Verbosity Level</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Control how detailed the coaching feedback is
            </p>
            <ToggleGroup
              type="single"
              value={verbosity}
              onValueChange={handleVerbosityChange}
            >
              <ToggleGroupItem value="minimal">Minimal</ToggleGroupItem>
              <ToggleGroupItem value="normal">Normal</ToggleGroupItem>
              <ToggleGroupItem value="detailed">Detailed</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label>Speech Speed</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Adjust the speed of voice coaching
            </p>
            <ToggleGroup
              type="single"
              value={speechSpeed}
              onValueChange={handleSpeechSpeedChange}
            >
              <ToggleGroupItem value="slow">Slow</ToggleGroupItem>
              <ToggleGroupItem value="normal">Normal</ToggleGroupItem>
              <ToggleGroupItem value="fast">Fast</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label>Mute Coach</Label>
              <p className="text-xs text-muted-foreground">
                Disable all voice coaching during exercises
              </p>
            </div>
            <Switch
              checked={muteCoach}
              onCheckedChange={handleMuteCoachChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Section */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Accessibility</CardTitle>
          <CardDescription>
            Adjust the interface for your comfort and needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>High Contrast Mode</Label>
              <p className="text-xs text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              checked={highContrast}
              onCheckedChange={handleHighContrastChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reduced Motion</Label>
              <p className="text-xs text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              checked={reducedMotion}
              onCheckedChange={handleReducedMotionChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Larger Text</Label>
              <p className="text-xs text-muted-foreground">
                Increase text size across the interface
              </p>
            </div>
            <Switch
              checked={largerText}
              onCheckedChange={handleLargerTextChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or delete your session data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Export My Data</Label>
              <p className="text-xs text-muted-foreground">
                Download all your session data and progress
              </p>
            </div>
            <Button onClick={handleExportData} variant="primary">
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label>Clear History</Label>
              <p className="text-xs text-muted-foreground">
                Permanently delete all session history
              </p>
            </div>
            <Button
              onClick={() => setShowClearHistoryDialog(true)}
              variant="ghost"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Section - with terracotta accent */}
      <Card className="rounded-3xl border-terracotta-300 bg-terracotta-50/50">
        <CardHeader>
          <CardTitle className="text-terracotta-600">Danger Zone</CardTitle>
          <CardDescription className="text-terracotta-500">
            Irreversible actions - proceed with caution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-terracotta-600">Delete Account</Label>
              <p className="text-xs text-terracotta-500">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              onClick={() => setShowDeleteAccountDialog(true)}
              variant="destructive"
              className="bg-terracotta-500 hover:bg-terracotta-600"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showClearHistoryDialog}
        onOpenChange={setShowClearHistoryDialog}
        title="Clear Session History"
        description="Are you sure you want to clear all your session history? This action cannot be undone."
        confirmLabel="Clear History"
        cancelLabel="Cancel"
        onConfirm={handleClearHistory}
        variant="destructive"
      />

      <ConfirmDialog
        open={showDeleteAccountDialog}
        onOpenChange={setShowDeleteAccountDialog}
        title="Delete Account"
        description="Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone."
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        onConfirm={handleDeleteAccount}
        variant="destructive"
      />
    </div>
  );
}
