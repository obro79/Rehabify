"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import type { ProfileFormState, DialogState, Verbosity, SpeechSpeed } from "./types";

const DEFAULT_STATE: ProfileFormState = {
  displayName: "Sarah",
  email: "sarah@example.com",
  verbosity: "normal",
  speechSpeed: "normal",
  muteCoach: false,
  highContrast: false,
  reducedMotion: false,
  largerText: false,
};

export function useProfileForm() {
  const { addToast } = useToast();
  const [form, setForm] = useState<ProfileFormState>(DEFAULT_STATE);
  const [dialogs, setDialogs] = useState<DialogState>({
    clearHistory: false,
    deleteAccount: false,
  });

  const showToast = useCallback(
    (title: string, description: string, variant: "success" | "default" = "success") => {
      addToast({ title, description, variant });
    },
    [addToast]
  );

  const updateField = useCallback(
    <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K], message?: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (message) {
        showToast("Settings updated", message);
      }
    },
    [showToast]
  );

  const setDisplayName = useCallback(
    (value: string) => updateField("displayName", value),
    [updateField]
  );

  const saveDisplayName = useCallback(() => {
    showToast("Settings updated", "Display name updated (demo mode - not persisted)");
  }, [showToast]);

  const setVerbosity = useCallback(
    (value: string | string[]) => {
      if (typeof value === "string") {
        updateField("verbosity", value as Verbosity, `Voice verbosity set to ${value} (demo mode - not persisted)`);
      }
    },
    [updateField]
  );

  const setSpeechSpeed = useCallback(
    (value: string | string[]) => {
      if (typeof value === "string") {
        updateField("speechSpeed", value as SpeechSpeed, `Speech speed set to ${value} (demo mode - not persisted)`);
      }
    },
    [updateField]
  );

  const setMuteCoach = useCallback(
    (checked: boolean) => {
      const message = checked
        ? "Voice coach muted (demo mode - not persisted)"
        : "Voice coach enabled (demo mode - not persisted)";
      updateField("muteCoach", checked, message);
    },
    [updateField]
  );

  const setAccessibility = useCallback(
    (field: "highContrast" | "reducedMotion" | "largerText", checked: boolean) => {
      const labels = {
        highContrast: "High contrast mode",
        reducedMotion: "Reduced motion",
        largerText: "Larger text",
      };
      const action = checked ? "enabled" : "disabled";
      updateField(field, checked, `${labels[field]} ${action} (demo mode - not persisted)`);
    },
    [updateField]
  );

  const changePassword = useCallback(() => {
    showToast("Coming soon", "Password change functionality will be available soon", "default");
  }, [showToast]);

  const exportData = useCallback(() => {
    showToast("Coming soon", "Data export functionality will be available soon", "default");
  }, [showToast]);

  const openDialog = useCallback((dialog: keyof DialogState) => {
    setDialogs((prev) => ({ ...prev, [dialog]: true }));
  }, []);

  const closeDialog = useCallback((dialog: keyof DialogState) => {
    setDialogs((prev) => ({ ...prev, [dialog]: false }));
  }, []);

  const clearHistory = useCallback(() => {
    closeDialog("clearHistory");
    showToast("History cleared", "Your session history has been cleared");
  }, [closeDialog, showToast]);

  const deleteAccount = useCallback(() => {
    closeDialog("deleteAccount");
    showToast("Account deletion requested", "This feature is not yet implemented", "default");
  }, [closeDialog, showToast]);

  return {
    form,
    dialogs,
    setDisplayName,
    saveDisplayName,
    setVerbosity,
    setSpeechSpeed,
    setMuteCoach,
    setAccessibility,
    changePassword,
    exportData,
    openDialog,
    closeDialog,
    clearHistory,
    deleteAccount,
  };
}
